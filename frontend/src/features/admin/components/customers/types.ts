export interface CustomerPackageCounts {
  tong: number;
  cho_kich_hoat: number;
  dang_dieu_tri: number;
  hoan_thanh: number;
  huy: number;
}

// "Trạng thái chính" của khách — chỉ 1 tín hiệu quan trọng nhất tại cột "Liệu trình" trong bảng,
// resolve bằng resolvePrimaryStatus() ở backend (admin.service.ts): chờ kích hoạt / đang điều trị
// luôn thắng; nếu không có thì so ngày gần nhất giữa "khám/dịch vụ lẻ" và "liệu trình đã hủy";
// "hoàn thành" chỉ hiện khi khách không còn tín hiệu nào khác gần đây. "none" (chưa có hồ sơ điều
// trị nào — chưa từng khám/dùng dịch vụ lẻ/có liệu trình) TÁCH RIÊNG khỏi "le" (đã thật sự dùng
// khám/dịch vụ lẻ) — 2 nhóm khách khác hẳn nhau, không được gộp chung.
export type CustomerStatusTier = 'none' | 'le' | 'pending' | 'progress' | 'done' | 'cancel';

export interface PrimaryStatus {
  tier: CustomerStatusTier;
  ten_goi: string | null;
  note: string | null;
  so_buoi_da_dung?: number;
  tong_so_buoi?: number;
}

export interface CustomerOverviewItem {
  id: string;
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  trang_thai: string;
  diem_uy_tin: number;
  tong_chi_tieu: number;
  has_record: boolean;
  goi_lieu_trinh: CustomerPackageCounts;
  primary_status: PrimaryStatus;
}

// "any_plan" = bấm chấm "Tổng liệu trình" trên đường cong — lọc mọi khách có liệu trình ở bất kỳ
// trạng thái nào (không phải 1 tier cụ thể của resolvePrimaryStatus).
export type CustomerStatusFilter = CustomerStatusTier | 'locked' | 'any_plan';

export type ReputationTier = 'low' | 'mid' | 'high';

export interface PackageStats extends CustomerPackageCounts {}

// Đếm số khách theo ĐÚNG 1 tier mỗi người — nguồn số liệu cho "Đường cong Phục hồi" (card thống
// kê kiêm bộ lọc trạng thái) ở trang Quản lý Khách hàng.
export interface CustomerTierCounts {
  pending: number;
  progress: number;
  le: number;
  cancel: number;
  done: number;
  none: number;
}

export interface EmrStats {
  customer_tiers: CustomerTierCounts;
  kham_hoan_thanh: number;
  dich_vu_le_hoan_thanh: number;
}
