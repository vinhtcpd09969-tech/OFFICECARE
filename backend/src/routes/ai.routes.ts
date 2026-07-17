import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { chatWithAI } from '../controllers/ai.controller';
import { aiRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Middleware xác thực token tùy chọn (cho phép cả Khách vãng lai và Thành viên)
const optionalVerifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // Không có token -> đi tiếp dưới dạng Khách vãng lai
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (err) {
    // Token không hợp lệ hoặc hết hạn -> Báo lỗi để thiết bị client biết và xử lý
    return res.status(401).json({ message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' });
  }
};

router.post('/chat', optionalVerifyToken, aiRateLimiter, chatWithAI);

export default router;
