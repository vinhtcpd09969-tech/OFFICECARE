import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Sparkles,
  MapPin,
  User,
  Building2,
  XCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { resolveImageUrl } from '../../../../../utils/imageUrl';

interface AppointmentCardProps {
  app: any;
  currentTime: Date;
  getStatusColorClass: (status: string) => string;
  formatDateTime: (isoString: string) => { dateStr: string; timeStr: string };
  getCountdownString: (startTimeIso: string, buoi?: string | null) => string;
  onViewTimeline: (app: any) => void;
  onViewTreatmentDetail: (app: any) => void;
  onOpenReschedule: (app: any) => void;
  onOpenCancel: (appId: string) => void;
}

export const AppointmentCard = forwardRef<HTMLDivElement, AppointmentCardProps>(function AppointmentCard({
  app,
  currentTime,
  getStatusColorClass,
  formatDateTime,
  getCountdownString,
  onViewTimeline,
  onViewTreatmentDetail,
  onOpenReschedule,
  onOpenCancel
}: AppointmentCardProps, ref) {
  const { dateStr } = formatDateTime(app.ngay_gio_bat_dau);
  const gradientStatus = getStatusColorClass(app.trang_thai);
  const docAvatar = resolveImageUrl(app.anh_bac_si);

  const isConfirmed = app.trang_thai === 'da_xac_nhan';
  const isCheckedIn = ['da_checkin', 'dang_kham'].includes(app.trang_thai);
  const isCompleted = app.trang_thai === 'hoan_thanh';
  const isCancelled = ['da_huy', 'khong_den'].includes(app.trang_thai);
  const isPendingReExam = app.trang_thai === 'cho_tai_luong_gia';

  const isPaidOrPending = app.trang_thai_thanh_toan === 'da_thanh_toan' || app.trang_thai_thanh_toan === 'dang_cho_thanh_toan';
  const isPaid = app.trang_thai_thanh_toan === 'da_thanh_toan';

  // Tính thời gian đếm ngược 60 phút tự HỦY (Lịch chưa thanh toán)
  const CANCEL_WINDOW_MS = 60 * 60 * 1000;
  const elapsedSinceBookingMs = app.thoi_gian_tao ? currentTime.getTime() - new Date(app.thoi_gian_tao).getTime() : Infinity;
  const remainingCancelMs = Math.max(0, CANCEL_WINDOW_MS - elapsedSinceBookingMs);
  const remainingCancelSecs = Math.floor(remainingCancelMs / 1000);
  const canSelfCancel = !isPaidOrPending
    && remainingCancelSecs > 0
    && app.trang_thai === 'da_xac_nhan'
    && currentTime.getTime() < new Date(app.ngay_gio_ket_thuc).getTime();

  // Định dạng MM:SS cho nút Hủy Lịch
  const cancelMinsStr = Math.floor(remainingCancelSecs / 60);
  const cancelSecsStr = String(remainingCancelSecs % 60).padStart(2, '0');
  const cancelCountdownLabel = `${cancelMinsStr}:${cancelSecsStr}`;

  // Tính thời gian tự ĐỔI LỊCH (Lịch đã thanh toán)
  const apptDateObj = new Date(app.ngay_gio_bat_dau);
  const apptDateStr = `${apptDateObj.getFullYear()}-${String(apptDateObj.getMonth() + 1).padStart(2, '0')}-${String(apptDateObj.getDate()).padStart(2, '0')}`;
  const todayStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
  const isTodayAppt = apptDateStr === todayStr;
  const isPastDate = apptDateStr < todayStr;

  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isMorningAppt = app.buoi === 'sang' || apptDateObj.getHours() < 12;
  const cutoffMins = isMorningAppt ? (7 * 60 + 30 + 135) : (12 * 60 + 225); // 9:45 AM hoặc 15:45 PM
  const isPast50PercentCutoff = isPaid && app.trang_thai === 'da_xac_nhan' && (isPastDate || (isTodayAppt && nowMins >= cutoffMins));
  const canSelfReschedule = isPaid && app.trang_thai === 'da_xac_nhan' && !isPastDate;

  // Đếm ngược mốc 50% buổi cho Lịch Đã Thanh Toán diễn ra hôm nay
  const remainingCutoffMins = Math.max(0, cutoffMins - nowMins);
  const remainingCutoffSecs = Math.max(0, remainingCutoffMins * 60 - currentTime.getSeconds());
  const rescheduleMinsStr = Math.floor(remainingCutoffSecs / 60);
  const rescheduleSecsStr = String(remainingCutoffSecs % 60).padStart(2, '0');
  const rescheduleCountdownLabel = `${rescheduleMinsStr}:${rescheduleSecsStr}`;

  // Dòng thông báo Hotline CHỈ HIỂN THỊ KHI HẾT HẠN TỰ THAO TÁC ONLINE (cả 2 loại lịch):
  const showWarningNotice = app.trang_thai === 'da_xac_nhan' && (
    (!isPaidOrPending && remainingCancelSecs <= 0) || // Lịch chưa thanh toán & đã HẾT 60 phút
    (isPaid && (isPast50PercentCutoff || isPastDate)) // Lịch đã thanh toán & đã QUÁ mốc 50% thời gian hoặc quá ngày
  );

  const isPackageSession = app.loai_goi === 'LIEU_TRINH' && !!app.so_thu_tu_buoi;

  const getInitials = (fullName: string | null) => {
    if (!fullName) return 'BS';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const isMorningSession = app.buoi === 'sang';
  const buoiLabel = isMorningSession ? 'Buổi Sáng (07:30 – 12:00)' : 'Buổi Chiều (12:00 – 20:00)';
  const durationMins = app.thoi_luong_phut || 30;
  const sessionEndMins = isMorningSession ? (12 * 60) : (20 * 60);
  const latestArrivalMins = sessionEndMins - durationMins;
  const latestH = Math.floor(latestArrivalMins / 60);
  const latestM = latestArrivalMins % 60;
  const latestArrivalStr = `${String(latestH).padStart(2, '0')}:${String(latestM).padStart(2, '0')}`;
  const sessionStartStr = isMorningSession ? '07:30' : '12:00';

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      key={app.id}
      className="bg-white text-slate-700 border border-slate-100 hover:border-teal-200/50 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 rounded-[28px]"
    >
      {/* Left border status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b ${gradientStatus}`}></div>

      <div className="p-5 pl-6 space-y-4">
        {/* Card Header Info */}
        <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2.5">
          <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">
            {app.ma_lich_dat}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
              app.loai_lich === 'kham_moi'
                ? 'bg-blue-50 border-blue-100 text-blue-600'
                : 'bg-purple-50 border-purple-100 text-purple-600'
            }`}>
              {app.loai_lich === 'kham_moi' ? 'Lượng giá' : 'Trị liệu'}
            </span>
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
              isPaid
                ? 'bg-teal-50 border-teal-200 text-teal-700 font-extrabold'
                : 'bg-[#14B8A6]/10 border-[#14B8A6]/20 text-[#0D9488]'
            }`}>
              {isPaid ? 'Đã thanh toán' : 'Đã xác nhận'}
            </span>
          </div>
        </div>

        {/* Title & Session Info */}
        <div className="space-y-3">
          {/* Service Title */}
          <div className="space-y-1.5">
            <h3 className="font-heading font-black text-slate-900 text-sm uppercase tracking-wide leading-snug">
              {app.ten_dich_vu || 'Buổi Lượng Giá Chức Năng Ban Đầu'}
              {isPackageSession && (
                <span className="ml-2 inline-flex items-center normal-case text-[10px] font-black text-[#0d766e] bg-[#0d9488]/10 px-2 py-0.5 rounded border border-[#0d9488]/15 align-middle">
                  Buổi {app.so_thu_tu_buoi} / {app.tong_so_buoi_goi ?? '?'}
                </span>
              )}
            </h3>

            {/* Session badge & Date */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#0D9488]">
              <span className="flex items-center gap-1 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg">
                <Clock size={13} className="text-[#0D9488]" />
                {buoiLabel}
              </span>
              <span className="text-slate-500 font-bold">• {dateStr}</span>
            </div>
          </div>

          {/* Countdown for Confirmed */}
          {isConfirmed && (
            <div className="bg-amber-500/10 text-amber-800 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2 text-[10px] font-black animate-pulse">
              <span className="text-base leading-none">⏳</span>
              <span className="tracking-wide">{getCountdownString(app.ngay_gio_bat_dau, app.buoi)}</span>
            </div>
          )}

          {/* Smart Session Arrival Guidance & Clinic Address Box */}
          {!isCancelled && (
            isPendingReExam ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 p-3.5 rounded-2xl space-y-2 text-slate-700 shadow-2xs">
                <div className="border-b border-amber-200/80 pb-2">
                  <span className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    Chờ Tái Lượng Giá
                  </span>
                </div>
                
                <p className="text-[11px] font-medium leading-relaxed text-slate-700">
                  💡 Chuyên viên đã lượng giá đợt 1 và hướng dẫn Quý khách chụp chiếu ngoài. Khi có kết quả, Quý khách mang phim quay lại quầy lễ tân để tiếp tục lượng giá.
                </p>

                <div className="flex items-start gap-1.5 text-[10px] font-bold text-slate-600 pt-1 border-t border-amber-100">
                  <MapPin size={13} className="shrink-0 text-amber-700 mt-0.5" />
                  <span><strong>Cơ sở OfficeCare:</strong> 123 Nguyễn Văn Cừ, Phường 2, Quận 5, TP. Hồ Chí Minh (Tầng 3)</span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 border border-teal-100 p-3.5 rounded-2xl space-y-2 text-slate-700">
                <div className="flex items-center justify-between gap-2 border-b border-teal-100/80 pb-2">
                  <span className="text-[11px] font-black text-[#0D9488] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Khung Giờ Nhận Khách Đón Tiếp
                  </span>
                  <span className="text-[10px] font-black text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200/70 shadow-2xs">
                    Thời lượng: {durationMins} phút
                  </span>
                </div>
                
                <p className="text-[11px] font-medium leading-relaxed text-slate-700">
                  💡 Quý khách vui lòng có mặt tại trung tâm từ <strong>{sessionStartStr}</strong> đến <strong>trước {latestArrivalStr}</strong> để được hỗ trợ và phục vụ tốt nhất.
                </p>

                <div className="flex items-start gap-1.5 text-[10px] font-bold text-slate-600 pt-1 border-t border-slate-100">
                  <MapPin size={13} className="shrink-0 text-[#0D9488] mt-0.5" />
                  <span><strong>Cơ sở OfficeCare:</strong> 123 Nguyễn Văn Cừ, Phường 2, Quận 5, TP. Hồ Chí Minh (Tầng 3)</span>
                </div>
              </div>
            )
          )}

          {/* Doctor and Location layout */}
          {!isCancelled && (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {app.ten_ky_thuat_vien ? (
                  <>
                    <div className="size-7 rounded-full overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100 flex items-center justify-center">
                      {docAvatar ? (
                        <img src={docAvatar} alt={app.ten_ky_thuat_vien} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-black text-slate-600">{getInitials(app.ten_ky_thuat_vien)}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">
                        {app.loai_lich === 'kham_moi' || app.loai_goi === 'KHAM' ? 'Chuyên viên phụ trách' : 'Kỹ thuật viên phụ trách'}
                      </span>
                      <span className="text-[11px] font-black text-slate-800 block mt-0.5">{app.ten_ky_thuat_vien}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="size-7 rounded-full border-2 border-dashed border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center">
                      <User size={12} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">
                        {app.loai_lich === 'kham_moi' || app.loai_goi === 'KHAM' ? 'Chuyên viên phụ trách' : 'Kỹ thuật viên phụ trách'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 block mt-0.5 italic">Đang phân công</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Building2 size={12} className="text-slate-400" />
                </div>
                <div>
                  <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Phòng ban</span>
                  <span className={`text-[11px] font-black block mt-0.5 ${app.ten_phong ? 'text-slate-800' : 'text-amber-600 italic font-bold'}`}>
                    {app.ten_phong || 'Đang xếp phòng'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Stepper */}
        {!isCancelled && (
          <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/80 mt-1">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-4 right-4 top-2 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              <div
                className="absolute left-4 top-2 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                style={{
                  width: isCompleted ? '100%' : isCheckedIn || isPendingReExam ? '50%' : '0%'
                }}
              />

              <div className="flex flex-col items-center z-10">
                <div className="size-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>
                <span className="text-[9px] font-black text-slate-800 mt-1 uppercase tracking-wide">Đăng ký &amp; Xác nhận</span>
              </div>

              <div className="flex flex-col items-center z-10">
                <div className={`size-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-all ${
                  isPendingReExam ? 'bg-amber-500 ring-2 ring-amber-200' : isCheckedIn || isCompleted ? 'bg-emerald-500' : 'bg-slate-250'
                }`}>
                  {(isCheckedIn || isCompleted || isPendingReExam) && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </div>
                <span className={`text-[9px] font-black mt-1 uppercase tracking-wide ${
                  isPendingReExam ? 'text-amber-700 font-bold' : isCheckedIn || isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {isPendingReExam ? 'Chờ tái lượng giá' : 'Check-in & Thực hiện'}
                </span>
              </div>

              <div className="flex flex-col items-center z-10">
                <div className={`size-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-250'
                }`}>
                  {isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </div>
                <span className={`text-[9px] font-black mt-1 uppercase tracking-wide ${
                  isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>Hoàn thành</span>
              </div>
            </div>
          </div>
        )}

        {/* Canceled reasons */}
        {isCancelled && (
          <div className="bg-rose-50/20 border border-rose-100/60 p-3 rounded-xl text-[11px] font-semibold leading-relaxed">
            <p className="font-black text-rose-600 flex items-center gap-1 uppercase text-[9px] tracking-wider">
              <XCircle size={12} />
              {app.trang_thai.includes('huy') ? 'Đã Hủy Lịch Hẹn' : 'Vắng Mặt (No-Show)'}
            </p>
            <p className="text-slate-400 mt-1 italic font-medium text-[10px]">
              "Lý do: {app.ghi_chu_noi_bo || 'Không có lý do chi tiết'}"
            </p>
          </div>
        )}

        {/* Clinic Advice */}
        {!isCancelled && app.ghi_chu_noi_bo && (
          <div className="bg-amber-50/25 border border-amber-100/60 p-3 rounded-xl text-[11px] leading-relaxed">
            <p className="font-black text-amber-800 uppercase text-[9px] tracking-wider">📌 Dặn dò y khoa:</p>
            <p className="mt-0.5 text-slate-500 italic font-medium">"{app.ghi_chu_noi_bo}"</p>
          </div>
        )}

        {/* Hotline Notice Box */}
        {showWarningNotice && (
          <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl text-[11px] text-amber-900 leading-relaxed font-medium space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
              <span>⚠️</span>
              <span>
                {isPaid
                  ? (isPastDate
                      ? 'Buổi hẹn đã quá ngày tiếp đón'
                      : 'Đã sát khung giờ tiếp đón')
                  : 'Đã hết thời hạn tự thao tác online'}
              </span>
            </div>
            <p className="text-[10.5px] text-amber-800 leading-relaxed">
              Quý khách vui lòng liên hệ Hotline: <strong className="text-amber-950 font-bold">1900 6868</strong> hoặc{' '}
              <a
                href="https://www.facebook.com/profile.php?id=61591064963268"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 font-extrabold underline underline-offset-2 hover:text-teal-800"
              >
                Chat với trung tâm
              </a>{' '}
              để được nhân viên hỗ trợ.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 px-5 bg-slate-50/60 border-t border-slate-100 flex flex-wrap sm:flex-nowrap gap-2 rounded-b-[28px]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewTimeline(app)}
          className="flex-1 bg-white hover:bg-teal-50 text-teal-700 hover:text-teal-800 border border-teal-200/80 hover:border-teal-300 font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Clock size={13} className="text-teal-600" />
          Lịch sử trạng thái
        </motion.button>

        {isCompleted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewTreatmentDetail(app)}
            className="flex-1 bg-[#0F172A] hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText size={13} />
            Chi tiết buổi
          </motion.button>
        )}

        {/* NÚT TỰ ĐỔI LỊCH CHO LỊCH ĐÃ THANH TOÁN */}
        {canSelfReschedule && (
          <motion.button
            whileHover={{ scale: isPast50PercentCutoff ? 1 : 1.02 }}
            whileTap={{ scale: isPast50PercentCutoff ? 1 : 0.98 }}
            disabled={isPast50PercentCutoff}
            onClick={() => onOpenReschedule(app)}
            className={`w-full sm:w-auto font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isPast50PercentCutoff
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 cursor-pointer shadow-2xs'
            }`}
            title={isPast50PercentCutoff ? 'Đã quá 50% thời lượng buổi hôm nay (sau 09h45/15h45). Vui lòng gọi hotline 1900 6868.' : 'Tự đổi ngày/buổi mới'}
          >
            <RefreshCw size={12} className={isPast50PercentCutoff ? '' : 'text-teal-600'} />
            <span>
              {isPast50PercentCutoff
                ? 'Khóa sát giờ'
                : isTodayAppt
                ? `Đổi lịch (${rescheduleCountdownLabel})`
                : `Đổi lịch (trước ${isMorningAppt ? '09:45' : '15:45'})`}
            </span>
          </motion.button>
        )}

        {/* NÚT HỦY LỊCH CHO LỊCH CHƯA THANH TOÁN */}
        {app.trang_thai === 'da_xac_nhan' && canSelfCancel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenCancel(app.id)}
            className="w-full sm:w-auto bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            title="Tự hủy online trong vòng 60 phút kể từ lúc đăng ký"
          >
            <XCircle size={12} className="text-rose-500" />
            <span>Hủy lịch ({cancelCountdownLabel})</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
});
