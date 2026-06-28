import { z } from 'zod';

// --- Dịch vụ & Danh mục ---
export const categorySchema = z.object({
  body: z.object({
    ten_danh_muc: z.string().min(1, 'Tên danh mục là bắt buộc'),
    mo_ta: z.string().optional().nullable(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    loai_danh_muc: z.enum(['dich_vu', 'goi']).default('dich_vu'),
    thu_tu_hien_thi: z.number().int().optional().default(0)
  })
});

export const serviceSchema = z.object({
  body: z.object({
    danh_muc_id: z.number().int().positive('Danh mục không hợp lệ'),
    ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
    mo_ta: z.string().optional().nullable(),
    thoi_gian_uoc_tinh: z.number().int().positive('Thời gian ước tính phải lớn hơn 0'),
    don_gia: z.number().min(0, 'Đơn giá không hợp lệ').optional().default(0),
    thiet_bi_yeu_cau: z.string().optional().nullable(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    loai_dich_vu: z.enum(['ky_thuat', 'don_le']).default('ky_thuat'),
    hien_thi_website: z.boolean().optional().default(true),
    mo_ta_chi_tiet: z.string().optional().nullable(),
    loai_dich_vu_ho_tro: z.any().optional().nullable()
  })
}).superRefine((data, ctx) => {
  const { danh_muc_id, ten_dich_vu, loai_dich_vu } = data.body;
  const isExamCategory = Number(danh_muc_id) === 1;
  const nameLower = ten_dich_vu.toLowerCase();

  const examKeywords = ['khám', 'lượng giá', 'luong gia', 'đánh giá', 'danh gia', 'kiểm tra', 'kiem tra', 'tư vấn', 'tu van'];
  const hasExamKeywords = examKeywords.some(k => nameLower.includes(k));

  const treatmentKeywords = ['trị liệu', 'tri lieu', 'điện xung', 'dien xung', 'xung kích', 'xung kich', 'laser', 'siêu âm', 'sieu am', 'kéo giãn', 'keo gian', 'châm cứu', 'cham cuu', 'bấm huyệt', 'bam huyet', 'xoa bóp', 'xoa bop', 'nắn chỉnh', 'nan chinh'];
  const hasTreatmentKeywords = treatmentKeywords.some(k => nameLower.includes(k));

  if (loai_dich_vu === 'ky_thuat' && isExamCategory) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Kỹ thuật trị liệu nội bộ không được thuộc danh mục Khám bệnh.',
      path: ['body', 'danh_muc_id']
    });
  }

  if (loai_dich_vu === 'don_le') {
    if (isExamCategory) {
      if (!hasExamKeywords) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dịch vụ thuộc danh mục Khám & Lượng giá phải có tên liên quan đến thăm khám (ví dụ: Khám, Lượng giá...).',
          path: ['body', 'ten_dich_vu']
        });
      }
      if (hasTreatmentKeywords && !nameLower.includes('khám') && !nameLower.includes('lượng giá') && !nameLower.includes('tư vấn')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dịch vụ thuộc danh mục Khám không thể là kỹ thuật trị liệu đơn thuần (Ví dụ: điện xung trị liệu).',
          path: ['body', 'ten_dich_vu']
        });
      }
    } else {
      if (hasExamKeywords && !hasTreatmentKeywords) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dịch vụ thăm khám phải được xếp vào danh mục "Khám Bệnh & Lượng Giá Chuyên Sâu".',
          path: ['body', 'danh_muc_id']
        });
      }
    }
  }
});

