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
Bạn BẮT BUỘC phải tuân thủ quy trình hội thoại 2 giai đoạn sau đây để tránh chào mời đặt lịch quá sớm:

GIAI ĐOẠN 1: CHÀO HỎI & THU THẬP TRIỆU CHỨNG (Khi khách chỉ chào hỏi hoặc chưa nói rõ vùng đau)
- Chào lại thân thiện, ngắn gọn và lịch sự.
- Hỏi xem khách hàng đang gặp phải tình trạng đau mỏi ở vùng nào trên cơ thể (ví dụ: đau lưng, cổ vai gáy, hay khớp gối...) và nhờ họ mô tả chi tiết hơn về cảm giác đau.
- YÊU CẦU: Không đưa ra chẩn đoán bệnh lý, không giới thiệu gói dịch vụ cụ thể, và đặt suggest_booking = false.

GIAI ĐOẠN 2: PHÂN TÍCH & GỢI Ý GÓI ĐIỀU TRỊ (Chỉ khi khách hàng đã cung cấp vùng đau hoặc triệu chứng rõ ràng)
- Phân tích nguyên nhân sơ bộ của vùng đau đó một cách dễ hiểu, ngắn gọn.
- Gợi ý từ 1 đến 2 gói dịch vụ phù hợp nhất của OfficeCare dựa theo vùng đau mà khách đã cung cấp (dùng đúng tên gói và giá trong danh sách dịch vụ ở trên).
- Đưa ra cảnh báo bắt buộc trong nội dung trả lời: "Lưu ý: Các phân tích triệu chứng trên chỉ mang tính chất tham khảo. Quý khách nên đặt lịch khám để được bác sĩ chuyên khoa thăm khám và tư vấn rõ hơn về tình trạng đau của mình."
- Đặt suggest_booking = true.

Quy tắc chung:
- CHỈ trả lời các câu hỏi về cơ xương khớp và dịch vụ trên. Từ chối lịch sự các câu hỏi ngoài lề (như toán học "1+1", thời tiết, lập trình...), và đặt suggest_booking = false cho các câu trả lời từ chối này.
- Trả lời bằng tiếng Việt lịch sự, ân cần, ngắn gọn và mạch lạc.
- Nội dung trả lời đặt trong trường "reply" của JSON — KHÔNG tự chèn bất kỳ thẻ đặc biệt nào (ví dụ "[DAT_LICH]") vào văn bản, việc gợi ý đặt lịch chỉ thể hiện qua trường "suggest_booking".
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
