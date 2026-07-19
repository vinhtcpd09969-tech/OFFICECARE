import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import { INVOICE_STATUS_META, DEFAULT_INVOICE_STATUS_META } from '../constants';

interface InvoiceSnippetProps {
  maHoaDon: string | null;
  tongTien: number | null;
  daTra: number | null;
  trangThai: string | null;
}

// Khối hóa đơn gọn dùng chung cho cả 3 tab (gói/dịch vụ lẻ/khám) — trước đây mỗi tab tự viết JSX
// riêng gần giống hệt nhau, gộp lại 1 nơi cho đúng DRY.
export function InvoiceSnippet({ maHoaDon, tongTien, daTra, trangThai }: InvoiceSnippetProps) {
  // Buổi lẻ đã hoàn thành nhưng lễ tân chưa lập hóa đơn thì cả 3 trường này đều null (LEFT JOIN
  // hoa_don không khớp dòng nào) — không suy diễn thành "0đ" gây hiểu nhầm là miễn phí.
  if (maHoaDon === null && tongTien === null) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center">
        <p className="text-[11px] font-bold text-zinc-400">Buổi này chưa được lập hóa đơn</p>
      </div>
    );
  }

  const meta = (trangThai && INVOICE_STATUS_META[trangThai]) || DEFAULT_INVOICE_STATUS_META;
  const remaining = Math.max(0, (tongTien ?? 0) - (daTra ?? 0));

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 truncate">
          <CreditCard size={12} className="shrink-0" /> HĐ {maHoaDon || 'Chờ cấp'}
        </span>
        <span className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border shrink-0 ${meta.className}`}>
          {meta.label}
        </span>
      </div>
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-zinc-500 font-semibold">Tổng giá trị</span>
        <span className="font-black text-secondary tabular-nums">{formatCurrency(tongTien)}</span>
      </div>
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-zinc-500 font-semibold">Đã thanh toán</span>
        <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(daTra)}</span>
      </div>
      {remaining > 0 && (
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-zinc-500 font-semibold">Còn lại</span>
          <span className="font-black text-rose-600 tabular-nums">{formatCurrency(remaining)}</span>
        </div>
      )}
    </div>
  );
}

export default InvoiceSnippet;
