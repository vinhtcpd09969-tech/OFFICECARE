import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/appError';

export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    throw new BadRequestError('Nội dung tin nhắn không được để trống');
  }

  const chatHistory = Array.isArray(history) ? history : [];

  try {
    const reply = await AIService.generateChatResponse(message, chatHistory);
    res.json({
      success: true,
      reply
    });
  } catch (error: any) {
    throw new BadRequestError(error.message || 'Lỗi xử lý phản hồi từ AI');
  }
});
