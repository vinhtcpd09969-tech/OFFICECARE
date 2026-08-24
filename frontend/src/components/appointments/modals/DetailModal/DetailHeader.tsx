import { Calendar, Clock, Edit2, User, Activity } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DetailHeaderProps {
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
  selectedBuoi?: 'sang' | 'chieu' | '';
  rescheduleDate?: string;
  currentBuoi?: string;
  trangThai?: string;
}

const BUOI_LABEL: Record<string, string> = { sang: 'Buổi sáng', chieu: 'Buổi chiều' };

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
  selectedBuoi,
  rescheduleDate,
  currentBuoi,
  trangThai
}: DetailHeaderProps) {
  // Gói liệu trình: nêu rõ đang là buổi thứ mấy / tổng số buổi, thay vì chỉ tên gói trơ trọi.
  const isPackageSession = loaiGoi === 'LIEU_TRINH' && !!soThuTuBuoi;

  // Đổi buổi chỉ hợp lệ khi lịch còn ở `da_xac_nhan`/`da_checkin` (race-condition guard lớp 1 —
  // xem mục "Đổi buổi" trong kế hoạch tổng): ca đang thực hiện, chờ tái lượng giá, đã hoàn thành,
  // đã hủy hoặc không đến đều không còn ý nghĩa để dời buổi.
  const RESCHEDULABLE_STATUSES = ['da_xac_nhan', 'da_checkin'];
  const isRescheduleDisabled = !RESCHEDULABLE_STATUSES.includes(trangThai || '');

  const disableReason = isRescheduleDisabled
    ? 'Không thể đổi lịch của ca đang thực hiện, chờ tái lượng giá, đã hoàn tất, đã hủy hoặc không đến.'
    : '';

  return (
    <div className="bg-slate-50/90 dark:bg-zinc-800/40 p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 select-none shadow-xs">
      {/* Row 1: Khách hàng */}
      <div className="flex items-center gap-3.5">
        <div className="size-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
          <User size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Khách hàng</label>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{tenKhachHang}</span>
            {soDienThoai && (
              <span className="inline-flex items-center text-[10px] font-mono font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg border border-teal-200/60 dark:border-teal-900/40">
                📞 {soDienThoai}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200/60 dark:bg-zinc-800/60 w-full" />

      {/* Row 2: Chi tiết dịch vụ */}
      <div className="flex items-start gap-3.5">
        <div className="size-9 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shrink-0 border border-cyan-500/20 mt-0.5">
          <Activity size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Chi tiết dịch vụ</label>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 leading-relaxed">
              {tenDichVu || 'Lượng giá Chức năng PHCN'}
            </span>
            {isPackageSession && (
              <span className="inline-flex items-center text-[10px] font-black text-[#0d766e] dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-teal-200/50">
                Buổi {soThuTuBuoi} / {tongSoBuoiGoi}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200/60 dark:bg-zinc-800/60 w-full" />

      {/* Row 3: Thời gian & Đổi lịch */}
      <div className="flex items-center gap-3.5">
        <div className="size-9 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
          <Clock size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Khung giờ hẹn</label>
          <div className="flex items-center justify-between gap-3 mt-1 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-zinc-100 font-mono">
                {aptStartHourStr} - {aptEndHourStr}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                {Math.round(durationMs / 60000)} phút
              </span>
            </div>

            {/* Hiển thị ngày bắt đầu */}
            {(() => {
              const dateObj = new Date(ngayGioBatDau);
              if (isValid(dateObj)) {
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-700 dark:text-zinc-300 font-mono font-black bg-white dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xs">
                    <Calendar size={11} className="text-amber-500" />
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
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                isRescheduling
                  ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 shadow-sm'
                  : isRescheduleDisabled
                    ? 'bg-slate-100 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed opacity-50'
                    : 'bg-teal-50 dark:bg-teal-955/40 border-teal-200/80 dark:border-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100/70 cursor-pointer shadow-2xs'
              }`}
              title={disableReason || "Thay đổi ngày/giờ hẹn"}
            >
              <Edit2 size={12} />
              <span className="text-[10px] font-black uppercase tracking-wider">Đổi lịch</span>
            </button>

            {isRescheduling && (() => {
              if (!selectedBuoi || !rescheduleDate) return null;
              const origStart = new Date(ngayGioBatDau);
              const origDateStr = format(origStart, 'yyyy-MM-dd');
              const isChanged = selectedBuoi !== currentBuoi || rescheduleDate !== origDateStr;
              if (!isChanged) return null;
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-rose-700 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 px-2.5 py-1.5 rounded-lg">
                  👉 Lịch muốn đổi: {BUOI_LABEL[selectedBuoi]} ({format(new Date(rescheduleDate), 'dd/MM/yyyy')})
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
