import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  CalendarCheck, 
  CheckCircle2, 
  UserCheck, 
  Stethoscope, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Building2,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
}

export const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  if (!isOpen || !appointment) return null;

  const formatDateStr = (dateVal: any) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return format(d, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch {
      return null;
    }
  };

  const timelineEvents: Array<{
    key: string;
    title: string;
    timestamp: string | null;
    status: 'completed' | 'failed';
    // Chỉ điền khi biết CHẮC ai/kênh nào thực hiện (dữ liệu có sẵn, không suy đoán) — bỏ trống thì
    // ẩn hẳn dòng "Thực hiện" thay vì đoán. Ví dụ: "Xác nhận" có thể do khách tự OTP (đã chọn sẵn
    // nhân sự) hoặc do nhân viên bấm tay — 2 luồng cùng ghi 1 cột trạng thái, không có cách nào biết
    // chắc nguồn gốc nếu không thêm cột theo dõi riêng, nên cố tình không nêu người ở sự kiện này.
    performer?: string;
    description: string;
    icon: any;
    color: string;
  }> = [];

  // 1. Mốc Khởi tạo ca hẹn (Luôn có nếu ca tồn tại)
  const creationTime = formatDateStr(appointment.thoi_gian_tao);
  const creatorName = appointment.ten_nguoi_tao 
    ? `Nhân viên: ${appointment.ten_nguoi_tao}`
    : (appointment.nguoi_tao_id ? 'Quản trị viên / Lễ tân' : (appointment.ten_khach_hang || appointment.ho_ten_khach || 'Khách hàng (Tự đăng ký)'));

  timelineEvents.push({
    key: 'created',
    title: 'Đăng ký khởi tạo ca hẹn',
    timestamp: creationTime,
    status: 'completed',
    performer: creatorName,
    description: appointment.nguoi_tao_id 
      ? 'Ca hẹn được nhân viên phòng khám tạo trực tiếp trên hệ thống.' 
      : 'Hệ thống đã tiếp nhận đăng ký trực tuyến từ Khách hàng.',
    icon: Calendar,
    color: 'bg-emerald-500 text-white'
  });

  // 2. Mốc Xác nhận & Phân bổ (Chỉ hiển thị khi ĐÃ xảy ra) — không nêu "người thực hiện": có thể do
  // khách tự xác thực OTP (đã chọn sẵn nhân sự) hoặc nhân viên bấm tay, không có cột nào lưu vết
  // nguồn gốc nên không đoán, tránh gán nhầm (từng gán sai thành "Quản trị viên / Admin" cho ca khách
  // tự xác nhận).
  if (appointment.thoi_gian_xac_nhan || ['da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh'].includes(appointment.trang_thai)) {
    timelineEvents.push({
      key: 'confirmed',
      title: 'Xác nhận & Phân bổ chuyên gia/phòng',
      timestamp: formatDateStr(appointment.thoi_gian_xac_nhan || appointment.thoi_gian_tao),
      status: 'completed',
      description: appointment.ten_ky_thuat_vien
        ? `Đã phân công chuyên gia: ${appointment.ten_ky_thuat_vien} ${appointment.ten_phong ? `(${appointment.ten_phong})` : ''}`
        : 'Đã xác nhận ca hẹn và xếp lịch làm việc.',
      icon: CalendarCheck,
      color: 'bg-blue-500 text-white'
    });
  }

  // 3. Mốc Check-in tại quầy (Chỉ hiển thị khi ĐÃ xảy ra)
  if (appointment.thoi_gian_checkin || ['da_checkin', 'dang_kham', 'hoan_thanh'].includes(appointment.trang_thai)) {
    timelineEvents.push({
      key: 'checkin',
      title: 'Đón tiếp & Check-in tại quầy',
      timestamp: formatDateStr(appointment.thoi_gian_checkin),
      status: 'completed',
      description: 'Bệnh nhân đã có mặt tại phòng khám và hoàn tất thủ tục check-in.',
      icon: UserCheck,
      color: 'bg-teal-500 text-white'
    });
  }

  // 4. Mốc Bắt đầu ca Khám / Trị liệu (Chỉ hiển thị khi ĐÃ xảy ra)
  if (appointment.thoi_gian_bat_dau || ['dang_kham', 'hoan_thanh'].includes(appointment.trang_thai)) {
    timelineEvents.push({
      key: 'in_progress',
      title: 'Bắt đầu ca Khám / Trị liệu',
      timestamp: formatDateStr(appointment.thoi_gian_bat_dau),
      status: 'completed',
      description: 'Chuyên gia đã tiếp nhận bệnh nhân và bắt đầu tiến trình chuyên môn.',
      icon: Stethoscope,
      color: 'bg-indigo-500 text-white'
    });
  }

  // 5. Mốc Hoàn thành ca (Chỉ hiển thị khi ĐÃ xảy ra)
  if (appointment.thoi_gian_hoan_thanh || appointment.trang_thai === 'hoan_thanh') {
    timelineEvents.push({
      key: 'completed',
      title: 'Hoàn thành ca & Lưu hồ sơ y khoa',
      timestamp: formatDateStr(appointment.thoi_gian_hoan_thanh),
      status: 'completed',
      description: 'Buổi trị liệu đã kết thúc thành công. Đã lưu nhật ký trị liệu và thang đo VAS.',
      icon: CheckCircle2,
      color: 'bg-emerald-600 text-white'
    });
  }

  // 6. Mốc Hủy ca (Chỉ hiển thị khi bị Hủy)
  if (appointment.thoi_gian_huy || ['da_huy', 'da_huy_phat', 'cho_huy'].includes(appointment.trang_thai)) {
    const cancelTime = formatDateStr(appointment.thoi_gian_huy) || formatDateStr(appointment.thoi_gian_tao);
    const cancelReasonText = appointment.ghi_chu_noi_bo || appointment.ly_do_huy || 'Thay đổi lịch làm việc';

    timelineEvents.push({
      key: 'cancelled',
      title: 'Ca hẹn đã bị hủy',
      timestamp: cancelTime,
      status: 'failed',
      description: `Ghi chú / Lý do hủy: ${cancelReasonText}`,
      icon: XCircle,
      color: 'bg-rose-500 text-white'
    });
  }

  // 7. Mốc Không đến / No-show (Chỉ hiển thị khi No-show)
  if (appointment.thoi_gian_khong_den || ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(appointment.trang_thai)) {
    const noshowTime = formatDateStr(appointment.thoi_gian_khong_den) || formatDateStr(appointment.thoi_gian_tao);

    timelineEvents.push({
      key: 'noshow',
      title: 'Bệnh nhân không đến (No-show)',
      timestamp: noshowTime,
      status: 'failed',
      description: 'Nhân viên tiếp nhận ghi nhận bệnh nhân không có mặt theo giờ hẹn đã đăng ký.',
      icon: AlertTriangle,
      color: 'bg-amber-500 text-white'
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 max-w-lg w-full rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Clock size={20} />
                </span>
                <div>
                  <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">
                    Lịch Sử Trạng Thái Ca Hẹn
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Mã ca: {appointment.ma_lich_dat || appointment.id?.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Details Banner */}
          <div className="px-6 py-3 bg-teal-500/5 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User size={14} className="text-teal-600 shrink-0" />
              <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                {appointment.ten_khach_hang || appointment.ho_ten_khach || 'Khách hàng'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-teal-600 shrink-0" />
              <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                {appointment.ten_phong || 'Chưa xếp phòng'}
              </span>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timelineEvents.map((evt) => {
                const IconComp = evt.icon;
                const isFailed = evt.status === 'failed';

                return (
                  <div key={evt.key} className="relative group">
                    {/* Node Dot Icon */}
                    <div className={`absolute -left-6 top-0 size-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm transition-all duration-300 ${evt.color}`}>
                      <IconComp size={12} />
                    </div>

                    {/* Timeline Event Card */}
                    <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isFailed 
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40' 
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-750'
                    }`}>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className={`text-xs font-black uppercase tracking-wider ${
                          isFailed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {evt.title}
                        </h4>
                        {evt.timestamp && (
                          <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/40 px-2 py-0.5 rounded-full shrink-0">
                            {evt.timestamp}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-1">
                        {evt.description}
                      </p>

                      {evt.performer && (
                        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2">
                          <FileText size={11} className="text-slate-400" />
                          <span>Thực hiện: <strong className="text-slate-600 dark:text-slate-300">{evt.performer}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
