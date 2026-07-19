import { Calendar, User, MapPin, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { InvoiceSnippet } from './InvoiceSnippet';
import { SessionRatingControl } from './SessionRatingControl';
import type { SingleTreatmentEntry } from '../types';

interface SingleTreatmentCardProps {
  item: SingleTreatmentEntry;
}

// 1 buổi dịch vụ lẻ — tái dùng InvoiceSnippet + SessionRatingControl để cùng ngôn ngữ thị giác với
// timeline item của gói liệu trình, thay vì viết riêng JSX gần như trùng lặp như bản cũ.
export function SingleTreatmentCard({ item }: SingleTreatmentCardProps) {
  const dateStr = format(new Date(item.ngay_dieu_tri), 'dd/MM/yyyy · HH:mm', { locale: vi });

  return (
    <div className="bg-white rounded-3xl border border-zinc-150 p-6 md:p-7 shadow-sm flex flex-col lg:flex-row gap-6 hover:shadow-md transition-all duration-300">
      <div className="flex-1 min-w-0 space-y-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md">
            Buổi lẻ
          </span>
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
            <Calendar size={13} /> {dateStr}
          </span>
        </div>

        <h3 className="font-heading text-lg font-black text-secondary tracking-tight">{item.ten_dich_vu}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs text-zinc-600 font-semibold">
            {item.ten_bac_si && <p className="flex items-center gap-1.5"><User size={14} /> {item.ten_bac_si}</p>}
            {item.ten_phong && <p className="flex items-center gap-1.5"><MapPin size={14} /> {item.ten_phong}</p>}
            {item.chan_doan && <p>Chẩn đoán: <span className="text-secondary font-bold">{item.chan_doan}</span></p>}
          </div>
          {item.chong_chi_dinh && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-wider text-rose-500 text-[9.5px]">Chống chỉ định</p>
                <p className="font-semibold mt-0.5">{item.chong_chi_dinh}</p>
              </div>
            </div>
          )}
        </div>

        {(item.vas_truoc !== null || item.vas_sau !== null) && (
          <div className="inline-flex gap-4 p-2.5 px-3.5 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-semibold tabular-nums">
            <span>VAS trước: <strong className="text-secondary">{item.vas_truoc ?? '—'}</strong></span>
            <span>VAS sau: <strong className="text-primary">{item.vas_sau ?? '—'}</strong></span>
          </div>
        )}

        {item.ghi_chu && <p className="text-xs text-zinc-500 italic">Ghi chú: "{item.ghi_chu}"</p>}
      </div>

      <div className="lg:w-72 shrink-0 flex flex-col gap-3.5">
        <InvoiceSnippet
          maHoaDon={item.ma_hoa_don}
          tongTien={item.tong_tien_phai_tra}
          daTra={item.so_tien_da_tra}
          trangThai={item.trang_thai_hoa_don}
        />
        <SessionRatingControl stars={item.danh_gia_sao} comment={item.danh_gia_nhan_xet} reply={item.phan_hoi_nhan_xet} />
      </div>
    </div>
  );
}

export default SingleTreatmentCard;
