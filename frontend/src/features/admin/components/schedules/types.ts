import * as z from 'zod';

export const scheduleSchema = z.object({
  nguoi_dung_id: z.string().min(1, 'Vui lòng chọn nhân sự'),
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
  gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  trang_thai: z.enum(['hoat_dong', 'tam_nghi']),
  phong_id: z.union([z.string(), z.number(), z.null()]).optional(),
  giuong_so: z.union([z.string(), z.number(), z.null()]).optional()
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export interface Schedule {
  id: string | number;
  nguoi_dung_id: string;
  ngay: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'hoat_dong' | 'tam_nghi';
  phong_id?: number | null;
  giuong_so?: number | null;
  ten_nhan_vien?: string;
  vai_tro?: string;
  ma_phong?: string;
}

export interface Staff {
  id: string;
  ho_ten: string;
  vai_tro: string;
}

export interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
}

export interface WeekDate {
  key: string;
  label: string;
  dateStr: string;
  isToday: boolean;
  fullDateStr: string;
}
