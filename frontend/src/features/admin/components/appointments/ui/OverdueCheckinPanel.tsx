import { Clock, UserX } from 'lucide-react';
import { format } from 'date-fns';

interface OverdueCheckinPanelProps {
  appointments: any[];
  onOpenDetailModal: (apt: any) => void;
}

function getFormattedService(apt: any) {
  const serviceName = apt.ten_dich_vu || 'Chưa xác định';
  const isExam = ['kham_moi', 'KHAM'].includes(apt.loai_lich || '');
  const isRetail = ['dich_vu_don', 'DICH_VU_LE'].includes(apt.loai_lich || '') || apt.loai_goi === 'LE';
  
  if (isExam) {
    return `Khám: ${serviceName}`;
  }
  if (isRetail) {
    return `Dịch vụ lẻ: ${serviceName}`;
  }
  return `Liệu trình: ${serviceName} (Buổi ${apt.so_thu_tu_buoi || 1})`;
}

export function OverdueCheckinPanel({ appointments, onOpenDetailModal }: OverdueCheckinPanelProps) {
  if (appointments.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <UserX size={16} className="text-rose-500 animate-pulse" /> Quá giờ chưa check-in
        </h3>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-100/30">
          {appointments.length} ca
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {appointments.map((apt) => {
          const startTime = new Date(apt.ngay_gio_bat_dau).getTime();
          const minsOverdue = Math.floor((Date.now() - startTime) / 60000);

          return (
            <div
              key={apt.id}
              onClick={() => onOpenDetailModal(apt)}
              className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-955/15 border border-rose-200 dark:border-rose-900/50 hover:border-rose-650 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-1.5 relative overflow-hidden group border-l-4 border-l-rose-500"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 capitalize flex items-center gap-1">
                  <span>⏳</span> {apt.ten_khach_hang}
                </span>
                <span className="font-mono text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700/50 text-slate-500 dark:text-zinc-400">
                  {apt.ma_lich_dat}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-650 dark:text-zinc-405 font-bold">
                  SĐT: <span className="font-black text-slate-800 dark:text-zinc-200">{apt.so_dien_thoai || 'Không có'}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold truncate">
                  Dịch vụ: <span className="text-slate-700 dark:text-zinc-300">{getFormattedService(apt)}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-semibold">
                  Lịch hẹn: <span className="font-bold text-teal-600 dark:text-teal-400">{format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy (HH:mm)')}</span>
                </p>
                <div className="flex justify-between items-center text-[9px] font-bold mt-1">
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <Clock size={11} className="text-rose-500 animate-pulse" /> Muộn {minsOverdue} phút
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-black uppercase text-[8px] tracking-wider bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-100/30">
                    Check-in ➜
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
