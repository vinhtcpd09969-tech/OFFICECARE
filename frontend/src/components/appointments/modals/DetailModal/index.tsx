import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '../../../../stores/authStore';
import {
  updateAppointmentStatus as updateAppointmentStatusAdmin,
  getStaffBudgetForBuoi
} from '../../../../features/admin/api/admin.api';
import {
  updateAppointmentStatus as updateAppointmentStatusRec,
  resendEmail,
  unassignAppointmentStaff
} from '../../../../features/receptionist/api/receptionist.api';
import { StatusHistoryModal } from '../StatusHistoryModal';
import { getReceptionistActionOptions, getReceptionistAllowedTargets, hasAssignedStaff, isReceptionistLockedStatus } from './receptionistStatusRules';

// Import subcomponents
import { DetailHeader } from './DetailHeader';
import { StaffRoomAllocation } from './StaffRoomAllocation';
import { SymptomNotes } from './SymptomNotes';
import { DetailFooter } from './DetailFooter';
import { DetailConfirmationModal } from './DetailConfirmationModal';
import { RescheduleSection, BUOI_INFO } from './RescheduleSection';
import { StatusAndBillingSection } from './StatusAndBillingSection';

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
  cancelReason?: string;
  setCancelReason?: (val: string) => void;
  isAssigning: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent, note?: string) => void;
  appointments?: any[];
  onSuccess?: () => void;
  schedulesList?: any[];
  hideBilling?: boolean;
  isReceptionistOverride?: boolean;
  selectedBuoi: 'sang' | 'chieu' | '';
  setSelectedBuoi: (val: 'sang' | 'chieu' | '') => void;
  rescheduleDate: string;
  setRescheduleDate: (val: string) => void;
}

