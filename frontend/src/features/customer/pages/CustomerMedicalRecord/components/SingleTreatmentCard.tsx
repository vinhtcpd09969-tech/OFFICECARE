import { Calendar, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { InvoiceSnippet } from './InvoiceSnippet';
import { SessionRatingControl } from './SessionRatingControl';
import { TreatmentSessionDetailBody } from '../../../../clinical/components/TreatmentSessionDetailBody';
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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 font-semibold">
          {item.ten_bac_si && <p className="flex items-center gap-1.5"><User size={14} /> {item.ten_bac_si}</p>}
          {item.ten_phong && <p className="flex items-center gap-1.5"><MapPin size={14} /> {item.ten_phong}</p>}
        </div>

        <TreatmentSessionDetailBody
          chanDoan={item.chan_doan}
          ghiChu={item.ghi_chu}
          chongChiDinh={item.chong_chi_dinh}
          vasTruoc={item.vas_truoc}
          vasSau={item.vas_sau}
        />
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
