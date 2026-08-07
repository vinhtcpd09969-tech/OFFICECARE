import { Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { resolveImageUrl } from '../../../../../utils/imageUrl';
import { TreatmentSessionDetailBody } from '../../../../../components/TreatmentSessionDetailBody';
import type { SessionEntry } from '../types';

interface SessionTimelineItemProps {
  session: SessionEntry;
  previousVasSau: number | null;
}

export function SessionTimelineItem({ session, previousVasSau }: SessionTimelineItemProps) {
  const isCompleted = session.trang_thai === 'hoan_thanh';
  const hasClinicalNote = session.chan_doan || session.chong_chi_dinh || session.ghi_chu || session.vas_truoc !== null || session.vas_sau !== null;
  const sessionDate = format(new Date(session.ngay_gio_bat_dau), 'dd/MM/yyyy', { locale: vi });
  const sessionTime = format(new Date(session.ngay_gio_bat_dau), 'HH:mm');

  // So sánh với vas_sau của BUỔI TRƯỚC (không phải trước/sau trong cùng buổi) — theo dõi tiến triển
  // xuyên suốt liệu trình, khác với delta trước/sau nội bộ 1 buổi mà TreatmentSessionDetailBody tính mặc định.
  const vasDelta =
    session.vas_sau !== null && previousVasSau !== null ? session.vas_sau - previousVasSau : null;

  return (
    <div id={`session-${session.cuoc_hen_id}`} className="text-secondary w-full">
      <div className="bg-zinc-50/40 hover:bg-zinc-50 rounded-3xl border border-zinc-150/60 p-5 md:p-6 transition-all duration-300 space-y-5">
        {/* Header buổi điều trị */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isCompleted ? 'bg-teal-500/10 text-teal-650 border border-teal-500/15' : 'bg-zinc-100 text-zinc-450'
            }`}>
              {isCompleted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            </div>
            <div>
              <h4 className="text-sm font-black text-secondary leading-tight">Buổi {session.so_thu_tu_buoi}</h4>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-zinc-500 font-semibold mt-1">
                <span className="flex items-center gap-1"><Calendar size={12} /> {sessionDate}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {sessionTime}</span>
                {session.ten_bac_si && (
                  <span className="flex items-center gap-1.5">
                    {session.anh_ky_thuat_vien ? (
                      <img
                        src={resolveImageUrl(session.anh_ky_thuat_vien)}
                        alt={session.ten_bac_si}
                        className="w-4 h-4 rounded-full object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center text-[7px] font-black shrink-0">
                        {session.ten_bac_si.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    KTV. {session.ten_bac_si}
                  </span>
                )}
                {session.ten_phong && <span className="flex items-center gap-1"><MapPin size={12} /> {session.ten_phong}</span>}
              </div>
            </div>
          </div>
          <span className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/10 border border-[#0D9488]/20 rounded-xl shrink-0">
            Đã thực hiện
          </span>
        </div>

        {/* Nội dung chi tiết buổi điều trị */}
        {!hasClinicalNote ? (
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl text-center shadow-xs">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
              Buổi đã hoàn thành — kỹ thuật viên chưa ghi nhận nhật ký chẩn đoán/VAS cho buổi này.
            </p>
          </div>
        ) : (
          <TreatmentSessionDetailBody
            chanDoan={session.chan_doan}
            ghiChu={session.ghi_chu}
            chongChiDinh={session.chong_chi_dinh}
            vasTruoc={session.vas_truoc}
            vasSau={session.vas_sau}
            vasDeltaOverride={vasDelta}
            vasDeltaSuffixLabel="so với buổi trước"
          />
        )}
      </div>
    </div>
  );
}

export default SessionTimelineItem;
