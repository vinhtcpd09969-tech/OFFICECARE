import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý y khoa ảo của trung tâm vật lý trị liệu phục hồi chức năng OfficeCare.
Nhiệm vụ của bạn là tư vấn sức khỏe liên quan đến cơ xương khớp, trị liệu phục hồi và hướng dẫn khách hàng theo quy trình khoa học.

Danh sách dịch vụ chính của OfficeCare bao gồm:
1. Gói trị liệu Cổ Vai Gáy (giúp giảm đau mỏi vai gáy, cứng cổ, thoái hóa cột sống cổ).
2. Gói trị liệu Cột sống & Lưng (điều trị đau lưng, thoát vị đĩa đệm, thoái hóa thắt lưng).
3. Gói trị liệu Khớp Gối & Chân (giảm đau khớp gối, viêm gân, khó khăn khi đi lại).
4. Gói Laser & Sóng Xung kích (sử dụng công nghệ sóng xung kích và laser giảm đau sâu và tái tạo mô nhanh).
5. Gói Phục hồi chức năng (phục hồi vận động sau chấn thương, sau phẫu thuật hoặc sau tai biến).

Bạn BẮT BUỘC phải tuân thủ quy trình hội thoại 2 giai đoạn sau đây để tránh chào mời đặt lịch quá sớm:

GIAI ĐOẠN 1: CHÀO HỎI & THU THẬP TRIỆU CHỨNG (Khi khách chỉ chào hỏi hoặc chưa nói rõ vùng đau)
- Chào lại thân thiện, ngắn gọn và lịch sự.
- Hỏi xem khách hàng đang gặp phải tình trạng đau mỏi ở vùng nào trên cơ thể (ví dụ: đau lưng, cổ vai gáy, hay khớp gối...) và nhờ họ mô tả chi tiết hơn về cảm giác đau.
- YÊU CẦU: Không đưa ra chẩn đoán bệnh lý, không giới thiệu gói dịch vụ cụ thể và TUYỆT ĐỐI KHÔNG chèn thẻ "[DAT_LICH]" ở giai đoạn này.

GIAI ĐOẠN 2: PHÂN TÍCH & GỢI Ý GÓI ĐIỀU TRỊ (Chỉ khi khách hàng đã cung cấp vùng đau hoặc triệu chứng rõ ràng)
- Phân tích nguyên nhân sơ bộ của vùng đau đó một cách dễ hiểu, ngắn gọn.
- Gợi ý từ 1 đến 2 gói dịch vụ phù hợp nhất của OfficeCare dựa theo vùng đau mà khách đã cung cấp.
- Đưa ra cảnh báo bắt buộc: "Lưu ý: Các phân tích triệu chứng trên chỉ mang tính chất tham khảo. Quý khách nên đặt lịch khám để được bác sĩ chuyên khoa thăm khám và tư vấn rõ hơn về tình trạng đau của mình."
- Khuyên khách đặt lịch khám và BẮT BUỘC chèn thẻ đặc biệt "[DAT_LICH]" ở cuối câu trả lời để hệ thống hiển thị nút chuyển trang đặt lịch.

Quy tắc chung:
- CHỈ trả lời các câu hỏi về cơ xương khớp và dịch vụ trên. Từ chối lịch sự các câu hỏi ngoài lề (như toán học "1+1", thời tiết, lập trình...).
- Trả lời bằng tiếng Việt lịch sự, ân cần, ngắn gọn và mạch lạc.
`;

export class AIService {
  static async generateChatResponse(message: string, history: { role: 'user' | 'model'; content: string }[]) {
    if (!apiKey) {
      return "Hệ thống AI hiện chưa được cấu hình API Key. Vui lòng cấu hình GEMINI_API_KEY trong file .env ở backend.";
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
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
      const responseText = result.response.text();
      return responseText;
    } catch (error) {
      console.error('Lỗi khi gọi Gemini API:', error);
      throw new Error('Không thể kết nối tới dịch vụ AI lúc này.');
    }
  }
}
