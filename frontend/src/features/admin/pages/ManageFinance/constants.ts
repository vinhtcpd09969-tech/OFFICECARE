// Mapping trạng thái dùng chung cho FinanceKpiCards, InvoiceTable, PaymentTable và InvoiceDetailModal —
// giữ nguyên bảng màu emerald(thành công)/amber(chờ)/rose(hoàn tiền)/zinc(trung tính) đã đúng chuẩn,
// chỉ tập trung lại 1 nơi duy nhất thay vì định nghĩa cục bộ trong index.tsx như trước.
export const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    da_thanh_toan: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    thanh_cong: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    chua_thanh_toan: 'bg-amber-50 text-amber-700 border border-amber-250/50',
    dang_tra_gop: 'bg-sky-50 text-sky-700 border border-sky-200/50',
    dang_tra_tung_buoi: 'bg-sky-50 text-sky-700 border border-sky-200/50',
    da_hoan_tien: 'bg-rose-50 text-rose-700 border border-rose-200/50',
    cho_xu_ly: 'bg-zinc-50 text-zinc-700 border border-zinc-200',
  };
  return badges[status] || 'bg-zinc-50 text-zinc-700 border border-zinc-200';
};

// Nhãn tiếng Việt cho trang_thai hóa đơn — trước đây UI in thẳng giá trị cột DB
// (`trang_thai.replace(/_/g,' ')`, vd "DANG TRA GOP") cả ở bảng danh sách lẫn bản in hóa đơn cho
// khách. Dùng chung ở InvoiceTable.tsx và bản in (index.tsx::handlePrint).
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  da_thanh_toan: 'Đã thanh toán',
  chua_thanh_toan: 'Chưa thanh toán',
  dang_tra_gop: 'Đang trả góp',
  dang_tra_tung_buoi: 'Đang trả từng buổi',
  da_hoan_tien: 'Đã hoàn tiền',
};

// Chỉ 3 lựa chọn lọc — bỏ "Chưa thanh toán" vì hóa đơn trong app này luôn được tạo VÀ thu tiền cùng
// lúc lúc Lễ tân bấm xác nhận (không có khái niệm "đơn hàng treo chờ thanh toán sau" như thương mại
// điện tử), và bỏ "Đã hủy" vì gói hủy-không-hoàn (quá hạn) giờ ghi hóa đơn đúng bản chất tài chính là
// 'da_thanh_toan' — xem admin.repository.ts expirePackageNoRefund()/sweepExpiredPackages(). "Gói đã
// hủy" là thông tin của phác đồ, xem ở đó.
//
// "con_no" KHÔNG phải trang_thai thật trong DB — gộp 2 giá trị thật dang_tra_gop/dang_tra_tung_buoi
// thành 1 lựa chọn duy nhất trên bộ lọc (xem INVOICE_PENDING_STATUSES + logic lọc riêng ở
// useFinanceDashboard.ts). Lý do gộp: nếu để riêng 2 giá trị này làm option lọc, chọn "Đang trả góp"
// + Hình thức "100% trả thẳng" cùng lúc sẽ luôn ra 0 kết quả (2 điều kiện tự loại trừ nhau, vì
// dang_tra_gop chỉ tồn tại khi hình thức là tra_gop) — gộp lại để Trạng thái không tự ý "khai" luôn
// hình thức, kết hợp tự do được với bộ lọc Hình thức mà không dính tổ hợp mâu thuẫn. Badge hiển thị
// từng dòng trong bảng (INVOICE_STATUS_LABELS) vẫn giữ nguyên tên cụ thể, chỉ gộp ở bộ lọc.
export const INVOICE_PENDING_STATUSES = ['dang_tra_gop', 'dang_tra_tung_buoi'];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'da_thanh_toan', label: 'Đã thanh toán' },
  { value: 'con_no', label: 'Còn nợ / Đang thanh toán' },
  { value: 'da_hoan_tien', label: 'Đã hoàn tiền' },
];

// Bảng giao_dich_thanh_toan KHÔNG có cột trang_thai (xem schema.prisma) — thứ thật sự phân biệt
// 1 dòng giao dịch là loai_giao_dich (THANH_TOAN/HOAN_TIEN), không phải "trạng thái". Trước đây
// UI lọc/hiện badge theo pay.trang_thai (trường không tồn tại, luôn undefined) nên luôn rỗng.
export const TRANSACTION_TYPE_META: Record<string, { label: string; badge: string }> = {
  THANH_TOAN: { label: 'Thanh toán', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  HOAN_TIEN: { label: 'Hoàn tiền', badge: 'bg-rose-50 text-rose-700 border border-rose-200/50' },
};

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'THANH_TOAN', label: 'Thanh toán' },
  { value: 'HOAN_TIEN', label: 'Hoàn tiền' },
];

export const INVOICE_TYPE_OPTIONS = [
  { value: '100', label: '100% (Trả thẳng / Khám & Dịch vụ lẻ)' },
  { value: '50', label: '50% (Trả góp đợt 1 gói liệu trình)' },
  { value: 'tung_buoi', label: 'Từng buổi (Thanh toán theo ca lẻ)' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'tien_mat', label: 'Tiền mặt' },
  { value: 'chuyen_khoan', label: 'Chuyển khoản' },
];

export const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7days', label: '7 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này' },
];

export const FINANCE_PAGE_SIZE = 10;
