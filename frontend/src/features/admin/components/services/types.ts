import * as z from 'zod';

export const serviceSchema = z.object({
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục'),
  ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  mo_ta: z.string().optional().nullable(),
  thoi_gian_uoc_tinh: z.number().min(1, 'Thời gian phải lớn hơn 0'),
  don_gia: z.number().min(0, 'Đơn giá phải từ 0đ'),
  thiet_bi_yeu_cau: z.string().min(1, 'Vui lòng chọn thiết bị hoặc Trị liệu bằng tay'),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu']),
  loai_dich_vu: z.enum(['ky_thuat', 'don_le']),
  hien_thi_website: z.boolean().default(false),
  mo_ta_chi_tiet: z.string().optional().nullable(),
  loai_dich_vu_ho_tro_str: z.string().optional().nullable()
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

export interface Service {
  id: string | number;
  danh_muc_id?: number | null;
  ten_dich_vu: string;
  mo_ta?: string | null;
  mo_ta_ngan?: string | null;
  thoi_gian_uoc_tinh: number;
  don_gia: number;
  thiet_bi_yeu_cau?: string | null;
  trang_thai: 'hoat_dong' | 'vo_hieu';
  loai_dich_vu: 'ky_thuat' | 'don_le';
  hien_thi_website: boolean;
  mo_ta_chi_tiet?: string | null;
  loai_dich_vu_ho_tro?: string[] | string | null;
  ten_danh_muc?: string | null;
}

export interface Category {
  id: string | number;
  ten_danh_muc: string;
  loai_danh_muc: string;
  an_hien?: boolean;
}

export interface Package {
  id: string | number;
  ten_goi: string;
  chi_tiet_dich_vu?: Array<{
    dich_vu_id: string | number;
    so_lan?: number;
  }> | null;
}
