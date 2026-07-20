// Khớp đúng shape thật trả về từ GET /client/medical-record
// (backend/src/repositories/appointment.repository.ts::getCustomerMedicalRecord).

export interface RecordCustomer {
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  diem_uy_tin: number;
}

export interface SessionEntry {
  cuoc_hen_id: string;
  phac_do_dieu_tri_id: string;
  so_thu_tu_buoi: number;
  ngay_gio_bat_dau: string;
  trang_thai: string;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ghi_chu: string | null;
  vas_truoc: number | null;
  vas_sau: number | null;
  ten_bac_si: string | null;
  anh_ky_thuat_vien: string | null;
  ten_phong: string | null;
  danh_gia_sao: number | null;
  danh_gia_nhan_xet: string | null;
  phan_hoi_nhan_xet: string | null;
}

export interface PackageEntry {
  phac_do_id: string;
  goi_dich_vu_id: string;
  ma_phac_do: string;
  ngay_kich_hoat: string | null;
  ten_dich_vu: string;
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  trang_thai_phac_do: string;
  hoa_don_id: string | null;
  ma_hoa_don: string | null;
  tong_tien_phai_tra: number | null;
  so_tien_da_tra: number | null;
  trang_thai_hoa_don: string | null;
  hinh_thuc_thanh_toan_goi: string | null;
  buoi_dieu_tri: SessionEntry[];
}

export interface SingleTreatmentEntry {
  cuoc_hen_id: string;
  ngay_dieu_tri: string;
  ten_dich_vu: string;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ghi_chu: string | null;
  vas_truoc: number | null;
  vas_sau: number | null;
  ten_bac_si: string | null;
  ten_phong: string | null;
  hoa_don_id: string | null;
  ma_hoa_don: string | null;
  tong_tien_phai_tra: number | null;
  so_tien_da_tra: number | null;
  trang_thai_hoa_don: string | null;
  danh_gia_sao: number | null;
  danh_gia_nhan_xet: string | null;
  phan_hoi_nhan_xet: string | null;
}

export interface ExamEntry {
  cuoc_hen_id: string;
  ngay_kham: string;
  ly_do_kham: string | null;
  anh_dinh_kem_url: string | null;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ghi_chu: string | null;
  ten_bac_si: string | null;
  anh_bac_si: string | null;
  vai_tro_bac_si: number | null;
  ten_phong: string | null;
  hoa_don_id: string | null;
  ma_hoa_don: string | null;
  tong_tien_phai_tra: number | null;
  so_tien_da_tra: number | null;
  trang_thai_hoa_don: string | null;
  khuyen_nghi_goi: string | null;
  khuyen_nghi_phac_do_id: string | null;
  khuyen_nghi_han_kich_hoat: string | null;
}

export interface MedicalRecordData {
  khach_hang: RecordCustomer;
  lich_su_kham: ExamEntry[];
  goi_dieu_tri: PackageEntry[];
  dieu_tri_le: SingleTreatmentEntry[];
}

export type RecordTab = 'goi' | 'le' | 'kham';
