import { GoogleGenerativeAI, SchemaType, ResponseSchema } from '@google/generative-ai';
import prisma from '../config/prisma';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
Bạn là công cụ phân tích cảm xúc cho các bình luận đánh giá của khách hàng tại phòng khám vật lý trị liệu OfficeCare.
Nhiệm vụ: đọc nội dung đánh giá (và số sao nếu có) rồi phân loại cảm xúc thành đúng 1 trong 3 nhãn:
- POSITIVE: khách hài lòng, khen ngợi dịch vụ/nhân viên.
- NEGATIVE: khách phàn nàn, không hài lòng, phản ánh vấn đề.
- NEUTRAL: đánh giá trung lập, không rõ cảm xúc, hoặc nội dung quá ngắn/thiếu thông tin để kết luận.
Trả lời đúng theo schema JSON đã cho. Trường "reason" viết ngắn gọn bằng tiếng Việt, giải thích vì sao chọn nhãn đó.
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
    }
  },
  required: ['sentiment', 'confidence', 'reason']
};

export interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  reason: string;
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
        reason: typeof parsed.reason === 'string' ? parsed.reason : ''
      };
    } catch (error) {
      console.error('Lỗi khi phân tích cảm xúc đánh giá:', error);
      return null;
    }
  }

  static async classifyAndSaveServiceReview(reviewId: string, reviewText: string, soSao: number) {
    const result = await this.classify(reviewText, soSao);
    if (!result) return;

    await prisma.danh_gia_goi_dich_vu.update({
      where: { id: reviewId },
      data: {
        cam_xuc: result.sentiment,
        do_tin_cay: result.confidence,
        ly_do_cam_xuc: result.reason
      }
    });
  }

  static async classifyAndSaveStaffReview(reviewId: string, reviewText: string, soSao: number) {
    const result = await this.classify(reviewText, soSao);
    if (!result) return;

    await prisma.danh_gia_nhan_su.update({
      where: { id: reviewId },
      data: {
        cam_xuc: result.sentiment,
        do_tin_cay: result.confidence,
        ly_do_cam_xuc: result.reason
      }
    });
  }
}
