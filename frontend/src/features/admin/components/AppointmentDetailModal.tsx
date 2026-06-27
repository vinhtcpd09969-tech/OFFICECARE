import { useEffect, useState } from 'react';
import { X, Activity, AlertCircle, Phone, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import axiosInstance from '../../../api/axios';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

interface AppointmentDetailModalProps {
  selectedAppointment: any;
  roomsList: any[];
  staffList: any[];
  activeRole: string;
  assignRoomId: string;
  setAssignRoomId: (val: string) => void;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  setAssignStatus: (val: string) => void;
  isAssigning: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onOpenTreatment: (type?: 'single' | 'package', recId?: string) => void;
  appointments?: any[];
  onSuccess?: () => void;
  schedulesList?: any[];
  hideBilling?: boolean;
  isReceptionistOverride?: boolean;
}

export default function AppointmentDetailModal({
  selectedAppointment,
  roomsList,
  staffList,
  activeRole,
  assignRoomId,
  setAssignRoomId,
  assignStaffId,
  setAssignStaffId,
  assignStatus,
  setAssignStatus,
  isAssigning,
  onClose,
  onSave,
  onOpenTreatment,
  appointments = [],
  onSuccess,
  schedulesList = [],
  hideBilling = false,
  isReceptionistOverride
}: AppointmentDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isReceptionist = isReceptionistOverride !== undefined ? isReceptionistOverride : (Number(user?.vai_tro_id) === 2);
  const [localGhiChuNoiBo, setLocalGhiChuNoiBo] = useState<string>(selectedAppointment?.ghi_chu_noi_bo || '');
  const isUnconfirmedState = isReceptionist && ['cho_xac_nhan', 'chua_xac_nhan'].includes(selectedAppointment.trang_thai);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    const toastId = toast.loading('Đang gửi lại email xác nhận...');
    try {
      await axiosInstance.post(`/receptionist/appointments/${selectedAppointment.id}/resend-email`);
      toast.success('Đã gửi lại email xác nhận thành công!', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể gửi lại email xác nhận.', { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    setLocalGhiChuNoiBo(selectedAppointment?.ghi_chu_noi_bo || '');
  }, [selectedAppointment]);

  if (!selectedAppointment) return null;

  // Keep-alive heartbeat effect
  useEffect(() => {
    if (
      selectedAppointment &&
      !selectedAppointment.bac_si_id &&
      !selectedAppointment.chuyen_gia_id &&
      ['cho_xac_nhan', 'chua_xac_nhan'].includes(selectedAppointment.trang_thai) &&
      false
    ) {
      const sendKeepAlive = async () => {
        try {
          await axiosInstance.post(`/admin/appointments/${selectedAppointment.id}/keep-alive`);
          console.log('[Keep-Alive] Đã gia hạn giữ chỗ lịch hẹn thêm 5 phút');
          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error('[Keep-Alive] Lỗi khi gia hạn giữ chỗ:', error);
        }
      };

      // Gọi ngay lập tức khi mở modal
      sendKeepAlive();

      // Thiết lập định kỳ mỗi 3 phút
      const interval = setInterval(sendKeepAlive, 3 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [selectedAppointment, onSuccess]);

  // Logic kiểm tra trùng lịch (Overlap)
  const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && e1 > s2;
  };

  const appendCallLog = (logText: string) => {
    const vnTimeStr = format(new Date(), 'HH:mm - dd/MM/yyyy');
    const newLog = `[${vnTimeStr}] ${logText}\n`;
    setLocalGhiChuNoiBo(prev => prev + newLog);
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;

  // Tìm các ca hẹn/ca điều trị bị trùng khung giờ
  const overlappingApts = appointments.filter(apt => 
    apt.id !== selectedAppointment.id && 
    apt.trang_thai !== 'da_huy' &&
    apt.trang_thai !== 'khong_den' &&
    isOverlapping(currentStart, currentEnd, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
  );

  const occupiedStaffIds = overlappingApts.map(apt => apt.bac_si_id || apt.chuyen_gia_id).filter(Boolean);
  const occupiedRoomIds = overlappingApts.map(apt => String(apt.phong_id)).filter(Boolean);

  // Phân tích ca trực của nhân viên ngày hôm nay
  const aptDate = new Date(selectedAppointment.ngay_gio_bat_dau);
  const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
  
  const getLocalTimeStr = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const aptStartHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_bat_dau); // HH:mm
  const aptEndHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_ket_thuc); // HH:mm

  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '' };
    }

    // Lọc lịch trực của nhân viên trong ngày hẹn
    const staffSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(staff.id) && 
      s.ngay === aptDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay' };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày' };
    }

    const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

    // Kiểm tra xem giờ hẹn có nằm trọn trong giờ trực ca của nhân viên không
    const isCovered = dutyStart <= aptStartHourStr && dutyEnd >= aptEndHourStr;
    if (!isCovered) {
      return { hasDuty: false, label: `Trực ca ${dutyStart}-${dutyEnd}` };
    }



    return { hasDuty: true, label: `Trực ca ${dutyStart}-${dutyEnd}` };
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return 'NV';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bắt buộc phải chọn phòng và nhân sự mới được lưu cập nhật (trừ các trạng thái chưa hoàn thiện gán phòng/bác sĩ)
    if (!['da_huy', 'khong_den', 'chua_xac_nhan', 'cho_xac_nhan', 'cho_huy'].includes(assignStatus)) {
      if (!assignRoomId) {
        toast.error('Vui lòng chọn phòng thực hiện!');
        return;
      }
      if (!assignStaffId) {
        toast.error(
          activeRole === 'Bác sĩ' 
            ? 'Vui lòng chọn Bác sĩ phụ trách!' 
            : 'Vui lòng chọn Kỹ thuật viên phụ trách!'
        );
        return;
      }
    }
    
    onSave(e);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-zinc-800 transition-colors duration-300">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors duration-300">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-150">
              Hồ sơ Lịch hẹn <span className="text-emerald-600 dark:text-emerald-450">#{selectedAppointment.ma_lich_dat}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mt-1">Thông tin chi tiết và điều phối phòng khám</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-thin">
          {/* Thông tin nhanh khách hàng */}
          <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Khách hàng</label>
              <span className="text-sm font-black text-slate-800 dark:text-zinc-150 block mt-0.5">{selectedAppointment.ten_khach_hang}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Số điện thoại</label>
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-150 block mt-0.5">{selectedAppointment.so_dien_thoai}</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Khung giờ hẹn</label>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 block mt-0.5 font-mono bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-lg w-fit">
                {aptStartHourStr} - {aptEndHourStr}
              </span>
              {(() => {
                const dateObj = new Date(selectedAppointment.ngay_gio_bat_dau);
                if (isValid(dateObj)) {
                  return (
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-mono mt-0.5">
                      {format(dateObj, 'dd/MM/yyyy')}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Hồ sơ điều trị của Lịch trị liệu */}
          {selectedAppointment.loai_lich === 'dieu_tri' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                Hồ sơ Điều trị
              </h4>
              <div className="space-y-2">
                {selectedAppointment.chan_doan && (
                  <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 border-l-4 border-l-blue-500 dark:border-l-blue-600">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-550 uppercase">Chẩn đoán từ Bác sĩ</p>
                    <p className="text-sm text-slate-800 dark:text-zinc-200 mt-1 font-semibold leading-relaxed">{selectedAppointment.chan_doan}</p>
                  </div>
                )}
                {selectedAppointment.chong_chi_dinh && (
                  <div className="bg-rose-50 dark:bg-rose-955/10 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30 border-l-4 border-l-rose-500 dark:border-l-rose-600">
                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-455 uppercase flex items-center gap-1"><AlertCircle size={12} /> Chống chỉ định (CẢNH BÁO)</p>
                    <p className="text-sm text-rose-900 dark:text-rose-200 mt-1 font-bold leading-relaxed">{selectedAppointment.chong_chi_dinh}</p>
                  </div>
                )}
                {!selectedAppointment.chan_doan && !selectedAppointment.chong_chi_dinh && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 italic">Không có hồ sơ điều trị đi kèm.</p>
                )}
              </div>
            </div>
          )}

          {/* Triệu chứng khách hàng điền khi đặt lịch */}
          <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 space-y-2">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              📝 Triệu chứng khách hàng điền
            </h4>
            <div className="grid grid-cols-1 gap-2.5 text-sm">
              <p className="text-slate-850 bg-white p-3 rounded-lg border border-slate-200/60 text-xs font-semibold italic text-slate-700">
                "{selectedAppointment.ly_do_kham || 'Không mô tả triệu chứng'}"
              </p>
            </div>
          </div>


          {/* Cảnh báo yêu cầu hủy */}
          {selectedAppointment.trang_thai === 'cho_huy' && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 border-l-4 border-l-rose-600 space-y-2 animate-in fade-in">
              <p className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                <AlertCircle size={16} className="text-rose-600 animate-bounce" /> Khách hàng yêu cầu hủy lịch này
              </p>
              <p className="text-sm text-slate-800 font-semibold">
                Lý do khách đưa ra: <span className="font-normal italic text-slate-600">"{selectedAppointment.ly_do_huy || 'Không có lý do chi tiết'}"</span>
              </p>
              <div className="text-xs text-rose-700 font-medium leading-relaxed bg-white/60 p-2.5 rounded border border-rose-100">
                ⚠️ <strong>Quy trình xử lý của Lễ tân:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Gọi điện thoại đến số <strong>{selectedAppointment.so_dien_thoai}</strong> để xác minh lý do hủy.</li>
                  <li>Nếu đồng ý hủy lịch, chọn trạng thái <strong>Đã hủy</strong> bên dưới và bấm <strong>Lưu cập nhật</strong>.</li>
                  <li>Nếu khách muốn giữ lịch hoặc đổi giờ, hỗ trợ khách và cập nhật thông tin tương ứng.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Điều phối phòng & bác sĩ hoặc Giao diện gọi điện */}
          {isUnconfirmedState ? (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-zinc-800/45 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-700/50 pb-3">
                  <h4 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-600 dark:text-emerald-450" />
                    Giao diện cuộc gọi & Xác nhận
                  </h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedAppointment.trang_thai === 'chua_xac_nhan'
                      ? 'bg-amber-100 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border border-amber-200/40 dark:border-amber-900/30'
                      : 'bg-blue-100 dark:bg-blue-955/20 text-blue-700 dark:text-blue-450 border border-blue-200/40 dark:border-blue-900/30'
                  }`}>
                    {selectedAppointment.trang_thai === 'chua_xac_nhan' ? 'Chưa xác nhận' : 'Chờ xác nhận'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-555 uppercase tracking-wider">Số điện thoại liên hệ</p>
                    <a
                      href={`tel:${selectedAppointment.so_dien_thoai}`}
                      className="text-2xl font-black text-slate-800 dark:text-zinc-150 font-mono tracking-wide hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors flex items-center gap-2 group"
                      title="Nhấp để gọi điện"
                    >
                      {selectedAppointment.so_dien_thoai}
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 group-hover:scale-110 transition-transform">
                        <PhoneCall size={14} className="animate-pulse" />
                      </span>
                    </a>
                  </div>

                  <button
                    type="button"
                    disabled={isSendingEmail}
                    onClick={handleResendEmail}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30 text-xs font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isSendingEmail ? (
                      <span className="w-3.5 h-3.5 border-2 border-emerald-700 dark:border-emerald-450 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-sm">✉️</span>
                    )}
                    Gửi lại email xác nhận
                  </button>
                </div>

                <div className="space-y-2 border-t border-slate-200/60 dark:border-zinc-700/50 pt-3">
                  <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-555 uppercase tracking-wider">Ghi nhanh lịch sử gọi điện</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => appendCallLog('Gọi thành công - Khách xác nhận lịch hẹn')}
                      className="text-left px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-955/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all flex items-center gap-2 active:scale-98"
                    >
                      🟢 Đã liên hệ & Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => appendCallLog('Khách bận/Thuê bao - Sẽ gọi lại sau')}
                      className="text-left px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-600 hover:bg-amber-50/20 dark:hover:bg-amber-955/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all flex items-center gap-2 active:scale-98"
                    >
                      🟡 Máy bận/Gọi lại sau
                    </button>
                    <button
                      type="button"
                      onClick={() => appendCallLog('Gọi lần 1: Khách không nhấc máy')}
                      className="text-left px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-rose-500 dark:hover:border-rose-600 hover:bg-rose-50/20 dark:hover:bg-rose-955/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all flex items-center gap-2 active:scale-98"
                    >
                      🔴 Không nhấc máy (Lần 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => appendCallLog('Gọi lần 2: Khách không nhấc máy')}
                      className="text-left px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-rose-500 dark:hover:border-rose-600 hover:bg-rose-50/20 dark:hover:bg-rose-955/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all flex items-center gap-2 active:scale-98"
                    >
                      🔴 Không nhấc máy (Lần 2)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-200/60 dark:border-zinc-700/50 pt-3">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">Ghi chú nội bộ / Nhật ký cuộc gọi</label>
                  <textarea
                    rows={4}
                    value={localGhiChuNoiBo}
                    onChange={(e) => setLocalGhiChuNoiBo(e.target.value)}
                    placeholder="Nhập ghi chú cuộc gọi, lý do đổi lịch hoặc phản hồi của khách hàng tại đây..."
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold font-mono leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                Điều phối lâm sàng
              </h4>

              {/* PHÒNG THỰC HIỆN (Card grid) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Phòng khám lâm sàng</label>
                  {assignRoomId && !isReceptionist && (
                    <button 
                      type="button" 
                      onClick={() => setAssignRoomId('')} 
                      className="text-[10px] text-rose-500 font-extrabold hover:underline"
                    >
                      Hủy chọn phòng
                    </button>
                  )}
                </div>
                {!isReceptionist ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {roomsList
                      .filter(room => {
                        if (selectedAppointment.loai_lich === 'kham_moi') {
                          return room.loai_phong === 'kham_benh';
                        }
                        if (selectedAppointment.loai_lich === 'dieu_tri') {
                          return room.loai_phong === 'tri_lieu' || room.loai_phong === 'phong_tri_lieu_chuan';
                        }
                        return true;
                      })
                      .map(room => {
                        const isOccupied = occupiedRoomIds.includes(String(room.id)) && String(room.id) !== String(selectedAppointment.phong_id);
                        const isSelected = String(assignRoomId) === String(room.id);

                        return (
                          <div
                            key={room.id}
                            onClick={() => !isOccupied && !isReceptionist && setAssignRoomId(String(room.id))}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between select-none ${isOccupied
                                ? 'bg-slate-50 dark:bg-zinc-800/20 border-slate-100 dark:border-zinc-800/50 opacity-50 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-355 ring-2 ring-emerald-500/10'
                                  : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 cursor-pointer'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 leading-tight">{room.ten_phong}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isOccupied ? 'bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455' : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450'
                                }`}>
                                {isOccupied ? 'Bận' : 'Trống'}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-550 mt-2 font-bold">{room.loai_phong || 'Phòng khám'}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-850 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-150 flex items-center justify-between">
                    <span>{selectedAppointment.ten_phong || 'Chưa chỉ định'}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Đã phân phòng</span>
                  </div>
                )}
              </div>

              {/* NHÂN SỰ PHỤ TRÁCH (Card grid) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    {activeRole === 'Bác sĩ' ? 'Bác sĩ phụ trách' : 'Kỹ thuật viên phụ trách'}
                  </label>
                  {assignStaffId && !isReceptionist && (
                    <button 
                      type="button" 
                      onClick={() => setAssignStaffId('')} 
                      className="text-[10px] text-rose-500 font-extrabold hover:underline"
                    >
                      Hủy phân công
                    </button>
                  )}
                </div>
                {!isReceptionist ? (
                  assignStatus === 'chua_xac_nhan' ? (
                    <div className="w-full px-4 py-8 bg-slate-50/50 dark:bg-zinc-800/10 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl text-center select-none">
                      <div className="text-xl mb-1.5">🔒</div>
                      <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Khóa phân bổ Nhân sự</p>
                      <p className="text-[10px] text-slate-450 dark:text-zinc-550 mt-1 max-w-[280px] mx-auto leading-relaxed">
                        Lịch hẹn này chưa được xác nhận. Vui lòng cập nhật trạng thái lịch hẹn hoặc click "Xác nhận khách" để mở khóa phân công.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                      {(() => {
                        const assignedDocId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
                        return staffList
                          .filter(s => s.vai_tro === activeRole)
                          .filter(staff => {
                            const staffId = staff.chuyen_gia_id || staff.id;
                            const isCurrentlyAssigned = assignedDocId && String(staffId) === String(assignedDocId);
                            
                            if (isCurrentlyAssigned) {
                              return true;
                            }
                            
                            const isOccupied = occupiedStaffIds.includes(staffId);
                            const duty = getStaffDutyStatus(staff);
                            return duty.hasDuty && !isOccupied;
                          })
                          .map(staff => {
                            const staffId = staff.chuyen_gia_id || staff.id;
                            const isCurrentlyAssigned = assignedDocId && String(staffId) === String(assignedDocId);
                            const duty = getStaffDutyStatus(staff);
                            const isOccupied = occupiedStaffIds.includes(staffId) && !isCurrentlyAssigned;
                            const isAvailable = duty.hasDuty && !occupiedStaffIds.includes(staffId);
                            const isSelected = String(assignStaffId) === String(staffId);
                            const showWarning = isCurrentlyAssigned && !isAvailable;

                            return (
                              <div
                                key={staff.id}
                                onClick={() => (isAvailable || isCurrentlyAssigned) && !isReceptionist && setAssignStaffId(staffId)}
                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 select-none cursor-pointer ${
                                  showWarning
                                    ? `${isSelected ? 'bg-rose-50/30 dark:bg-rose-955/10' : 'bg-white dark:bg-zinc-900'} border-dashed border-rose-500 dark:border-rose-600 animate-pulse ring-2 ring-rose-500/15`
                                    : !isAvailable
                                      ? 'bg-slate-50 dark:bg-zinc-800/20 border-slate-100 dark:border-zinc-800/50 opacity-50 cursor-not-allowed'
                                      : isSelected
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-355 ring-2 ring-emerald-500/10'
                                        : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border ${isSelected
                                    ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-450 border-slate-200 dark:border-zinc-750'
                                  }`}>
                                  {getAvatarInitials(staff.ho_ten)}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">{staff.ho_ten}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {showWarning ? (
                                      <span className="bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                        ⚠️ Đang bận / Sai ca trực - Đã gán
                                      </span>
                                    ) : (
                                      <>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isOccupied
                                            ? 'bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455'
                                            : !duty.hasDuty
                                              ? 'bg-slate-200 dark:bg-zinc-800 text-slate-650 dark:text-zinc-450'
                                              : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450'
                                          }`}>
                                          {isOccupied
                                            ? 'Trùng lịch'
                                            : !duty.hasDuty
                                              ? (['Đang nghỉ trưa', 'Đang nghỉ tối', 'Nghỉ phép cả ngày'].includes(duty.label) ? duty.label : 'Không trực')
                                              : 'Sẵn sàng'}
                                        </span>
                                        {duty.label && duty.hasDuty && (
                                          <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold truncate">
                                            {duty.label.replace('Trực ca ', '')}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  )
                ) : (
                  <div className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-855 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-150 flex items-center justify-between">
                    <span>
                      {selectedAppointment.ten_ky_thuat_vien
                        ? (activeRole === 'Bác sĩ'
                          ? `BS. ${selectedAppointment.ten_ky_thuat_vien}`
                          : `KTV. ${selectedAppointment.ten_ky_thuat_vien}`)
                        : 'Chưa chỉ định'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-extrabold">Đã phân công</span>
                  </div>
                )}
              </div>

              {/* TRẠNG THÁI CA TRỰC (Dropdown chuẩn) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Trạng thái ca trực</label>
                <select
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl text-sm text-slate-800 dark:text-zinc-150 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold disabled:bg-slate-100 dark:disabled:bg-zinc-800 disabled:text-slate-500"
                  value={assignStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignStatus(val);
                    if (val === 'chua_xac_nhan') {
                      setAssignStaffId('');
                      setAssignRoomId('');
                    }
                  }}
                  disabled={isReceptionist}
                >
                  <option value="chua_xac_nhan">Chưa xác nhận</option>
                  <option value="cho_xac_nhan">Chờ xác nhận</option>
                  <option value="da_xac_nhan">Đã xác nhận</option>
                  <option value="da_checkin">Đã Check-in</option>
                  <option value="hoan_thanh">Hoàn thành</option>
                  <option value="cho_huy">Chờ hủy (Khách yêu cầu)</option>
                  <option value="da_huy">Đã hủy</option>
                  <option value="khong_den">Không đến</option>
                </select>
              </div>
            </div>
          )}

          {/* Các nút hành động đặc biệt ở chân trang */}
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            {selectedAppointment.loai_lich === 'kham_moi' && selectedAppointment.trang_thai === 'hoan_thanh' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTreatment('single')}
                  className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 text-xs font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/30 flex items-center gap-2 transition-all border border-emerald-200 dark:border-emerald-800/30"
                >
                  <Activity size={14} /> Đặt Lịch Tiếp
                </button>
                {(selectedAppointment.khuyen_nghi_dich_vu_id || selectedAppointment.khuyen_nghi_goi_id) && (
                  <button
                    type="button"
                    onClick={() => onOpenTreatment(selectedAppointment.khuyen_nghi_dich_vu_id ? 'single' : 'package', selectedAppointment.khuyen_nghi_dich_vu_id || selectedAppointment.khuyen_nghi_goi_id)}
                    className="px-4 py-2.5 bg-teal-600 dark:bg-teal-700 text-white shadow-sm text-xs font-bold rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 flex items-center gap-2 transition-all animate-pulse"
                  >
                    🚀 Theo Khuyến nghị
                  </button>
                )}
              </div>
            ) : !hideBilling && selectedAppointment.loai_lich === 'dieu_tri' && Number(selectedAppointment.so_thu_tu_buoi) === 1 && selectedAppointment.trang_thai === 'hoan_thanh' ? (
              <button
                type="button"
                onClick={() => {
                  const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                  navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                  onClose();
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all animate-pulse"
              >
                💵 Thanh toán Gói trị liệu
              </button>
            ) : selectedAppointment.loai_lich === 'dieu_tri' && selectedAppointment.trang_thai === 'da_xac_nhan' && isReceptionist ? (
              <button
                type="button"
                disabled={isAssigning}
                onClick={async () => {
                  if (!assignRoomId) {
                    toast.error('Vui lòng chọn phòng thực hiện!');
                    return;
                  }
                  if (!assignStaffId) {
                    toast.error('Vui lòng chọn kỹ thuật viên phụ trách!');
                    return;
                  }

                  const toastId = toast.loading('Đang xác thực lịch trực và gửi thông báo...');
                  try {
                     await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
                       trang_thai: 'da_checkin',
                       bac_si_id: assignStaffId || null,
                       chuyen_gia_id: assignStaffId || null,
                       phong_id: assignRoomId || null
                     });
                     toast.success('Xác thực lịch và gửi thông báo thành công!', { id: toastId });
                     onClose();
                     if (onSuccess) onSuccess();
                  } catch (error: any) {
                     console.error(error);
                     toast.error(error.response?.data?.message || 'Lỗi xác thực lịch trực', { id: toastId });
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all animate-pulse"
              >
                💵 Xác thực & Gửi thông báo
              </button>
            ) : isUnconfirmedState ? (
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  disabled={isAssigning}
                  onClick={async () => {
                    const toastId = toast.loading('Đang cập nhật trạng thái...');
                    try {
                      const url = isReceptionist ? `/receptionist/appointments/${selectedAppointment.id}/status` : `/admin/appointments/${selectedAppointment.id}/status`;
                      await axiosInstance.patch(url, {
                        trang_thai: 'cho_xac_nhan',
                        ghi_chu_noi_bo: localGhiChuNoiBo
                      });
                      toast.success('Đã xác nhận liên hệ và chuyển tiếp cho Quản lý!', { id: toastId });
                      onClose();
                      if (onSuccess) onSuccess();
                    } catch (error: any) {
                      console.error(error);
                      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái', { id: toastId });
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
                >
                  📞 Xác nhận & Chuyển Quản lý
                </button>
                <button
                  type="button"
                  disabled={isAssigning}
                  onClick={async () => {
                    const toastId = toast.loading('Đang lưu ghi chú cuộc gọi...');
                    try {
                      const url = isReceptionist ? `/receptionist/appointments/${selectedAppointment.id}/status` : `/admin/appointments/${selectedAppointment.id}/status`;
                      await axiosInstance.patch(url, {
                        trang_thai: selectedAppointment.trang_thai,
                        ghi_chu_noi_bo: localGhiChuNoiBo
                      });
                      toast.success('Đã lưu ghi chú cuộc gọi thành công!', { id: toastId });
                      if (onSuccess) onSuccess();
                    } catch (error: any) {
                      console.error(error);
                      toast.error(error.response?.data?.message || 'Lỗi khi lưu ghi chú cuộc gọi', { id: toastId });
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-500 hover:bg-slate-650 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
                >
                  💾 Lưu ghi chú cuộc gọi
                </button>
                <button
                  type="button"
                  disabled={isAssigning}
                  onClick={async () => {
                    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?');
                    if (!confirmCancel) return;
                    const toastId = toast.loading('Đang hủy lịch...');
                    try {
                      const url = isReceptionist ? `/receptionist/appointments/${selectedAppointment.id}/status` : `/admin/appointments/${selectedAppointment.id}/status`;
                      await axiosInstance.patch(url, {
                        trang_thai: 'da_huy',
                        ghi_chu_noi_bo: localGhiChuNoiBo
                      });
                      toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
                      onClose();
                      if (onSuccess) onSuccess();
                    } catch (error: any) {
                      console.error(error);
                      toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch hẹn', { id: toastId });
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-750 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 text-center justify-center flex-1 sm:flex-none"
                >
                  ❌ Hủy lịch
                </button>
              </div>
            ) : <div></div>}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all"
              >
                Đóng
              </button>
              {!isReceptionist && (
                <>
                  {selectedAppointment.trang_thai === 'da_xac_nhan' && (
                    <button
                      type="submit"
                      onClick={() => setAssignStatus('da_checkin')}
                      disabled={isAssigning}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      🛎️ Check-in Khách
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isAssigning || selectedAppointment.trang_thai === 'hoan_thanh'}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
