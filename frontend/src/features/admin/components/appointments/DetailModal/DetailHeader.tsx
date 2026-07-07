import { Calendar, Clock, Edit2, User, Phone, Activity } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DetailHeaderProps {
  maLichDat: string;
  tenKhachHang: string;
  soDienThoai: string;
  ngayGioBatDau: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  durationMs: number;
  tenDichVu?: string;
  isRescheduling: boolean;
  setIsRescheduling: (val: boolean) => void;
  selectedTimeSlot?: string;
  rescheduleDate?: string;
}

export function DetailHeader({
  tenKhachHang,
  soDienThoai,
  ngayGioBatDau,
  aptStartHourStr,
  aptEndHourStr,
  durationMs,
  tenDichVu,
  isRescheduling,
  setIsRescheduling,
  selectedTimeSlot,
  rescheduleDate
}: DetailHeaderProps) {
  return (
    <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-3.5 select-none shadow-sm">
      {/* Row 1: Khách hàng */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <User size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-550 uppercase tracking-widest block">Khách hàng</label>
          <span className="text-sm font-black text-slate-800 dark:text-zinc-100 block mt-0.5">{tenKhachHang}</span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-zinc-800/50" />

      {/* Row 2: Số điện thoại */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-105 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <Phone size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-555 uppercase tracking-widest block">Số điện thoại</label>
          <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block mt-0.5">{soDienThoai}</span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-zinc-800/50" />

      {/* Row 3: Dịch vụ đặt */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <Activity size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-455 dark:text-zinc-500 uppercase tracking-widest block">Dịch vụ đặt</label>
          <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-150 block mt-0.5 leading-relaxed whitespace-pre-wrap">
            {tenDichVu || 'Khám y tế mới'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-555 dark:text-zinc-500 font-bold mt-1">
            ⏳ {Math.round(durationMs / 60000)} phút
          </span>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-zinc-800/50" />

      {/* Row 4: Khung giờ hẹn */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <Clock size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-550 uppercase tracking-widest block">Khung giờ hẹn</label>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-mono font-black text-emerald-700 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-lg">
              {aptStartHourStr} - {aptEndHourStr}
            </span>
            
            {(() => {
              const dateObj = new Date(ngayGioBatDau);
              if (isValid(dateObj)) {
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-655 dark:text-zinc-350 font-mono font-bold bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-850">
                    <Calendar size={10} />
                    {format(dateObj, 'dd/MM/yyyy')}
                  </span>
                );
              }
              return null;
            })()}

             <button
              type="button"
              onClick={() => setIsRescheduling(!isRescheduling)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isRescheduling
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-955/40 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/70'
              }`}
              title="Thay đổi ngày/giờ hẹn"
            >
              <Edit2 size={11} />
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Đổi lịch</span>
            </button>

            {isRescheduling && (() => {
              if (!selectedTimeSlot || !rescheduleDate) return null;
              const origStart = new Date(ngayGioBatDau);
              const origDateStr = format(origStart, 'yyyy-MM-dd');
              const isChanged = selectedTimeSlot !== aptStartHourStr || rescheduleDate !== origDateStr;
              if (!isChanged) return null;
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-rose-700 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 px-2.5 py-1.5 rounded-lg">
                  👉 Lịch muốn đổi: {selectedTimeSlot} ({format(new Date(rescheduleDate), 'dd/MM/yyyy')})
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
