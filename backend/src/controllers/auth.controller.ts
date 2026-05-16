import { Request, Response } from 'express';
import { ZodError } from 'zod';
import authService from '../services/auth.service';
import { loginSchema, registerSchema, verifyEmailSchema, refreshTokenSchema } from '../schemas/auth.schema';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = registerSchema.parse({ body: req.body });
    const result = await authService.register(validated.body);
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Email đã được sử dụng') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const validatedData = loginSchema.parse({ body: req.body });
    const result = await authService.login(validatedData.body);
    res.json({
      message: 'Đăng nhập thành công',
      ...result
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Email hoặc mật khẩu không chính xác') {
      return res.status(401).json({ message: error.message });
    }
    if (error.message === 'Tài khoản đã bị khóa hoặc vô hiệu hóa') {
      return res.status(403).json({ message: error.message });
    }
    if (error.requiresVerification) {
      return res.status(403).json({ 
        message: error.message,
        requiresVerification: true,
        email: error.email 
      });
    }
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const validatedData = verifyEmailSchema.parse({ body: req.body });
    const result = await authService.verifyEmail(validatedData.body);
    res.json({
      message: 'Xác thực email thành công',
      ...result
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Mã OTP không hợp lệ hoặc đã hết hạn' || error.message === 'Người dùng không tồn tại') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Verify Email Error:', error);
    res.status(500).json({ message: 'Lỗi server khi xác thực email' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const validatedData = refreshTokenSchema.parse({ body: req.body });
    const result = await authService.refreshToken(validatedData.body.refreshToken);
    res.json(result);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(403).json({ message: error.message || 'Refresh token không hợp lệ' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (error: any) {
    console.error('Get Me Error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
