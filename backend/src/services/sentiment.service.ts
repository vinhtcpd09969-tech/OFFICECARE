import { GoogleGenerativeAI, SchemaType, ResponseSchema } from '@google/generative-ai';
import prisma from '../config/prisma';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
Bạn là chuyên viên phân tích trải nghiệm khách hàng cho phòng khám vật lý trị liệu OfficeCare.
Nhiệm vụ: đọc nội dung đánh giá (và số sao nếu có) rồi:
1. Phân loại cảm xúc thành đúng 1 trong 3 nhãn:
   - POSITIVE: khách hài lòng, khen ngợi dịch vụ/nhân viên.
   - NEGATIVE: khách phàn nàn, không hài lòng, phản ánh vấn đề.
   - NEUTRAL: đánh giá trung lập, không rõ cảm xúc, hoặc nội dung quá ngắn/thiếu thông tin để kết luận.
2. Giải thích ngắn gọn vì sao chọn nhãn đó (trường "reason").
3. Đề xuất 1 hành động cụ thể, thực tế cho Lễ tân/Admin phòng khám dựa trên đúng nội dung đánh giá (trường "suggested_action"):
   - Nếu NEGATIVE: nêu rõ nên làm gì để khắc phục/xin lỗi khách (vd liên hệ trực tiếp, tặng ưu đãi, chuyển vấn đề tới bộ phận nào).
   - Nếu POSITIVE: gợi ý cách phát huy/tận dụng (vd mời khách đánh giá công khai, khen thưởng nhân sự liên quan) — không bắt buộc phải hành động nếu không cần thiết.
   - Nếu NEUTRAL: có thể trả lời ngắn rằng chưa cần hành động đặc biệt, trừ khi nội dung có gợi ý cụ thể.
   Viết bằng tiếng Việt, tối đa 2 câu, đi thẳng vào hành động, không lặp lại nguyên văn đánh giá.
4. Soạn sẵn 1 câu trả lời công khai, có thể gửi thẳng cho khách hàng ngay (trường "draft_reply"):
   - Viết với vai trò Phòng khám OfficeCare trả lời trực tiếp khách hàng, xưng "Phòng khám OfficeCare", gọi khách là "Anh/Chị".
   - Nếu POSITIVE: cảm ơn khách chân thành, ghi nhận cụ thể điều khách khen (nếu có).
   - Nếu NEGATIVE: xin lỗi vì trải nghiệm chưa tốt, ghi nhận vấn đề khách nêu, cam kết cải thiện; KHÔNG hứa hẹn cụ thể về tiền bạc/hoàn tiền/bồi thường (việc đó do con người quyết định) — có thể mời khách liên hệ hotline/quầy lễ tân để được hỗ trợ trực tiếp.
   - Nếu NEUTRAL: cảm ơn khách đã phản hồi, mời khách chia sẻ thêm nếu cần hỗ trợ.
   Độ dài 2-4 câu, giọng văn chuyên nghiệp và ấm áp, không lặp lại nguyên văn đánh giá của khách.
Trả lời đúng theo schema JSON đã cho.
`;

const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sentiment: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
      description: 'Nhãn cảm xúc của đánh giá.'
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Độ tin cậy của việc phân loại, từ 0 đến 1.'
    },
    reason: {
      type: SchemaType.STRING,
      description: 'Giải thích ngắn gọn bằng tiếng Việt vì sao chọn nhãn cảm xúc này.'
    },
    suggested_action: {
      type: SchemaType.STRING,
      description: 'Đề xuất hành động cụ thể cho Lễ tân/Admin phòng khám dựa trên đánh giá này, bằng tiếng Việt.'
    },
    draft_reply: {
      type: SchemaType.STRING,
      description: 'Câu trả lời công khai soạn sẵn, có thể gửi thẳng cho khách hàng, bằng tiếng Việt.'
    }
  },
  required: ['sentiment', 'confidence', 'reason', 'suggested_action', 'draft_reply']
};

export interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  reason: string;
  suggestedAction: string;
  draftReply: string;
}

export class SentimentService {
  static async classify(reviewText: string, soSao: number): Promise<SentimentResult | null> {
    if (!apiKey || !reviewText || !reviewText.trim()) {
      return null;
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const prompt = `Số sao khách chấm: ${soSao}/5\nNội dung đánh giá: "${reviewText.trim()}"`;
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      if (parsed.sentiment !== 'POSITIVE' && parsed.sentiment !== 'NEGATIVE' && parsed.sentiment !== 'NEUTRAL') {
        return null;
      }

      return {
        sentiment: parsed.sentiment,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
        suggestedAction: typeof parsed.suggested_action === 'string' ? parsed.suggested_action : '',
        draftReply: typeof parsed.draft_reply === 'string' ? parsed.draft_reply : ''
      };
    } catch (error) {
      console.error('Lỗi khi phân tích cảm xúc đánh giá:', error);
      return null;
    }
  }

  static async classifyAndSaveServiceReview(reviewId: string, reviewText: string, soSao: number): Promise<SentimentResult | null> {
    const result = await this.classify(reviewText, soSao);
    if (!result) return null;

    await prisma.danh_gia_goi_dich_vu.update({
      where: { id: reviewId },
      data: {
        cam_xuc: result.sentiment,
        do_tin_cay: result.confidence,
        ly_do_cam_xuc: result.reason,
        de_xuat_hanh_dong: result.suggestedAction,
        de_xuat_phan_hoi: result.draftReply
      }
    });
    return result;
  }

  static async classifyAndSaveStaffReview(reviewId: string, reviewText: string, soSao: number): Promise<SentimentResult | null> {
    const result = await this.classify(reviewText, soSao);
    if (!result) return null;

    await prisma.danh_gia_nhan_su.update({
      where: { id: reviewId },
      data: {
        cam_xuc: result.sentiment,
        do_tin_cay: result.confidence,
        ly_do_cam_xuc: result.reason,
        de_xuat_hanh_dong: result.suggestedAction,
        de_xuat_phan_hoi: result.draftReply
      }
    });
    return result;
  }
}
