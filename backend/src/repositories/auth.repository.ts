import prisma from '../config/prisma';

class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.nguoi_dung.findFirst({
      where: { email }
    });
  }

  async findActiveUserByEmail(email: string) {
    return prisma.nguoi_dung.findFirst({
      where: {
        email,
        deleted_at: null
      }
    });
  }

  async createUser(data: { ho_ten: string, email: string, mat_khau_hash: string }) {
    return prisma.nguoi_dung.create({
      data: {
        ho_ten: data.ho_ten,
        email: data.email,
        mat_khau_hash: data.mat_khau_hash,
        vai_tro_id: 1,
        trang_thai: 'hoat_dong',
        da_xac_thuc_email: false,
      },
      select: {
        id: true,
        email: true,
      }
    });
  }

  async saveOTP(email: string, otp: string, expiresAt: Date) {
    await prisma.otp_codes.create({
      data: {
        email,
        otp,
        expires_at: expiresAt,
      }
    });
  }

  async findValidOTP(email: string, otp: string) {
    return prisma.otp_codes.findFirst({
      where: {
        email,
        otp,
        expires_at: {
          gt: new Date()
        }
      },
      select: {
        id: true
      }
    });
  }

  async verifyEmail(email: string) {
    const user = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    
    if (!user) return null;

    const updatedUser = await prisma.nguoi_dung.update({
      where: { id: user.id },
      data: { da_xac_thuc_email: true }
    });

    if (updatedUser.vai_tro_id === 1) {
      const existingKh = await prisma.khach_hang.findFirst({
        where: { nguoi_dung_id: updatedUser.id }
      });
      if (!existingKh) {
        await prisma.khach_hang.create({
          data: {
            nguoi_dung_id: updatedUser.id
          }
        });
      }
    }

    return updatedUser;
  }

  async deleteOTPsByEmail(email: string) {
    await prisma.otp_codes.deleteMany({
      where: { email }
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    await prisma.refresh_tokens.create({
      data: {
        nguoi_dung_id: userId,
        token,
        expires_at: expiresAt,
      }
    });
  }

  async findValidRefreshToken(token: string) {
    return prisma.refresh_tokens.findFirst({
      where: {
        token,
        expires_at: {
          gt: new Date()
        }
      }
    });
  }

  async findUserById(id: string) {
    return prisma.nguoi_dung.findFirst({
      where: {
        id,
        deleted_at: null
      },
      select: {
        id: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        vai_tro_id: true,
        trang_thai: true,
        avatar_url: true,
        thoi_gian_tao: true
      }
    });
  }

  async updateLastLogin(userId: string) {
    await prisma.nguoi_dung.update({
      where: { id: userId },
      data: { lan_dang_nhap_cuoi: new Date() }
    });
  }

  async updatePassword(email: string, mat_khau_hash: string) {
    const user = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (!user) return null;

    return prisma.nguoi_dung.update({
      where: { id: user.id },
      data: { mat_khau_hash }
    });
  }
}

export default new AuthRepository();
