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
      className="w-full text-left bg-white rounded-2xl border border-zinc-150 hover:border-teal-500/40 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 group"
    >
      {/* Left Icon & Information */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <TypeIcon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[10px] font-extrabold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
              {invoice.ma_hoa_don}
            </span>
            <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
              <Calendar size={11} /> {dateStr}
            </span>
            <span className={`text-[9.5px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md border ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-black text-zinc-800 truncate group-hover:text-teal-700 transition-colors">
            {invoice.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'}
          </h4>
        </div>
      </div>

      {/* Right Price & Paid Status */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        <div>
          <p className="text-xs sm:text-sm font-black text-zinc-900 tracking-tight">
            {formatCurrency(invoice.tong_tien_thanh_toan)}
          </p>
          <p className="text-[10.5px] text-zinc-400 font-semibold mt-0.5">
            Đã đóng: <span className="text-zinc-600 font-bold">{formatCurrency(invoice.da_thanh_toan)}</span>
          </p>
        </div>

        <div className="size-7 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-400 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 flex items-center justify-center transition-all">
          <ChevronRight size={14} />
        </div>
      </div>
    </button>
  );
}
