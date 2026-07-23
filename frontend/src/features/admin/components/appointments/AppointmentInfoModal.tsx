import React from 'react';
import { X, User, Activity, Clock, Calendar, FileText, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { statusConfig } from '../../../../components/appointmentStatusConfig';
import { format, isValid } from 'date-fns';

interface AppointmentInfoModalProps {
  appointment: any | null;
  onClose: () => void;
}

export default function AppointmentInfoModal({ appointment, onClose }: AppointmentInfoModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  if (!appointment) return null;

  const aptId = appointment.id || appointment.cuoc_hen_id || appointment.lich_dat_id;
  const maLichDat = appointment.ma_lich_dat || 'LH-000';
  const tenKhachHang = appointment.ten_khach_hang || appointment.ho_ten_khach || 'Khách hàng';
  const soDienThoai = appointment.so_dien_thoai || appointment.sdt_khach_hang || '';
  const tenDichVu = appointment.ten_dich_vu || appointment.dich_vu || 'Khám lâm sàng & Lượng giá';

  // Format time and date
  let startTimeStr = '--:--';
  let endTimeStr = '--:--';
  let dateStr = '--/--/----';
  let durationMinutes = 30;

  if (appointment.ngay_gio_bat_dau) {
    const startDate = new Date(appointment.ngay_gio_bat_dau);
    if (isValid(startDate)) {
      startTimeStr = format(startDate, 'HH:mm');
      dateStr = format(startDate, 'dd/MM/yyyy');
    }
  }

  if (appointment.ngay_gio_ket_thuc) {
    const endDate = new Date(appointment.ngay_gio_ket_thuc);
    if (isValid(endDate)) {
      endTimeStr = format(endDate, 'HH:mm');
    }
  }

  if (appointment.ngay_gio_bat_dau && appointment.ngay_gio_ket_thuc) {
    const startMs = new Date(appointment.ngay_gio_bat_dau).getTime();
    const endMs = new Date(appointment.ngay_gio_ket_thuc).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      durationMinutes = Math.round((endMs - startMs) / 60000);
    }
  }

  const rawStatus = appointment.trang_thai || 'cho_xac_nhan';
  const statusInfo = statusConfig[rawStatus] || {
    label: rawStatus,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null
  };

  // Ca đã kết thúc (hoàn thành/hủy/không đến) — không còn gì để "làm" nữa, đưa về đúng nơi xem lại
  // hồ sơ (Hồ sơ điều trị) thay vì Bàn làm việc (trang dành cho khám/trị liệu đang diễn ra, có nút
  // "Hoàn thành" — mở nhầm vào đây với 1 ca đã xong sẽ cho phép hoàn thành lại, ghi đè dữ liệu cũ).
  const isTerminalStatus = ['hoan_thanh', 'da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(rawStatus);

  const handleGoToDetail = () => {
    onClose();
    if (!aptId) return;

    const isKtv = Number(user?.vai_tro_id) === 3 || location.pathname.startsWith('/technician');

    if (isTerminalStatus) {
      const recordsPath = isKtv ? '/technician/medical-records' : '/doctor/medical-records';
      if (!appointment.khach_hang_id) {
        // Dữ liệu cũ chưa có khach_hang_id (trước bản vá) — vẫn đưa đúng trang, chỉ là không tự
        // chọn sẵn bệnh nhân/mở popup được.
        navigate(recordsPath);
        return;
      }
      const params = new URLSearchParams({ patientId: appointment.khach_hang_id });
      // Bác sĩ: mỗi lịch hẹn trong danh sách này luôn là buổi khám lâm sàng độc lập (loai='KHAM'),
      // ánh xạ thẳng 1-1 với 1 mục trong "visits". KTV: mỗi lịch hẹn luôn là 1 buổi trong phác đồ
      // (loai='DIEU_TRI'), phải mở đúng cả phác đồ (PlanDetailModal) qua phac_do_dieu_tri_id.
      if (isKtv) {
        if (appointment.phac_do_dieu_tri_id) {
          params.set('type', 'plan');
          params.set('itemId', appointment.phac_do_dieu_tri_id);
        }
      } else {
        params.set('type', 'visit');
        params.set('itemId', aptId);
      }
      navigate(`${recordsPath}?${params.toString()}`);
      return;
    }

    const targetPath = isKtv
      ? `/technician/appointments/${aptId}/assess`
      : `/doctor/appointments/${aptId}/assess`;

    navigate(targetPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg md:max-w-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-150">
              Hồ sơ Lịch hẹn <span className="text-emerald-600 dark:text-emerald-450 font-mono font-bold">#{maLichDat}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
              Thông tin chi tiết và điều phối phòng khám
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Card 1: Khách hàng & Ca khám */}
          <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-3.5 select-none shadow-sm">
            {/* Row 1: Khách hàng */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
                <User size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  KHÁCH HÀNG
                </label>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm font-black text-slate-800 dark:text-zinc-100">{tenKhachHang}</span>
                  {soDienThoai && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800 font-mono">
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
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  CHI TIẾT DỊCH VỤ
                </label>
                <div className="text-xs font-bold text-slate-700 dark:text-zinc-200 mt-0.5 flex items-center flex-wrap gap-2">
                  <span>{tenDichVu}</span>
                  {appointment.so_thu_tu_buoi && (
                    <span className="inline-flex items-center text-[10px] font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/30 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-900/30">
                      Buổi {appointment.so_thu_tu_buoi} {appointment.tong_so_buoi_goi ? `/ ${appointment.tong_so_buoi_goi}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Khung giờ hẹn */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5">
                <Clock size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  KHUNG GIỜ HẸN
                </label>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    {startTimeStr} - {endTimeStr}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">({durationMinutes} phút)</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-zinc-400 font-mono font-bold bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                    <Calendar size={10} />
                    {dateStr}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Trạng thái lịch hẹn */}
          <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-2 select-none shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
              TRẠNG THÁI LỊCH HẸN
            </label>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>

          {/* Card 3: Ghi chú nội bộ phòng khám */}
          <div className="bg-slate-50/70 dark:bg-zinc-800/30 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-2 select-none shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
              GHI CHÚ NỘI BỘ PHÒNG KHÁM
            </label>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 whitespace-pre-wrap min-h-[50px]">
              {appointment.ghi_chu_noi_bo || appointment.ly_do_huy || appointment.ly_do_kham || appointment.ghi_chu || 'Không có ghi chú nội bộ.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold rounded-xl transition-all text-xs"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleGoToDetail}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <FileText size={14} />
              <span>Xem chi tiết</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
