import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UnassignedPanelProps {
  unassignedAppointments: any[];
  onOpenDetailModal: (apt: any) => void;
}

export function UnassignedPanel({ unassignedAppointments, onOpenDetailModal }: UnassignedPanelProps) {
  if (unassignedAppointments.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle size={16} className="text-amber-500 animate-pulse" /> Chờ phân bổ bác sĩ
        </h3>
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">Hôm nay</span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {unassignedAppointments.map((apt) => (
          <div
            key={apt.id}
            onClick={() => onOpenDetailModal(apt)}
            className="p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-100/50 dark:border-zinc-800/50 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 capitalize">{apt.ten_khach_hang}</span>
              <span className="font-mono text-[9px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-slate-650 dark:text-zinc-350">{apt.ma_lich_dat}</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
              Khung giờ: {format(new Date(apt.ngay_gio_bat_dau), 'HH:mm')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
