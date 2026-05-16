import { z } from 'zod';

export const refundSchema = z.object({
  body: z.object({
    ly_do_hoan_tien: z.string().min(1, 'Lý do hoàn tiền là bắt buộc'),
    so_tien_hoan: z.number().positive('Số tiền hoàn phải lớn hơn 0').optional()
  })
});

export const updateInvoiceStatusSchema = z.object({
  body: z.object({
    trang_thai: z.enum(['chua_thanh_toan', 'thanh_toan_mot_phan', 'da_thanh_toan', 'da_hoan_tien']),
    ghi_chu: z.string().optional()
  })
});
