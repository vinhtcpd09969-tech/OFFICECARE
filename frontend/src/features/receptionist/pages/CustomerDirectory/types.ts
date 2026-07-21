export type PackageStatus = 'cho_kich_hoat' | 'dang_dieu_tri' | 'hoan_thanh';

export interface CurrentPackageInfo {
  trang_thai: PackageStatus;
  ten_goi: string;
  han_kich_hoat?: string | null;
  so_buoi_da_dung?: number;
  tong_so_buoi?: number;
}

export interface CustomerRosterItem {
  id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  trang_thai: string;
  diem_uy_tin: number;
  goi_hien_tai: CurrentPackageInfo | null;
  last_used_at: string | null;
  can_lien_he: boolean;
}

export interface RosterMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type TrangThaiGoiFilter = 'all' | 'dang_dieu_tri' | 'cho_kich_hoat' | 'hoan_thanh' | 'khong_co_goi';

export interface CustomerHistoryPlan {
  id: string;
  goi_dich_vu_id: string;
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  trang_thai: PackageStatus;
  ngay_kich_hoat: string | null;
  han_su_dung?: string | null;
  ten_goi: string;
  loai_goi: string;
  cuoc_hen_id?: string;
  han_kich_hoat?: string | null;
}

export interface CustomerHistoryAppointment {
  id: string;
  phac_do_dieu_tri_id: string | null;
  so_thu_tu_buoi: number | null;
  goi_dich_vu_id: string | null;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  loai: string;
  trang_thai: string;
  ten_dich_vu: string | null;
}

export interface CustomerHistoryDetail {
  id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  trang_thai: string;
  diem_uy_tin: number;
  ngay_sinh: string | null;
  gioi_tinh: string | null;
  dia_chi: string | null;
  plans: CustomerHistoryPlan[];
  appointments: CustomerHistoryAppointment[];
  can_lien_he: boolean;
  last_used_at: string | null;
}
