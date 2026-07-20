import { Calendar, ShieldAlert, MessageSquareText, ImageIcon, PackageCheck, ArrowRight, Clock3 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { InvoiceSnippet } from './InvoiceSnippet';
import { resolveImageUrl } from '../../../../../utils/imageUrl';
import { getStaffRoleTitle } from '../../../../../utils/staff';
import type { ExamEntry } from '../types';

interface ExamHistoryCardProps {
  exam: ExamEntry;
  onJumpToPackage?: (phacDoId: string) => void;
}

export function ExamHistoryCard({ exam, onJumpToPackage }: ExamHistoryCardProps) {
  const dateStr = format(new Date(exam.ngay_kham), 'dd/MM/yyyy · HH:mm', { locale: vi });

  return (
    <div className="bg-white rounded-3xl border border-zinc-150 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md">
            Khám lâm sàng
          </span>
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
            <Calendar size={13} /> {dateStr}
          </span>
        </div>

        <div className="border-b border-zinc-100 pb-3">
          <p className="text-[9.5px] uppercase font-black text-zinc-400 tracking-wider">Chẩn đoán lâm sàng</p>
          <p className="text-base font-black text-secondary mt-1">{exam.chan_doan || 'Khám tổng quát cơ xương khớp'}</p>
        </div>

        {exam.chong_chi_dinh && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex gap-2">
            <ShieldAlert size={17} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-rose-500 text-[9.5px]">Chống chỉ định đặc biệt</p>
              <p className="font-semibold mt-0.5">{exam.chong_chi_dinh}</p>
            </div>
          </div>
        )}

        {exam.ghi_chu && (
          <div>
            <p className="text-[9.5px] uppercase font-black text-zinc-400 tracking-wider">Ghi chú của bác sĩ</p>
            <p className="text-xs text-zinc-600 italic mt-0.5">"{exam.ghi_chu}"</p>
          </div>
        )}

        {exam.khuyen_nghi_goi && exam.khuyen_nghi_phac_do_id && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 flex items-start justify-between gap-3">
            <div className="flex gap-2 min-w-0">
              <PackageCheck size={17} className="shrink-0 mt-0.5 text-emerald-600" />
              <div className="min-w-0">
                <p className="font-black uppercase tracking-wider text-emerald-600 text-[9.5px]">Gói khuyến nghị</p>
                <p className="font-semibold mt-0.5 text-xs line-clamp-2">{exam.khuyen_nghi_goi}</p>
              </div>
            </div>
            {onJumpToPackage && (
              <button
                type="button"
                onClick={() => onJumpToPackage(exam.khuyen_nghi_phac_do_id!)}
                className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Xem liệu trình <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}

        {exam.khuyen_nghi_goi && !exam.khuyen_nghi_phac_do_id && exam.khuyen_nghi_han_kich_hoat && (() => {
          const daysLeft = Math.ceil(
            (new Date(exam.khuyen_nghi_han_kich_hoat).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysLeft <= 0) return null;
          return (
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900">
              <div className="flex items-start gap-2">
                <Clock3 size={17} className="shrink-0 mt-0.5 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black uppercase tracking-wider text-amber-600 text-[9.5px]">Gói khuyến nghị</p>
                    <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Chờ kích hoạt
                    </span>
                  </div>
                  <p className="font-semibold mt-0.5 text-xs line-clamp-2">{exam.khuyen_nghi_goi}</p>
                  <p className={`text-[10px] font-bold mt-1 ${daysLeft <= 3 ? 'text-red-600' : 'text-amber-700'}`}>
                    ⏱ Còn {daysLeft} ngày để kích hoạt
                  </p>
                </div>
              </div>
              <p className="text-[10.5px] text-amber-700 font-semibold mt-2 pt-2 border-t border-amber-200/70">
                Vui lòng liên hệ phòng khám để thanh toán và kích hoạt.
              </p>
            </div>
          );
        })()}

        <div className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl">
          <p className="text-[9.5px] uppercase font-black text-zinc-400 tracking-wider flex items-center gap-1.5 mb-1">
            <MessageSquareText size={12} /> Lý do khám (bạn cung cấp lúc đặt lịch)
          </p>
          <p className="text-xs font-semibold text-zinc-700 leading-relaxed">{exam.ly_do_kham || 'Không có ghi chú.'}</p>
        </div>

        {exam.anh_dinh_kem_url && (
          <div>
            <p className="text-[9.5px] uppercase font-black text-zinc-400 tracking-wider flex items-center gap-1.5 mb-1.5">
              <ImageIcon size={12} /> Ảnh bạn đã đính kèm
            </p>
            <a
              href={resolveImageUrl(exam.anh_dinh_kem_url)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-zinc-100 bg-zinc-50 overflow-hidden flex items-center justify-center"
            >
              <img
                src={resolveImageUrl(exam.anh_dinh_kem_url)}
                alt="Ảnh đính kèm khi đặt lịch khám"
                className="max-h-72 w-full object-contain"
              />
            </a>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 pt-4 flex items-center gap-3">
        {exam.anh_bac_si ? (
          <img
            src={resolveImageUrl(exam.anh_bac_si)}
            alt={exam.ten_bac_si || 'Bác sĩ'}
            className="size-11 rounded-full object-cover border border-zinc-200 shadow-sm shrink-0"
          />
        ) : (
          <div className="size-11 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
            {exam.ten_bac_si?.trim()?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Bác sĩ khám</p>
          <h4 className="text-sm font-black text-secondary truncate">{exam.ten_bac_si || 'Đang cập nhật'}</h4>
          <p className="text-[11px] font-semibold text-zinc-500 truncate">{getStaffRoleTitle(exam.ten_bac_si, exam.vai_tro_bac_si)} · {exam.ten_phong || 'Phòng khám'}</p>
        </div>
      </div>

      {exam.hoa_don_id && (
        <InvoiceSnippet
          maHoaDon={exam.ma_hoa_don}
          tongTien={exam.tong_tien_phai_tra}
          daTra={exam.so_tien_da_tra}
          trangThai={exam.trang_thai_hoa_don}
        />
      )}
    </div>
  );
}

export default ExamHistoryCard;
