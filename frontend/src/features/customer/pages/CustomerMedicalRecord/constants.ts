// Nhãn trạng thái hóa đơn — bao phủ đủ các giá trị thật trang_thai của hoa_don (xem
// backend/src/schemas/finance.schema.ts + backend/src/repositories/receptionist.repository.ts).
// Trước đây trang này chỉ xử lý 3/5 giá trị, các hóa đơn "đang trả góp/đang trả từng buổi" bị rơi
// vào nhánh mặc định "Chờ thanh toán" — sai nghĩa vì đó là trạng thái đang hoạt động bình thường.
export const INVOICE_STATUS_META: Record<string, { label: string; className: string }> = {
  da_thanh_toan: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  chua_thanh_toan: { label: 'Chờ thanh toán', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  dang_tra_gop: { label: 'Đang trả góp', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  dang_tra_tung_buoi: { label: 'Đang trả từng buổi', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  da_hoan_tien: { label: 'Đã hoàn tiền', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
};

export const DEFAULT_INVOICE_STATUS_META = { label: 'Chờ cập nhật', className: 'bg-zinc-50 text-zinc-500 border-zinc-200' };

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  tra_thang: 'Trả thẳng 100%',
  tra_gop: 'Trả góp theo đợt',
  tung_buoi: 'Trả lẻ từng buổi',
};

export const PACKAGE_STATUS_META: Record<string, { label: string; className: string }> = {
  cho_kich_hoat: { label: 'Chờ kích hoạt', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  dang_dieu_tri: { label: 'Đang điều trị', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hoan_thanh: { label: 'Hoàn thành', className: 'bg-primary/10 text-primary border-primary/25' },
  huy_ngang: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};
