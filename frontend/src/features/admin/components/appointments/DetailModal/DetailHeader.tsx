import { Calendar, Clock, Edit2, User, Activity } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DetailHeaderProps {
  maLichDat: string;
  tenKhachHang: string;
  soDienThoai?: string;
  ngayGioBatDau: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  durationMs: number;
  tenDichVu?: string;
  soThuTuBuoi?: number | null;
  tongSoBuoiGoi?: number | null;
  loaiGoi?: string | null;
  isRescheduling: boolean;
  setIsRescheduling: (val: boolean) => void;
  selectedTimeSlot?: string;
  rescheduleDate?: string;
  trangThai?: string;
}

export function DetailHeader({
  tenKhachHang,
  soDienThoai,
  ngayGioBatDau,
  aptStartHourStr,
  aptEndHourStr,
  durationMs,
  tenDichVu,
  soThuTuBuoi,
  tongSoBuoiGoi,
  loaiGoi,
  isRescheduling,
  setIsRescheduling,
  selectedTimeSlot,
  rescheduleDate,
  trangThai
}: DetailHeaderProps) {
  // Gói liệu trình: nêu rõ đang là buổi thứ mấy / tổng số buổi, thay vì chỉ tên gói trơ trọi.
  const isPackageSession = loaiGoi === 'LIEU_TRINH' && !!soThuTuBuoi;

  // Check if status is checked-in, completed, or cancelled
  const isCheckedInOrFinished = [
    'da_checkin', 'cho_kham', 'dang_kham', 'hoan_thanh', 
    'da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'
  ].includes(trangThai || '');

  // Nhân sự (Admin/Lễ tân) được đổi lịch bất kỳ lúc nào trước khi ca hẹn check-in/hoàn tất/hủy —
  // không còn giới hạn 8 tiếng như phía khách hàng tự hủy (gate 8h chỉ áp cho khách tự hủy).
  const isRescheduleDisabled = isCheckedInOrFinished;

  const disableReason = isCheckedInOrFinished
    ? 'Không thể đổi lịch của ca đã check-in hoặc hoàn tất/hủy.'
    : '';

  return (
    <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-3.5 select-none shadow-sm">
      {/* Row 1: Khách hàng */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <User size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-455 dark:text-zinc-555 uppercase tracking-widest block">Khách hàng</label>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm font-black text-slate-800 dark:text-zinc-100">{tenKhachHang}</span>
            {soDienThoai && (
              <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-850 font-mono">
                📞 {soDienThoai}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Chi tiết dịch vụ */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <Activity size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-455 dark:text-zinc-555 uppercase tracking-widest block">Chi tiết dịch vụ</label>
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 block mt-1 leading-relaxed">
            {tenDichVu}
            {isPackageSession && (
              <span className="ml-2 inline-flex items-center text-[10px] font-black text-[#0d766e] dark:text-emerald-450 bg-[#0d9488]/10 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-[#0d9488]/15 dark:border-teal-900/20">
                Buổi {soThuTuBuoi} / {tongSoBuoiGoi}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Row 3: Thời gian */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
          <Clock size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-slate-455 dark:text-zinc-555 uppercase tracking-widest block">Khung giờ hẹn</label>
          <div className="flex items-center justify-between gap-3 mt-1 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                {aptStartHourStr} - {aptEndHourStr}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                ({Math.round(durationMs / 60000)} phút)
              </span>
            </div>

            {/* Hiển thị ngày bắt đầu */}
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
              disabled={isRescheduleDisabled}
              onClick={() => setIsRescheduling(!isRescheduling)}
              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                isRescheduling
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : isRescheduleDisabled
                    ? 'bg-slate-100 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed opacity-50'
                    : 'bg-emerald-50 dark:bg-emerald-955/40 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/70 cursor-pointer'
              }`}
              title={disableReason || "Thay đổi ngày/giờ hẹn"}
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
