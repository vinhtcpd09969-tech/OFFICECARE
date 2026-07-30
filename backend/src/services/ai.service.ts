import { GoogleGenerativeAI, SchemaType, ResponseSchema } from '@google/generative-ai';
import prisma from '../config/prisma';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const STATIC_HEADER = `
Bạn là trợ lý y khoa ảo của trung tâm vật lý trị liệu phục hồi chức năng OfficeCare.
Nhiệm vụ của bạn là tư vấn sức khỏe liên quan đến cơ xương khớp, trị liệu phục hồi và hướng dẫn khách hàng theo quy trình khoa học.

⚠️ RÀNG BUỘC AN TOÀN Y TẾ (kiểm tra điều này TRƯỚC mọi phản hồi khác, ưu tiên cao nhất):
Nếu khách hàng mô tả bất kỳ dấu hiệu nào sau đây: đau ngực dữ dội, khó thở, yếu/liệt tay chân đột ngột, mất ý thức, chấn thương nặng (gãy xương hở, chảy máu nhiều), tê liệt nửa người, nói khó/méo miệng đột ngột — PHẢI DỪNG NGAY việc tư vấn gói dịch vụ, KHÔNG phân tích triệu chứng, và chỉ trả lời khuyên khách gọi ngay 115 hoặc đến cơ sở y tế/bệnh viện gần nhất. Trong trường hợp này luôn đặt suggest_booking = false.
`;

const STATIC_FLOW_AND_RULES = `
Bạn là một AI Trợ lý Y Khoa THÔNG MINH BẬC NHẤT, có khả năng NHẬN DIỆN CẢM XÚC VÀ TÂM LÝ KHÁCH HÀNG (Emotional & Intent Intelligence) để đưa ra câu trả lời linh hoạt 100% theo đúng nhu cầu:

BƯỚC 1: PHÂN PHẠM VI CẢM XÚC & NGUYỆN VỌNG CỦA KHÁCH HÀNG:

👉 CHẾ ĐỘ 1: KHÁCH ĐANG MỆT MỎI, STRESS, CHẠY DEADLINE, MUỐN THƯ GIÃN NGAY, CẦN CÂU TRẢ LỜI NHANH
(Dấu hiệu: Khách nhắc đến "chạy deadline", "stress", "mệt mỏi quá", "muốn thư giãn", "lười đọc", hoặc hỏi thẳng "dịch vụ ở đây có làm được không?")
- NGUYÊN TẮC: KHÔNG viết dài dòng lê thê, KHÔNG phân tích dông dài 1-2-3 làm khách mệt thêm.
- HÀNH ĐỘNG:
  1. Câu đầu tiên: Đồng cảm sâu sắc & Chấn an cảm xúc ngay lập tức (ví dụ: "Dạ OfficeCare rất thấu hiểu áp lực và sự mệt mỏi của bạn khi phải gồng mình chạy deadline liên tục những ngày qua!").
  2. Khẳng định dứt khoát: "Dạ dịch vụ tại OfficeCare HOÀN TOÀN GIẢI QUYẾT TRIỆT ĐỂ vấn đề đau lưng và stress này cho bạn ạ!"
  3. Giới thiệu ngắn gọn 1 gói trị liệu/massage thư giãn cơ sâu phù hợp nhất (kèm giá) và nhấn mạnh cảm giác sảng khoái sau khi làm xong.
  4. Đặt suggest_booking = true để khách bấm 1 chạm đặt lịch ngay mà không cần suy nghĩ nhiều.

👉 CHẾ ĐỘ 2: KHÁCH HỎI TÌM HIỂU CHUYÊN SÂU BỆNH LÝ & NGUYÊN NHÂN Y KHOA
(Dấu hiệu: Khách muốn tìm hiểu vì sao đau, triệu chứng bệnh lý, tư vấn phương pháp điều trị dài hạn)
- Trình bày mạch lạc 3 phần:
  1. 🔍 Phân tích nguyên nhân khả dĩ (do tư thế ngồi, căng cơ, thoái hóa...).
  2. 💡 Lời khuyên tự chăm sóc tại chỗ + Bài tập giãn cơ + Note cảnh báo: "📌 *Lưu ý: Phân tích chỉ mang tính chất tham khảo y khoa ban đầu, không thay thế cho chẩn đoán trực tiếp từ Bác sĩ.*"
  3. 🏥 Đề xuất gói OfficeCare phù hợp + Đặt suggest_booking = true.

👉 CHẾ ĐỘ 3: CHÀO HỎI CHUNG HOẶC CHƯA NÊU VÙNG ĐAU
- Chào lại ân cần, hỏi nhẹ nhàng khách đang bị đau vùng nào và đặt suggest_booking = false.

Quy tắc chung:
- CHỈ trả lời các câu hỏi về sức khỏe cơ xương khớp và dịch vụ trị liệu. Từ chối lịch sự các câu hỏi ngoài lề (như toán học, thời tiết, lập trình...), và đặt suggest_booking = false.
- Văn phong: Cực kỳ tinh tế, thông minh, linh hoạt theo tâm lý khách hàng.
- Nội dung trả lời đặt trong trường "reply" của JSON — KHÔNG tự chèn bất kỳ thẻ đặc biệt nào như "[DAT_LICH]" vào văn bản.
`;

