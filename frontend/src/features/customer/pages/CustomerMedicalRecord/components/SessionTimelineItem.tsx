import { Calendar, Clock, MapPin, CheckCircle2, ShieldAlert, TrendingDown, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { resolveImageUrl } from '../../../../../utils/imageUrl';
import type { SessionEntry } from '../types';

interface SessionTimelineItemProps {
  session: SessionEntry;
  previousVasSau: number | null;
}

const getVasDescription = (score: number | null): string => {
  if (score === null) return '';
  if (score === 0) return 'Không đau';
  if (score >= 1 && score <= 3) return 'Đau nhẹ: Ê ẩm, mỏi nhẹ (Vẫn làm việc, sinh hoạt bình thường)';
  if (score >= 4 && score <= 6) return 'Đau vừa: Đau rõ rệt, nhức mỏi (Có ảnh hưởng một phần đến sinh hoạt/công việc)';
  if (score >= 7 && score <= 9) return 'Đau nặng: Đau buốt dữ dội (Hạn chế vận động, ảnh hưởng sinh hoạt)';
  if (score === 10) return 'Cực độ: Đau không thể chịu nổi (Hạn chế vận động hoàn toàn, cần can thiệp khẩn cấp)';
  return '';
};

export function SessionTimelineItem({ session, previousVasSau }: SessionTimelineItemProps) {
  const isCompleted = session.trang_thai === 'hoan_thanh';
  const hasClinicalNote = session.chan_doan || session.chong_chi_dinh || session.ghi_chu || session.vas_truoc !== null || session.vas_sau !== null;
  const sessionDate = format(new Date(session.ngay_gio_bat_dau), 'dd/MM/yyyy', { locale: vi });
  const sessionTime = format(new Date(session.ngay_gio_bat_dau), 'HH:mm');

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Cột trái: Ghi nhận lâm sàng & Nhật ký */}
            <div className="flex flex-col gap-4">
              {session.chan_doan && (
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 shrink-0">
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-teal-500" /> Ghi nhận lâm sàng
                  </span>
                  <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mt-1">{session.chan_doan}</p>
                </div>
              )}

              {session.ghi_chu && (
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2 flex-1 flex flex-col justify-start">
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-amber-500" /> Nhật ký &amp; Ghi chú của kỹ thuật viên
                  </span>
                  <p className="text-xs text-zinc-650 dark:text-zinc-450 italic leading-relaxed mt-1 flex-1">"{session.ghi_chu}"</p>
                </div>
              )}

              {session.chong_chi_dinh && (
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex gap-3 text-rose-850 dark:text-rose-450 shrink-0">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <div className="space-y-1">
                    <span className="text-[9.5px] uppercase font-black tracking-wider text-rose-500 block">Chống chỉ định lưu ý</span>
                    <p className="text-xs font-semibold">{session.chong_chi_dinh}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải: Thước đo chỉ số đau (VAS) */}
            <div className="flex">
              {(session.vas_truoc !== null || session.vas_sau !== null) && (
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xs space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-wider mb-3">Chỉ số mức độ đau (VAS)</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center">
                        <span className="text-[9px] text-zinc-455 dark:text-zinc-550 uppercase font-black tracking-wider block">Trước trị liệu</span>
                        <span className="text-2xl font-black text-zinc-700 dark:text-zinc-200 mt-1 block tabular-nums">{session.vas_truoc ?? '—'}</span>
                      </div>
                      <div className="p-3 bg-[#0D9488]/5 dark:bg-[#0D9488]/10 rounded-xl text-center border border-[#0D9488]/10">
                        <span className="text-[9px] text-[#0D9488] uppercase font-black tracking-wider block">Sau trị liệu</span>
                        <span className="text-2xl font-black text-[#0D9488] mt-1 block tabular-nums">{session.vas_sau ?? '—'}</span>
                      </div>
                    </div>

                    {/* Thanh thước đo VAS dạng biểu đồ kéo rút */}
                    {session.vas_truoc !== null && session.vas_sau !== null && (
                      <div className="space-y-1.5 pt-4">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                          <span>0 (Không đau)</span>
                          <span>10 (Rất dữ dội)</span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-25" />
                          
                          {session.vas_truoc !== session.vas_sau && (
                            <div 
                              className={`absolute top-0 bottom-0 opacity-40 transition-all ${
                                session.vas_sau < session.vas_truoc ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ 
                                left: `${Math.min(session.vas_truoc, session.vas_sau) * 10}%`,
                                width: `${Math.abs(session.vas_sau - session.vas_truoc) * 10}%`
                              }}
                            />
                          )}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-zinc-400 border border-white rounded-full -ml-1.25 transition-all shadow-xs" 
                            style={{ left: `${session.vas_truoc * 10}%` }}
                            title={`Trước: ${session.vas_truoc}`}
                          />
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-teal-500 border border-white rounded-full -ml-1.75 transition-all shadow-sm" 
                            style={{ left: `${session.vas_sau * 10}%` }}
                            title={`Sau: ${session.vas_sau}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bảng chi tiết mô tả thang điểm đau */}
                    <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                      {session.vas_truoc !== null && (
                        <div className="flex items-start gap-2 text-[11px] text-zinc-550">
                          <span className="size-2 rounded-full bg-zinc-400 mt-1 shrink-0" />
                          <p className="leading-tight">
                            <span className="font-extrabold text-zinc-700">Mức {session.vas_truoc} (Trước):</span> {getVasDescription(session.vas_truoc)}
                          </p>
                        </div>
                      )}
                      {session.vas_sau !== null && (
                        <div className="flex items-start gap-2 text-[11px] text-teal-650">
                          <span className="size-2 rounded-full bg-teal-500 mt-1 shrink-0" />
                          <p className="leading-tight">
                            <span className="font-extrabold text-teal-700">Mức {session.vas_sau} (Sau):</span> {getVasDescription(session.vas_sau)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {vasDelta !== null && vasDelta !== 0 && (
                    <div className="flex justify-center pt-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          vasDelta < 0 
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                            : 'text-rose-700 bg-rose-50 border-rose-100'
                        }`}
                      >
                        {vasDelta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {vasDelta < 0 ? 'Giảm' : 'Tăng'} {Math.abs(vasDelta)} điểm đau so với buổi trước
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionTimelineItem;
