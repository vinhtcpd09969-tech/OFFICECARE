import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { ChatHistoryService } from '../services/chatHistory.service';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/appError';

export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { message, history, sessionId } = req.body;

  if (!message || typeof message !== 'string') {
    throw new BadRequestError('Nội dung tin nhắn không được để trống');
  }

  const chatHistory = Array.isArray(history) ? history : [];

  let result;
  try {
    result = await AIService.generateChatResponse(message, chatHistory);
  } catch (error: any) {
    throw new BadRequestError(error.message || 'Lỗi xử lý phản hồi từ AI');
  }

  res.json({
    success: true,
    reply: result.reply,
    suggestBooking: result.suggestBooking
  });

  // Lưu lịch sử chat vào Postgres không đồng bộ, không chặn phản hồi đã trả về khách.
  if (sessionId && typeof sessionId === 'string') {
    const khachHangId = Number(req.user?.vai_tro_id) === 1 && req.user?.id ? String(req.user.id) : null;
    ChatHistoryService.appendTurn(sessionId, khachHangId, message, result.reply).catch(err => {
      console.error('Lỗi lưu lịch sử chat AI:', err);
    });
  }
});

export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || '');
  if (!sessionId) {
    throw new BadRequestError('Thiếu sessionId');
  }

  const messages = await ChatHistoryService.getHistory(sessionId);
  res.json({ success: true, messages });
});