// --- Gói điều trị ---
export const packageSchema = z.object({
  body: z.object({
    danh_muc_id: z.number().int().positive('Danh mục không hợp lệ').optional().nullable(),
    ten_goi: z.string().min(1, 'Tên gói là bắt buộc'),
    ma_goi: z.string().optional(),
    mo_ta: z.string().optional(),
    tong_so_buoi: z.number().int().positive('Số buổi phải lớn hơn 0'),
    gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
    han_dung_thang: z.number().int().positive('Hạn dùng phải lớn hơn 0').default(6),
    so_dv_toi_da_moi_buoi: z.number().int().positive().default(5),
    chi_tiet_dich_vu: z.array(z.object({
      dich_vu_id: z.union([z.string(), z.number()]),
      so_buoi: z.number().int().positive('Số buổi dịch vụ phải lớn hơn 0').optional(),
      so_lan_toi_da_trong_goi: z.number().int().positive('Số lần tối đa trong gói phải lớn hơn 0').optional(),
      bat_buoc: z.boolean().default(false),
      thu_tu_thuc_hien: z.number().int().nonnegative().default(0)
    })).default([]),
    hien_thi_website: z.boolean().default(true),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    loai_goi: z.enum(['linh_dong', 'lieu_trinh']).default('lieu_trinh')
  })
});

// --- Quản lý Nhân sự ---
export const staffSchema = z.object({
  body: z.object({
    ho_ten: z.string().min(1, 'Họ tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    mat_khau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    vai_tro_id: z.number().int().positive('Vai trò không hợp lệ (2=Lễ tân, 3=KTV, 4=Bác sĩ, 5=Admin, 6=Quản lý)'),
    so_dien_thoai: z.string().optional(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong')
  })
});

// --- Quản lý Thiết bị y tế ---
export const equipmentSchema = z.object({
  body: z.object({
    ten_thiet_bi: z.string().min(1, 'Tên thiết bị là bắt buộc'),
    loai_thiet_bi: z.string().optional(),
    ngay_mua: z.string().optional().nullable(),
    trang_thai: z.enum(['san_sang', 'dang_su_dung', 'dang_bao_tri', 'hong']).default('san_sang'),
    phong_id_hien_tai: z.number().int().positive().nullable().optional(),
    ghi_chu: z.string().optional().nullable(),
    cap_rui_ro: z.string().optional().nullable(),
    tan_suat_bao_tri_ngay: z.number().int().optional().nullable(),
    ngay_bao_tri_gan_nhat: z.string().optional().nullable(),
    so_luong: z.number().int().min(1).optional().default(1)
  })
});

// --- Quản lý Lịch làm việc ---
export const scheduleSchema = z.object({
  body: z.object({
    nguoi_dung_id: z.string().uuid('ID nhân viên không hợp lệ'),
    ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
    gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ bắt đầu không hợp lệ (HH:mm)'),
    gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ kết thúc không hợp lệ (HH:mm)'),
    trang_thai: z.enum(['hoat_dong', 'tam_nghi']).default('hoat_dong'),
    phong_id: z.union([z.string(), z.number()]).optional().nullable(),
    giuong_so: z.union([z.string(), z.number()]).optional().nullable()
  })
});

// --- Quản lý Ưu đãi Thanh toán ---
export const paymentPromotionSchema = z.object({
  body: z.object({
    ten_uu_dai: z.string().min(1, 'Tên ưu đãi là bắt buộc'),
    phan_tram_tra_thang: z.number().int().min(0).max(100).default(10),
    phan_tram_tra_gop: z.number().int().min(0).max(100).default(5),
    ngay_bat_dau: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
    ngay_het_han: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hết hạn không hợp lệ (YYYY-MM-DD)').optional().nullable(),
    trang_thai: z.enum(['hoat_dong', 'vo_hieu']).default('hoat_dong'),
    goi_dich_vu_ids: z.any().optional()
  })
});

export const roomSchema = z.object({
  body: z.object({
    ten_phong: z.string().min(1, 'Tên phòng là bắt buộc'),
    ma_phong: z.string().optional().nullable(),
    loai_phong: z.string().optional().nullable(),
    loai_dich_vu_ho_tro: z.any().optional().nullable(),
    mo_ta: z.string().optional().nullable(),
    trang_thai: z.string().default('san_sang'),
    suc_chua: z.number().int().min(1).optional().default(1)
  })
});