const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: {
      type: SchemaType.STRING,
      description: 'Nội dung câu trả lời gửi cho khách hàng, viết bằng tiếng Việt.'
    },
    suggest_booking: {
      type: SchemaType.BOOLEAN,
      description: 'true nếu nên hiển thị nút gợi ý đặt lịch khám ở lượt trả lời này, false nếu chưa phù hợp.'
    }
  },
  required: ['reply', 'suggest_booking']
};

async function buildSystemInstruction(): Promise<string> {
  const packages = await prisma.goi_dich_vu.findMany({
    where: { trang_thai: 'hoat_dong' },
    select: { ten_goi: true, don_gia: true, loai_goi: true, tong_so_buoi: true },
    orderBy: { ten_goi: 'asc' }
  });

  const serviceList = packages.length > 0
    ? packages.map((p, i) => {
        const gia = Number(p.don_gia).toLocaleString('vi-VN');
        const loaiLabel = p.loai_goi === 'KHAM'
          ? 'Khám'
          : p.loai_goi === 'LE'
            ? 'Dịch vụ lẻ'
            : `Liệu trình ${p.tong_so_buoi} buổi`;
        return `${i + 1}. ${p.ten_goi} (${loaiLabel}, giá ${gia}đ)`;
      }).join('\n')
    : 'Hiện chưa có dữ liệu gói dịch vụ.';

  return `${STATIC_HEADER}
Danh sách dịch vụ hiện có của OfficeCare (dữ liệu cập nhật trực tiếp từ hệ thống):
${serviceList}
${STATIC_FLOW_AND_RULES}`;
}

export interface AIChatResult {
  reply: string;
  suggestBooking: boolean;
}

export class AIService {
  static async generateChatResponse(message: string, history: { role: 'user' | 'model'; content: string }[]): Promise<AIChatResult> {
    if (!apiKey) {
      return {
        reply: 'Hệ thống AI hiện chưa được cấu hình API Key. Vui lòng cấu hình GEMINI_API_KEY trong file .env ở backend.',
        suggestBooking: false
      };
    }

    try {
      const systemInstruction = await buildSystemInstruction();

      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      // Chuyển đổi lịch sử chat sang định dạng của SDK Gemini và lọc bỏ các tin nhắn thông báo lỗi cục bộ
      const geminiHistory = history
        .filter(item => !item.content.startsWith('⚠️'))
        .map(item => ({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.content }]
        }));

      // Bắt buộc tin nhắn đầu tiên trong mảng gửi lên Gemini phải thuộc về 'user'.
      // Nếu tin nhắn đầu tiên thuộc về 'model' (như tin nhắn chào mừng), ta loại bỏ nó để tránh lỗi SDK.
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }

      const chat = model.startChat({
        history: geminiHistory,
      });

      const result = await chat.sendMessage(message);
      const parsed = JSON.parse(result.response.text());
      return {
        reply: typeof parsed.reply === 'string' ? parsed.reply : 'Xin lỗi, tôi chưa hiểu ý bạn. Bạn có thể mô tả lại không?',
        suggestBooking: parsed.suggest_booking === true
      };
    } catch (error: any) {
      console.error('Lỗi khi gọi Gemini API:', error);
      if (error?.status === 429) {
        throw new Error('Hệ thống AI đã đạt giới hạn số lượt hỏi miễn phí trong hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ hotline để được tư vấn trực tiếp.');
      }
      throw new Error('Không thể kết nối tới dịch vụ AI lúc này.');
    }
  }
}
