import { Calendar, ChevronRight, Package, Stethoscope, Wrench } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import type { CustomerInvoice } from '../../../api/customer.api';

interface InvoiceCardProps {
  invoice: CustomerInvoice;
  onOpen: (invoice: CustomerInvoice) => void;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  chua_thanh_toan: { label: 'Chưa thanh toán', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  dang_tra_tung_buoi: { label: 'Đang trả từng buổi', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  dang_tra_gop: { label: 'Đang trả góp', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  da_huy: { label: 'Đã hủy', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  da_hoan_tien: { label: 'Đã hoàn tiền', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
};

const TYPE_META: Record<string, { label: string; icon: typeof Package }> = {
  LIEU_TRINH: { label: 'Gói liệu trình', icon: Package },
  LE: { label: 'Dịch vụ lẻ', icon: Wrench },
  KHAM: { label: 'Khám lâm sàng', icon: Stethoscope },
};

export function InvoiceCard({ invoice, onOpen }: InvoiceCardProps) {
  const statusMeta = STATUS_META[invoice.trang_thai] || { label: invoice.trang_thai, cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  const typeMeta = TYPE_META[invoice.loai_goi || 'KHAM'] || TYPE_META.KHAM;
  const TypeIcon = typeMeta.icon;
  const dateStr = new Date(invoice.ngay_tao).toLocaleDateString('vi-VN');

  return (
    <button
      type="button"
      onClick={() => onOpen(invoice)}
      className="w-full text-left bg-white rounded-3xl border border-zinc-150 p-5 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
    >
      <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
        <TypeIcon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded">
            {typeMeta.label}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
        </div>
        <h4 className="text-sm font-black text-secondary truncate">{invoice.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'}</h4>
        <p className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1.5 mt-0.5">
          <Calendar size={11} /> {dateStr} · {invoice.ma_hoa_don}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-black text-secondary">{formatCurrency(invoice.tong_tien_thanh_toan)}</p>
        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Đã đóng: {formatCurrency(invoice.da_thanh_toan)}</p>
      </div>

      <ChevronRight size={16} className="text-zinc-300 shrink-0" />
    </button>
  );
}
