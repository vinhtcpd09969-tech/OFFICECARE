import { z } from 'zod';

export const voucherSchema = z.object({
  body: z.object({
    ma_voucher: z.string().optional().nullable(),
    // Optional ở backend (không .min(1)) dù UI bắt buộc nhập — nút bật/tắt trạng thái trên
    // VoucherCard gửi PUT nguyên object đang có, kể cả voucher cũ/seed chưa từng có tên chiến
    // dịch (ten_chien_dich = ''); bắt buộc ở đây sẽ làm hỏng thao tác bật/tắt của các mã đó.
    ten_chien_dich: z.string().optional().default(''),
    loai_giam: z.enum(['phan_tram', 'so_tien_co_dinh']),
    // coerce (không z.number() thuần) vì các cột bigint (gia_tri_giam/giam_toi_da/don_hang_toi_thieu)
    // được driver pg trả về dạng CHUỖI để tránh mất độ chính xác — nút bật/tắt trên VoucherCard gửi
    // thẳng lại object lấy từ GET /admin/vouchers nên các field này là string, không phải number.
    gia_tri_giam: z.coerce.number().positive('Giá trị giảm phải lớn hơn 0'),
    giam_toi_da: z.coerce.number().optional().nullable(),
    don_hang_toi_thieu: z.coerce.number().min(0).default(0),
    ap_dung_cho: z.enum([
      'tat_ca',
      'dich_vu',
      'dich_vu_don',
      'dich_vu_cu_the',
      'goi',
      'goi_dich_vu',
      'goi_dieu_tri',
      'goi_cu_the',
      'danh_gia',
      'dich_vu_va_goi'
    ]).default('tat_ca'),
    so_luong_toi_da: z.coerce.number().int().optional().nullable(),
    // Regex không neo `$` ở cuối + cắt còn đúng 10 ký tự đầu: chấp nhận cả "YYYY-MM-DD" (từ input
    // date trên form) lẫn timestamp ISO đầy đủ "YYYY-MM-DDTHH:mm:ss.sssZ" (ngay_bat_dau/ngay_het_han
    // là cột timestamptz, GET /admin/vouchers trả về nguyên dạng ISO khi bị gửi ngược lại).
    ngay_bat_dau: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)').transform((s) => s.slice(0, 10)),
    ngay_het_han: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Ngày hết hạn không hợp lệ (YYYY-MM-DD)').transform((s) => s.slice(0, 10)).optional().nullable(),
    trang_thai: z.enum(['hoat_dong', 'tam_dung', 'het_han', 'sap_ra_mat']).default('hoat_dong'),
    tu_dong_ap_dung: z.boolean().optional().default(false),
    yeu_cau_thanh_toan: z.array(z.enum(['tat_ca', 'tra_thang', 'tra_gop', 'tung_buoi']))
      .min(1, 'Chọn ít nhất 1 hình thức thanh toán áp dụng')
      .default(['tat_ca']),
    dich_vu_ids: z.array(z.string().uuid('ID dịch vụ không hợp lệ')).optional().default([]),
    goi_dich_vu_ids: z.array(z.string().uuid('ID gói không hợp lệ')).optional().default([])
  })
    .superRefine((body, ctx) => {
      if (body.loai_giam === 'phan_tram' && body.gia_tri_giam > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gia_tri_giam'],
          message: 'Giá trị giảm theo % không được vượt quá 100',
        });
      }
    })
    .transform((body) => ({
      ...body,
      giam_toi_da: body.loai_giam === 'so_tien_co_dinh' ? null : body.giam_toi_da,
      // 'tat_ca' bao trùm mọi hình thức — nếu người dùng tick kèm các ô khác thì rút gọn cho sạch dữ liệu.
      yeu_cau_thanh_toan: body.yeu_cau_thanh_toan.includes('tat_ca') ? ['tat_ca'] : body.yeu_cau_thanh_toan,
    }))
});

