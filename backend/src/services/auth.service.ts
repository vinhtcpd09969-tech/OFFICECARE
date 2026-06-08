import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from '../repositories/auth.repository';
import { sendOTP } from '../utils/mailer';

class AuthService {
  private generateAccessToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, vai_tro_id: user.vai_tro_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(user: any) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '7d' }
    );
  }

  async register(data: any) {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) throw new Error('Email đã được sử dụng');

    const salt = await bcrypt.genSalt(10);
    const mat_khau_hash = await bcrypt.hash(data.password, salt);

    const user = await authRepository.createUser({ ho_ten: data.ho_ten, email: data.email, mat_khau_hash });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await authRepository.saveOTP(data.email, otp, expiresAt);
    await sendOTP(data.email, otp, data.ho_ten);

    return { message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP.' };
  }

  async login(data: any) {
    const user = await authRepository.findActiveUserByEmail(data.email);
    if (!user) throw new Error('Email hoặc mật khẩu không chính xác');

    if (user.trang_thai !== 'hoat_dong') throw new Error('Tài khoản đã bị khóa hoặc vô hiệu hóa');

    if (!user.da_xac_thuc_email) {
      const error = new Error('Tài khoản chưa được xác thực email') as any;
      error.requiresVerification = true;
      error.email = user.email;
      throw error;
    }

    const isMatch = await bcrypt.compare(data.password, user.mat_khau_hash);
    if (!isMatch) throw new Error('Email hoặc mật khẩu không chính xác');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);
    await authRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro_id: user.vai_tro_id,
        avatar_url: user.avatar_url
      }
    };
  }

  async verifyEmail(data: any) {
    const validOTP = await authRepository.findValidOTP(data.email, data.otp);
    if (!validOTP) throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');

    const user = await authRepository.verifyEmail(data.email);
    if (!user) throw new Error('Người dùng không tồn tại');

    await authRepository.deleteOTPsByEmail(data.email);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);
    await authRepository.updateLastLogin(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro_id: user.vai_tro_id,
        avatar_url: user.avatar_url
      }
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as any;
      const validToken = await authRepository.findValidRefreshToken(token);
      if (!validToken) throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');

      const user = await authRepository.findUserById(decoded.id);
      if (!user) throw new Error('Người dùng không tồn tại hoặc bị vô hiệu hóa');

      const newAccessToken = this.generateAccessToken(user);
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Refresh token không hợp lệ');
    }
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async resendOTP(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new Error('Người dùng không tồn tại');
    if (user.da_xac_thuc_email) throw new Error('Tài khoản đã được xác thực email trước đó');

    // Tạo mã OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Xóa các OTP cũ và lưu OTP mới
    await authRepository.deleteOTPsByEmail(email);
    await authRepository.saveOTP(email, otp, expiresAt);
    await sendOTP(email, otp, user.ho_ten);

    return { message: 'Đã gửi lại mã OTP mới. Vui lòng kiểm tra email.' };
  }
}

export default new AuthService();
