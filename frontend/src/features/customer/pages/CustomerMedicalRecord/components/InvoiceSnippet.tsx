import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import { INVOICE_STATUS_META, DEFAULT_INVOICE_STATUS_META } from '../constants';

interface InvoiceSnippetProps {
  maHoaDon: string | null;
  tongTien: number | null;
  daTra: number | null;
  trangThai: string | null;
}

export function InvoiceSnippet({ maHoaDon, tongTien, daTra, trangThai }: InvoiceSnippetProps) {
  if (maHoaDon === null && tongTien === null) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
        <p className="text-[11px] font-bold text-slate-400">Buổi này chưa được lập hóa đơn</p>
      </div>
    );
  }

  const meta = (trangThai && INVOICE_STATUS_META[trangThai]) || DEFAULT_INVOICE_STATUS_META;
  const remaining = Math.max(0, (tongTien ?? 0) - (daTra ?? 0));

  return (
    <div className="rounded-2xl border border-slate-150 bg-white p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5 truncate">
          <CreditCard size={13} className="shrink-0 text-[#0D9488]" /> HĐ {maHoaDon || 'Chờ cấp'}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${meta.className}`}>
          {meta.label}
        </span>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-500 font-semibold">Tổng giá trị</span>
          <span className="font-black text-slate-900 tabular-nums">{formatCurrency(tongTien)}</span>
        </div>
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-500 font-semibold">Đã thanh toán</span>
          <span className="font-extrabold text-emerald-600 tabular-nums">{formatCurrency(daTra)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between items-baseline text-xs pt-1 border-t border-slate-100/80">
            <span className="text-slate-500 font-semibold">Còn lại</span>
            <span className="font-black text-rose-600 tabular-nums">{formatCurrency(remaining)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceSnippet;