export default function AppointmentDetailModal({
  selectedAppointment,
  roomsList,
  staffList,
  activeRole: _activeRole,
  assignRoomId,
  setAssignRoomId,
  assignStaffId,
  setAssignStaffId,
  assignStatus,
  setAssignStatus,
  cancelReason: _cancelReason,
  setCancelReason,
  isAssigning,
  onClose,
  onSave,
  appointments = [],
  onSuccess,
  schedulesList = [],
  hideBilling: _hideBilling = false,
  isReceptionistOverride,
  selectedBuoi,
  setSelectedBuoi,
  rescheduleDate,
  setRescheduleDate
}: AppointmentDetailModalProps) {
  const { user } = useAuthStore();
  
  const isReceptionist = isReceptionistOverride !== undefined 
    ? isReceptionistOverride 
    : (Number(user?.vai_tro_id) === 2);
    
  const targetRole = selectedAppointment?.loai_lich === 'kham_moi' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const [localGhiChuNoiBo, setLocalGhiChuNoiBo] = useState<string>(selectedAppointment?.ghi_chu_noi_bo || '');
  const [rescheduleError, setRescheduleError] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsEditingStatus(false);
  }, [selectedAppointment]);

  const handleNoteChange = (val: string) => {
    setLocalGhiChuNoiBo(val);
    if (val.trim()) {
      setRescheduleError('');
    }
  };

  const handleStatusChange = (val: string) => {
    setAssignStatus(val);
    setRescheduleError('');
  };

  const handleUndoStatusChange = () => {
    setAssignStatus(selectedAppointment.trang_thai);
    setRescheduleError('');
  };

  const [showConfirmType, setShowConfirmType] = useState<'save' | 'cancel' | null>(null);
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const resolvedRoom = roomsList.find(r => String(r.id) === String(assignRoomId));
  const resolvedRoomName = resolvedRoom?.ten_phong || selectedAppointment.ten_phong || 'Chưa chỉ định';
  const staffAssigned = hasAssignedStaff(selectedAppointment);
  const isReceptionistLocked = isReceptionist && isReceptionistLockedStatus(selectedAppointment.trang_thai);
  const receptionistActionOptions = getReceptionistActionOptions(selectedAppointment.trang_thai, staffAssigned);

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    const toastId = toast.loading('Đang gửi lại email xác nhận...');
    try {
      await resendEmail(selectedAppointment.id);
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

  const appendCallLog = (logText: string) => {
    const vnTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newLog = `[${vnTimeStr}] ${logText}\n`;
    setLocalGhiChuNoiBo(prev => prev + newLog);
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;
  const durationMs = new Date(currentEnd).getTime() - new Date(currentStart).getTime();

  const checkStaffOnDutyForBuoi = (staffId: string | number, dateStr: string, buoi: 'sang' | 'chieu') => {
    if (!staffId || !schedulesList || schedulesList.length === 0) return true;
    const window = BUOI_INFO[buoi];
    return schedulesList.some(s =>
      String(s.nguoi_dung_id) === String(staffId) &&
      s.ngay === dateStr &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) < window.ketThuc &&
      s.gio_ket_thuc.substring(0, 5) > window.batDau
    );
  };

  const checkStaffBusyForBuoi = (staffId: string | number, dateStr: string, buoi: 'sang' | 'chieu') => {
    if (!staffId) return false;
    return appointments.some(apt => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (apt.trang_thai !== 'dang_kham') return false;
      const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
      if (!assignedId || String(assignedId) !== String(staffId)) return false;
      if (apt.buoi !== buoi) return false;
      const aptD = new Date(apt.ngay_gio_bat_dau);
      const aptDStr = `${aptD.getFullYear()}-${String(aptD.getMonth() + 1).padStart(2, '0')}-${String(aptD.getDate()).padStart(2, '0')}`;
      return aptDStr === dateStr;
    });
  };

  const checkStaffAvailableForBuoi = (staffId: string | number, dateStr: string, buoi: 'sang' | 'chieu' | '') => {
    if (!staffId || !buoi) return true;
    return checkStaffOnDutyForBuoi(staffId, dateStr, buoi) && !checkStaffBusyForBuoi(staffId, dateStr, buoi);
  };

  const getLocalTimeStr = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const aptStartHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_bat_dau);
  const aptEndHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_ket_thuc);

  const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
  const origDateStr = format(origStart, 'yyyy-MM-dd');
  const isRescheduled = !!(selectedBuoi && rescheduleDate && (selectedBuoi !== selectedAppointment.buoi || rescheduleDate !== origDateStr));
  const isStatusChanged = assignStatus !== selectedAppointment.trang_thai;
  const isCancelledOrNoShowStatus = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(assignStatus);
  const origStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id || '';
  const currentStaffId = assignStaffId || '';
  const isStaffChanged = String(currentStaffId) !== String(origStaffId);
  const isNoteRequired = isRescheduled || isStaffChanged || isCancelledOrNoShowStatus || (isReceptionist && isStatusChanged);

  const effectiveBuoi: 'sang' | 'chieu' = (selectedBuoi || selectedAppointment.buoi || 'sang') as 'sang' | 'chieu';
  const newStartHourStr = BUOI_INFO[effectiveBuoi].batDau;
  const newEndHourStr = BUOI_INFO[effectiveBuoi].ketThuc;

  useEffect(() => {
    if (isReceptionist || !selectedBuoi || !assignStaffId) return;
    if (!checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi)) {
      setAssignStaffId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuoi, rescheduleDate]);

  const isReassignAllowed = ['da_xac_nhan', 'da_checkin', 'dang_kham'].includes(selectedAppointment.trang_thai);

  const [staffBudget, setStaffBudget] = useState<Record<string, { conLai: number; soKhachSongSong: number }> | null>(null);
  useEffect(() => {
    if (isReceptionist || !effectiveBuoi || !rescheduleDate) {
      setStaffBudget(null);
      return;
    }
    let cancelled = false;
    getStaffBudgetForBuoi(rescheduleDate, effectiveBuoi, selectedAppointment.loai_lich, selectedAppointment.id)
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, { conLai: number; soKhachSongSong: number }> = {};
        (res.data || []).forEach((s: any) => {
          map[String(s.nhanSuId)] = { conLai: s.conLai, soKhachSongSong: s.soKhachSongSong };
        });
        setStaffBudget(map);
      })
      .catch(() => { if (!cancelled) setStaffBudget(null); });
    return () => { cancelled = true; };
  }, [isReceptionist, effectiveBuoi, rescheduleDate, selectedAppointment.loai_lich, selectedAppointment.id]);

  useEffect(() => {
    if (!assignStaffId) return;

    const staffSchedule = (schedulesList || []).find(s =>
      String(s.nguoi_dung_id) === String(assignStaffId) &&
      s.ngay === rescheduleDate &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) < newEndHourStr &&
      s.gio_ket_thuc.substring(0, 5) > newStartHourStr
    );

    if (staffSchedule && staffSchedule.phong_id) {
      setAssignRoomId(String(staffSchedule.phong_id));
    }
  }, [assignStaffId, schedulesList, rescheduleDate, newStartHourStr, newEndHourStr, setAssignRoomId]);

  const currentStaff = staffList.find(s => String(s.id) === String(assignStaffId));
  const currentStaffName = currentStaff ? currentStaff.ho_ten : 'nhân sự';

  const isCurrentStaffUnavailableAtNewSlot = !!(selectedBuoi && assignStaffId && !checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi));
  const isStaffUnavailable = !!(selectedBuoi && assignStaffId) && !checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi);

  const now = new Date();
  const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = rescheduleDate === todayLocalStr;

  const isBuoiAllowed = (buoi: 'sang' | 'chieu') => {
    const isOrigBuoiDate = buoi === selectedAppointment.buoi && rescheduleDate === origDateStr;
    if (isOrigBuoiDate) return true;
    if (!isToday) return true;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
    return nowMinutes < h * 60 + m;
  };

  const getBuoiStaffCount = (buoi: 'sang' | 'chieu', dateStr: string) => {
    let staffToFilter = targetRole === 'Bác sĩ'
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    const assignedStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
    if (isReceptionist && assignedStaffId) {
      staffToFilter = staffToFilter.filter(s => String(s.id) === String(assignedStaffId));
    }

    return staffToFilter.filter(doc => checkStaffAvailableForBuoi(doc.id, dateStr, buoi)).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReceptionist && isReceptionistLocked) {
      toast.error('Không thể thay đổi trạng thái của ca hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc!');
      return;
    }
    if (isReceptionist && isStatusChanged) {
      const allowedTargets = getReceptionistAllowedTargets(selectedAppointment.trang_thai, staffAssigned);
      if (!allowedTargets.includes(assignStatus)) {
        toast.error('Lễ tân không có quyền chuyển lịch hẹn sang trạng thái này!');
        return;
      }
    }
    
    if (isNoteRequired) {
      const currentNote = localGhiChuNoiBo.trim();
      const dbNote = (selectedAppointment.ghi_chu_noi_bo || '').trim();

      const triggerValidationError = (msg: string) => {
        setRescheduleError(msg);
        setTimeout(() => {
          noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          noteTextareaRef.current?.focus();
        }, 50);
      };

      if (!currentNote) {
        triggerValidationError('Vui lòng nhập ghi chú nội bộ mới cho hành động này!');
        return;
      }
      if (dbNote && currentNote === dbNote) {
        triggerValidationError('Vui lòng nhập ghi chú mới (không được trùng với nội dung ghi chú cũ)!');
        return;
      }
    }
    
    if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
      setAssignStaffId('');
      setAssignStatus('da_xac_nhan');
    }

    const currentStaffIdToCheck = isCurrentStaffUnavailableAtNewSlot && isReceptionist ? '' : assignStaffId;

    if (!['da_huy', 'khong_den', 'cho_huy'].includes(assignStatus)) {
      if (!assignRoomId) {
        toast.error('Vui lòng chọn phòng thực hiện!');
        return;
      }
      if (!currentStaffIdToCheck && ['dang_kham', 'hoan_thanh'].includes(assignStatus)) {
        toast.error(
          targetRole === 'Bác sĩ' 
            ? 'Vui lòng chọn Bác sĩ phụ trách!' 
            : 'Vui lòng chọn Kỹ thuật viên phụ trách!'
        );
        return;
      }
    }

    if (isStaffUnavailable && isReceptionist && !isCurrentStaffUnavailableAtNewSlot) {
      toast.error(`Khung giờ này nhân sự ${currentStaffName} không đáp ứng được. Vui lòng chọn nhân sự khác hoặc đổi giờ!`);
      return;
    }

    if (assignStatus === 'da_huy' && (!localGhiChuNoiBo || !localGhiChuNoiBo.trim())) {
      setShowConfirmType('cancel');
    } else {
      setShowConfirmType('save');
    }
  };

  const handleConfirmAction = async () => {
    if (showConfirmType === 'cancel') {
      const trimmedReason = customCancelReason.trim();
      if (!trimmedReason) {
        toast.error('Vui lòng nhập lý do hủy lịch!');
        return;
      }
      setShowConfirmType(null);
      setCustomCancelReason('');

      if (isReceptionist) {
        const toastId = toast.loading('Đang hủy lịch...');
        try {
          const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
          await updateFn(selectedAppointment.id, {
            trang_thai: 'da_huy',
            ghi_chu_noi_bo: localGhiChuNoiBo || trimmedReason || null
          });
          toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
          onClose();
          if (onSuccess) onSuccess();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || 'Lỗi khi hủy lịch hẹn', { id: toastId });
        }
      } else {
        if (setCancelReason) {
          setCancelReason(trimmedReason);
        }
        setTimeout(() => {
          onSave({ preventDefault: () => {} } as React.FormEvent, localGhiChuNoiBo);
        }, 0);
      }
    } else if (showConfirmType === 'save') {
      setShowConfirmType(null);
      
      if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
        setAssignStaffId('');
        setAssignStatus('da_xac_nhan');
      }

      setTimeout(() => {
        onSave({ preventDefault: () => {} } as React.FormEvent, localGhiChuNoiBo);
      }, 50);
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const maxDateStr = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className={`bg-white dark:bg-zinc-900 rounded-[32px] w-full flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden border border-slate-100 dark:border-zinc-800 transition-all duration-300 max-h-[90vh] relative ${isRescheduling ? 'max-w-5xl' : 'max-w-2xl'}`}
      >
        {/* Custom Confirmation Dialog Overlay */}
        <DetailConfirmationModal
          showConfirmType={showConfirmType}
          setShowConfirmType={setShowConfirmType}
          customCancelReason={customCancelReason}
          setCustomCancelReason={setCustomCancelReason}
          assignStatus={assignStatus}
          isStatusChanged={isStatusChanged}
          isRescheduled={isRescheduled}
          onConfirm={handleConfirmAction}
        />

        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors duration-300 shrink-0 select-none">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-150">
              Hồ sơ Lịch hẹn <span className="text-emerald-600 dark:text-emerald-450">#{selectedAppointment.ma_lich_dat}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-555 font-semibold mt-1">Thông tin chi tiết và điều phối phòng khám</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 md:grid md:grid-cols-12 md:gap-6 space-y-6 md:space-y-0 scrollbar-thin">
            
            {/* Left Column - Dossier & Allocation */}
            <div className={`${isRescheduling ? 'md:col-span-7' : 'md:col-span-12'} space-y-6 overflow-y-visible`}>
              <DetailHeader
                tenKhachHang={selectedAppointment.ten_khach_hang}
                soDienThoai={selectedAppointment.so_dien_thoai || selectedAppointment.sdt_khach_hang}
                ngayGioBatDau={selectedAppointment.ngay_gio_bat_dau}
                aptStartHourStr={aptStartHourStr}
                aptEndHourStr={aptEndHourStr}
                durationMs={durationMs}
                tenDichVu={selectedAppointment.ten_dich_vu}
                soThuTuBuoi={selectedAppointment.so_thu_tu_buoi}
                tongSoBuoiGoi={selectedAppointment.tong_so_buoi_goi}
                loaiGoi={selectedAppointment.loai_goi}
                isRescheduling={isRescheduling}
                setIsRescheduling={setIsRescheduling}
                selectedBuoi={selectedBuoi}
                rescheduleDate={rescheduleDate}
                currentBuoi={selectedAppointment.buoi}
                trangThai={selectedAppointment.trang_thai}
              />

              {isStaffUnavailable && !isCurrentStaffUnavailableAtNewSlot && (
                <div className="text-xs text-rose-700 dark:text-rose-455 font-medium leading-relaxed bg-rose-50 dark:bg-rose-955/10 p-3 rounded-xl border border-rose-150 dark:border-rose-900/30 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                  <span>⚠️</span>
                  <span>
                    Khung giờ này nhân sự <strong>{currentStaffName}</strong> không đáp ứng được (trùng lịch khác hoặc ngoài ca trực). Vui lòng chọn nhân sự khác hoặc đổi giờ!
                  </span>
                </div>
              )}

              <SymptomNotes
                selectedAppointment={selectedAppointment}
                isSendingEmail={isSendingEmail}
                handleResendEmail={handleResendEmail}
                appendCallLog={appendCallLog}
              />

              {/* Trạng thái & Thanh toán Section */}
              <StatusAndBillingSection
                selectedAppointment={selectedAppointment}
                assignStatus={assignStatus}
                isEditingStatus={isEditingStatus}
                setIsEditingStatus={setIsEditingStatus}
                handleStatusChange={handleStatusChange}
                handleUndoStatusChange={handleUndoStatusChange}
                setIsStatusHistoryOpen={setIsStatusHistoryOpen}
                isReceptionist={isReceptionist}
                isReceptionistLocked={isReceptionistLocked}
                receptionistActionOptions={receptionistActionOptions}
                onClose={onClose}
              />

              {/* Ghi chú nội bộ phòng khám */}
              <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Ghi chú nội bộ phòng khám {isNoteRequired && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  ref={noteTextareaRef}
                  rows={3}
                  value={localGhiChuNoiBo}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  disabled={isReceptionistLocked}
                  placeholder="Nhập ghi chú nội bộ (lý do hủy, ghi chú cuộc gọi, ghi chú ca trực, v.v.)..."
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold font-mono leading-relaxed resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    rescheduleError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-250 dark:border-zinc-800'
                  }`}
                />
                {rescheduleError && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 leading-none">{rescheduleError}</p>
                )}
              </div>

              {/* Staff Room Allocation */}
              <StaffRoomAllocation
                selectedAppointment={selectedAppointment}
                resolvedRoomName={resolvedRoomName}
                resolvedRoom={resolvedRoom}
                targetRole={targetRole}
                assignStaffId={assignStaffId}
                setAssignStaffId={setAssignStaffId}
                assignStatus={assignStatus}
                isReceptionist={isReceptionist}
                isLocked={isReceptionistLocked}
                isReassignAllowed={isReassignAllowed}
                buoi={effectiveBuoi}
                staffBudget={staffBudget}
                serviceDurationMinutes={Number(selectedAppointment.thoi_luong_phut) || 0}
                staffList={staffList}
                schedulesList={schedulesList}
                aptDateStr={rescheduleDate}
                aptStartHourStr={newStartHourStr}
                aptEndHourStr={newEndHourStr}
                appointments={appointments}
                onUnassignStaff={async () => {
                  try {
                    await unassignAppointmentStaff(String(selectedAppointment.id));
                    toast.success('Đã rút khỏi đích danh và đưa ca hẹn về Hàng chờ chung.');
                    onSuccess?.();
                    onClose();
                  } catch (err: any) {
                    console.error('Lỗi khi rút chỉ định nhân sự:', err);
                    toast.error(err?.response?.data?.message || 'Không thể rút chỉ định nhân sự.');
                  }
                }}
              />
            </div>

            {/* Right Column - Live Reschedule Workspace */}
            {isRescheduling && (
              <RescheduleSection
                rescheduleDate={rescheduleDate}
                setRescheduleDate={setRescheduleDate}
                todayStr={todayStr}
                maxDateStr={maxDateStr}
                selectedBuoi={selectedBuoi}
                setSelectedBuoi={setSelectedBuoi}
                selectedAppointment={selectedAppointment}
                origDateStr={origDateStr}
                getBuoiStaffCount={getBuoiStaffCount}
                isBuoiAllowed={isBuoiAllowed}
              />
            )}
          </div>

          {/* Footer actions */}
          <DetailFooter
            selectedAppointment={selectedAppointment}
            isReceptionist={isReceptionist}
            isReceptionistLocked={isReceptionistLocked}
            hideBilling={false}
            isAssigning={isAssigning}
            onClose={onClose}
            onSuccess={onSuccess}
            assignStaffId={assignStaffId}
            assignRoomId={assignRoomId}
            localGhiChuNoiBo={localGhiChuNoiBo}
            appointments={appointments}
          />
        </form>

        {/* History Modal */}
        <StatusHistoryModal
          isOpen={isStatusHistoryOpen}
          onClose={() => setIsStatusHistoryOpen(false)}
          appointment={selectedAppointment}
        />
      </motion.div>
    </div>
  );
}
