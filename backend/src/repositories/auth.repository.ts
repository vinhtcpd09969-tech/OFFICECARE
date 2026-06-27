import prisma from '../config/prisma';

class AuthRepository {
  async findUserByEmail(email: string) {
    // 1. Search in staff (nguoi_dung)
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (staff) {
      return staff;
    }

    // 2. Search in customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: { email }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async findActiveUserByEmail(email: string) {
    // 1. Search in staff (nguoi_dung)
    const staff = await prisma.nguoi_dung.findFirst({
      where: {
        email,
        deleted_at: null
      }
    });
    if (staff) {
      return staff;
    }

    // 2. Search in customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: {
        email,
        deleted_at: null
      }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async createUser(data: { ho_ten: string, email: string, mat_khau_hash: string }) {
    return prisma.khach_hang.create({
      data: {
        ho_ten: data.ho_ten,
        email: data.email,
        mat_khau_hash: data.mat_khau_hash,
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
    // 1. Check if it's a staff member
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (staff) {
      return prisma.nguoi_dung.update({
        where: { id: staff.id },
        data: { da_xac_thuc_email: true }
      });
    }

    // 2. Check if it's a customer
    const customer = await prisma.khach_hang.findFirst({
      where: { email }
    });
    if (customer) {
      const updatedCustomer = await prisma.khach_hang.update({
        where: { id: customer.id },
        data: { da_xac_thuc_email: true }
      });
      return {
        ...updatedCustomer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async deleteOTPsByEmail(email: string) {
    await prisma.otp_codes.deleteMany({
      where: { email }
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    // Check if it's a customer
    const isCustomer = await prisma.khach_hang.findFirst({
      where: { id: userId },
      select: { id: true }
    });

    await prisma.refresh_tokens.create({
      data: {
        nguoi_dung_id: isCustomer ? null : userId,
        khach_hang_id: isCustomer ? userId : null,
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
    // 1. Search staff (nguoi_dung)
    const staff = await prisma.nguoi_dung.findFirst({
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
    if (staff) return staff;

    // 2. Search customer (khach_hang)
    const customer = await prisma.khach_hang.findFirst({
      where: {
        id,
        deleted_at: null
      },
      select: {
        id: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        trang_thai: true,
        avatar_url: true,
        thoi_gian_tao: true
      }
    });
    if (customer) {
      return {
        ...customer,
        vai_tro_id: 1
      };
    }

    return null;
  }

  async updateLastLogin(userId: string) {
    const isCustomer = await prisma.khach_hang.findFirst({
      where: { id: userId },
      select: { id: true }
    });

    if (isCustomer) {
      await prisma.khach_hang.update({
        where: { id: userId },
        data: { lan_dang_nhap_cuoi: new Date() }
      });
    } else {
      await prisma.nguoi_dung.update({
        where: { id: userId },
        data: { lan_dang_nhap_cuoi: new Date() }
      });
    }
  }

  async updatePassword(email: string, mat_khau_hash: string) {
    const staff = await prisma.nguoi_dung.findFirst({
      where: { email }
    });
    if (staff) {
      return prisma.nguoi_dung.update({
        where: { id: staff.id },
        data: { mat_khau_hash }
      });
    }

    const customer = await prisma.khach_hang.findFirst({
      where: { email }
    });
    if (customer) {
      return prisma.khach_hang.update({
        where: { id: customer.id },
        data: { mat_khau_hash }
      });
    }

    return null;
  }
}

export default new AuthRepository();

