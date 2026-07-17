import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface PendingPaymentPanelProps {
  appointments: any[];
  onOpenDetailModal: (apt: any) => void;
}

const EXAM_LICH_TYPES = ['kham_moi', 'KHAM', 'dich_vu_don', 'DICH_VU_LE'];

const SESSION_STATUS_LABELS: Record<string, string> = {
  da_checkin: 'Đã check-in',
  cho_kham: 'Đang chờ khám',
  dang_kham: 'Đang khám/điều trị',
  hoan_thanh: 'Đã hoàn thành',
};

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

export function PendingPaymentPanel({ appointments, onOpenDetailModal }: PendingPaymentPanelProps) {
  if (appointments.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <CreditCard size={16} className="text-teal-600 animate-pulse" /> Lịch hẹn cần thanh toán
        </h3>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-955/20 text-teal-600 dark:text-teal-400 border border-teal-100/30">
          {appointments.length} ca
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {appointments.map((apt) => {
          const isExamType = EXAM_LICH_TYPES.includes(apt.loai_lich || '');
          const sessionStatusLabel = SESSION_STATUS_LABELS[apt.trang_thai] || apt.trang_thai.replace('_', ' ');

          return (
            <div
              key={apt.id}
              onClick={() => onOpenDetailModal(apt)}
              className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-150/70 dark:border-zinc-800/80 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-1.5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 h-full w-1 bg-teal-500/20 group-hover:bg-teal-500 transition-colors" />

              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 capitalize flex items-center gap-1">
                  <span>💵</span> {apt.ten_khach_hang}
                </span>
                <span className="font-mono text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700/50 text-slate-500 dark:text-zinc-400">
                  {apt.ma_lich_dat}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold truncate">
                  Dịch vụ: <span className="text-slate-700 dark:text-zinc-300">{getFormattedService(apt)}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-semibold">
                  Lịch hẹn: <span className="font-bold text-teal-600 dark:text-teal-400">{format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy (HH:mm)')}</span>
                </p>
                <p className="text-[9px] font-bold text-slate-400">
                  Trạng thái {isExamType ? 'khám' : 'điều trị'}: <span className="font-black text-slate-600 dark:text-zinc-300">{sessionStatusLabel}</span>
                </p>
                <p className="text-[9px] font-bold text-rose-500">
                  Trạng thái thanh toán: <span className="font-black text-rose-600">Chưa thanh toán</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
