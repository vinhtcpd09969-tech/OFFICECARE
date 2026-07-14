import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '../../../../../stores/authStore';
import { 
  updateAppointmentStatus as updateAppointmentStatusAdmin,
  keepAliveAppointment as keepAliveAppointmentAdmin
} from '../../../api/admin.api';
import { 
  updateAppointmentStatus as updateAppointmentStatusRec,
  keepAliveAppointment as keepAliveAppointmentRec,
  resendEmail
} from '../../../../receptionist/api/receptionist.api';


import { getInstallmentCutoffSession } from '../../../../../utils/billing';

// Import subcomponents
import { DetailHeader } from './DetailHeader';
import { TreatmentHistory } from './TreatmentHistory';
import { StaffRoomAllocation } from './StaffRoomAllocation';
import { SymptomNotes } from './SymptomNotes';
import { DetailFooter } from './DetailFooter';

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
  onOpenTreatment?: (type?: 'single' | 'package', recId?: string) => void;
  appointments?: any[];
  onSuccess?: () => void;
  schedulesList?: any[];
  hideBilling?: boolean;
  isReceptionistOverride?: boolean;
  selectedTimeSlot: string;
  setSelectedTimeSlot: (val: string) => void;
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
  hideBilling = false,
  isReceptionistOverride,
  selectedTimeSlot,
  setSelectedTimeSlot,
  rescheduleDate,
  setRescheduleDate
}: AppointmentDetailModalProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const isReceptionist = isReceptionistOverride !== undefined 
    ? isReceptionistOverride 
    : (Number(user?.vai_tro_id) === 2);
    
  const targetRole = selectedAppointment?.loai_lich === 'kham_moi' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const [localGhiChuNoiBo, setLocalGhiChuNoiBo] = useState<string>(selectedAppointment?.ghi_chu_noi_bo || '');
  const [rescheduleError, setRescheduleError] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const [showConfirmType, setShowConfirmType] = useState<'save' | 'cancel' | 'receptionist_confirm' | null>(null);
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const resolvedRoom = roomsList.find(r => String(r.id) === String(assignRoomId));
  const resolvedRoomName = resolvedRoom?.ten_phong || selectedAppointment.ten_phong || 'Chưa chỉ định';
  const isUnconfirmedState = isReceptionist && ['cho_xac_nhan', 'chua_xac_nhan'].includes(selectedAppointment.trang_thai);

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
          await (isReceptionist ? keepAliveAppointmentRec : keepAliveAppointmentAdmin)(selectedAppointment.id);
          console.log('[Keep-Alive] Đã gia hạn giữ chỗ lịch hẹn thêm 5 phút');
          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error('[Keep-Alive] Lỗi khi gia hạn giữ chỗ:', error);
        }
      };

      sendKeepAlive();
      const interval = setInterval(sendKeepAlive, 3 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [selectedAppointment, onSuccess]);

  if (!selectedAppointment) return null;

  // Logic kiểm tra trùng lịch (Overlap)
  const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && e1 > s2;
  };

  const appendCallLog = (logText: string) => {
    const vnTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newLog = `[${vnTimeStr}] ${logText}\n`;
    setLocalGhiChuNoiBo(prev => prev + newLog);
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;
  const durationMs = new Date(currentEnd).getTime() - new Date(currentStart).getTime();

  // Helper check availability of a staff on a custom date and time slot
  const checkStaffAvailabilityForDate = (staffId: string | number, dateStr: string, slotStartStr: string) => {
    if (!staffId) return true;

    // 1. Check working schedule shift
    if (schedulesList && schedulesList.length > 0) {
      const staffSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(staffId) && 
        s.ngay === dateStr &&
        s.trang_thai === 'hoat_dong'
      );
      
      if (staffSchedules.length === 0) return false;

      const activeSchedule = staffSchedules[0];
      const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
      const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

      const [startH, startM] = slotStartStr.split(':').map(Number);
      const startDate = new Date(2000, 0, 1, startH, startM);
      const endDate = new Date(startDate.getTime() + durationMs);
      const slotEndStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      const isWithinShift = dutyStart <= slotStartStr && dutyEnd >= slotEndStr;
      if (!isWithinShift) return false;
    }

    // 2. Check overlap with other appointments
    const [startH, startM] = slotStartStr.split(':').map(Number);
    const targetStart = new Date(2000, 0, 1, startH, startM).getTime();
    const targetEnd = targetStart + durationMs;

    const overlap = appointments.some(apt => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (['da_huy', 'khong_den'].includes(apt.trang_thai)) return false;

      const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
      if (!assignedId || String(assignedId) !== String(staffId)) return false;

      const aptD = new Date(apt.ngay_gio_bat_dau);
      const aptDStr = `${aptD.getFullYear()}-${String(aptD.getMonth() + 1).padStart(2, '0')}-${String(aptD.getDate()).padStart(2, '0')}`;
      if (aptDStr !== dateStr) return false;

      const aptS = new Date(apt.ngay_gio_bat_dau);
      const aptSStr = `${String(aptS.getHours()).padStart(2, '0')}:${String(aptS.getMinutes()).padStart(2, '0')}`;
      const [aptSH, aptSM] = aptSStr.split(':').map(Number);
      const aptSMs = new Date(2000, 0, 1, aptSH, aptSM).getTime();
      
      const aptE = new Date(apt.ngay_gio_ket_thuc);
      const aptEStr = `${String(aptE.getHours()).padStart(2, '0')}:${String(aptE.getMinutes()).padStart(2, '0')}`;
      const [aptEH, aptEM] = aptEStr.split(':').map(Number);
      const aptEMs = new Date(2000, 0, 1, aptEH, aptEM).getTime();

      return targetStart < aptEMs && targetEnd > aptSMs;
    });

    return !overlap;
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
  const isRescheduled = !!(selectedTimeSlot && rescheduleDate && (selectedTimeSlot !== aptStartHourStr || rescheduleDate !== origDateStr));
  const isStatusChanged = assignStatus !== selectedAppointment.trang_thai;
  const isCancelledOrNoShowStatus = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(assignStatus);
  const origStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id || '';
  const currentStaffId = assignStaffId || '';
  const isStaffChanged = String(currentStaffId) !== String(origStaffId);
  const isNoteRequired = isRescheduled || isStaffChanged || isCancelledOrNoShowStatus;

  // States for dynamic slot-driven clinical times
  const [newStartHourStr, setNewStartHourStr] = useState<string>(aptStartHourStr);
  const [newEndHourStr, setNewEndHourStr] = useState<string>(aptEndHourStr);

  useEffect(() => {
    if (!selectedTimeSlot) return;
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    const end = new Date(date.getTime() + durationMs);
    setNewStartHourStr(selectedTimeSlot);
    setNewEndHourStr(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);

    if (assignStaffId) {
      const isAvailable = checkStaffAvailabilityForDate(assignStaffId, rescheduleDate, selectedTimeSlot);
      if (!isAvailable) {
        setAssignStaffId('');
      }
    }
  }, [selectedTimeSlot, durationMs, assignStaffId, rescheduleDate, setAssignStaffId]);

  // Check overlap for the newly selected slot
  const getIsoStringForTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(selectedAppointment.ngay_gio_bat_dau);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const newStartIso = getIsoStringForTime(selectedTimeSlot);
  const newEndIso = new Date(new Date(newStartIso).getTime() + durationMs).toISOString();

  const overlappingApts = appointments.filter(apt => 
    apt.id !== selectedAppointment.id && 
    apt.trang_thai !== 'da_huy' &&
    apt.trang_thai !== 'khong_den' &&
    isOverlapping(newStartIso, newEndIso, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
  );

  const occupiedStaffIds = overlappingApts.map(apt => apt.bac_si_id || apt.chuyen_gia_id).filter(Boolean);

  // Tự động phân phòng dựa trên ca trực của nhân viên khi gán
  useEffect(() => {
    if (!assignStaffId) return;

    const staffSchedule = (schedulesList || []).find(s => 
      String(s.nguoi_dung_id) === String(assignStaffId) &&
      s.ngay === rescheduleDate &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) <= newStartHourStr &&
      s.gio_ket_thuc.substring(0, 5) >= newEndHourStr
    );

    if (staffSchedule && staffSchedule.phong_id) {
      setAssignRoomId(String(staffSchedule.phong_id));
    }
  }, [assignStaffId, schedulesList, rescheduleDate, newStartHourStr, newEndHourStr, setAssignRoomId]);

  const currentStaff = staffList.find(s => String(s.id) === String(assignStaffId));
  const currentStaffName = currentStaff ? currentStaff.ho_ten : 'nhân sự';

  // Check if current staff is bận/unavailable at the new slot
  const isCurrentStaffUnavailableAtNewSlot = assignStaffId && !checkStaffAvailabilityForDate(assignStaffId, rescheduleDate, selectedTimeSlot);
  const isStaffUnavailable = assignStaffId ? !checkStaffAvailabilityForDate(assignStaffId, rescheduleDate, selectedTimeSlot) : false;

  const now = new Date();
  const isToday = rescheduleDate === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const generateDynamicSlots = () => {
    const intervalMins = Math.round(durationMs / 60000);
    
    const generateBlock = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const blockSlots: string[] = [];
      const current = new Date();
      current.setHours(startHour, startMinute, 0, 0);

      const end = new Date();
      end.setHours(endHour, endMinute, 0, 0);

      while (true) {
        const slotNextStart = new Date(current.getTime() + intervalMins * 60000);
        if (slotNextStart.getTime() > end.getTime()) {
          break;
        }

        const formatTime = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };

        blockSlots.push(formatTime(current));
        current.setTime(slotNextStart.getTime());
      }
      return blockSlots;
    };

    return [
      ...generateBlock(8, 0, 12, 0),
      ...generateBlock(12, 0, 18, 0),
      ...generateBlock(18, 0, 20, 0)
    ];
  };

  const dynamicTimeSlots = useMemo(() => {
    const baseSlots = generateDynamicSlots();
    if (aptStartHourStr && !baseSlots.includes(aptStartHourStr)) {
      baseSlots.push(aptStartHourStr);
    }
    return baseSlots.sort((a, b) => {
      const [ha, ma] = a.split(':').map(Number);
      const [hb, mb] = b.split(':').map(Number);
      return (ha * 60 + ma) - (hb * 60 + mb);
    });
  }, [durationMs, aptStartHourStr]);

  const isStaffOnDuty = (staffId: string | number, dateStr: string, slot: string) => {
    const docSchedules = (schedulesList || []).filter(s => 
      String(s.nguoi_dung_id) === String(staffId) && 
      s.ngay === dateStr
    );
    if (docSchedules.length === 0) return false;

    const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) return false;

    const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

    const [startH, startM] = slot.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, startH, startM);
    const endDate = new Date(startDate.getTime() + durationMs);

    const [dsH, dsM] = dutyStart.split(':').map(Number);
    const [deH, deM] = dutyEnd.split(':').map(Number);
    const dsDate = new Date(2000, 0, 1, dsH, dsM);
    const deDate = new Date(2000, 0, 1, deH, deM);

    return startDate.getTime() >= dsDate.getTime() && endDate.getTime() <= deDate.getTime();
  };

  const isSlotAllowed = (slot: string) => {
    const isOrigDate = rescheduleDate === format(new Date(selectedAppointment.ngay_gio_bat_dau), 'yyyy-MM-dd');
    if (slot === aptStartHourStr && isOrigDate) return true;
    
    if (isToday) {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotTime = new Date(now);
      slotTime.setHours(slotHour, slotMinute, 0, 0);
      
      const diffMins = (slotTime.getTime() - now.getTime()) / (1000 * 60);
      if (diffMins < 60) return false;
    }
    return true;
  };

  // Live Slot Availability / Capacity Checker
  const getSlotAvailabilityForDate = (slot: string, dateStr: string) => {
    let staffToFilter = targetRole === 'Bác sĩ'
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    const assignedStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
    if (isReceptionist && assignedStaffId) {
      staffToFilter = staffToFilter.filter(s => String(s.id) === String(assignedStaffId));
    }

    // 1. Filter staff that are active on duty at dateStr and slot time
    const availableStaff = staffToFilter.filter(doc => {
      const docSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(doc.id) && 
        s.ngay === dateStr
      );
      if (docSchedules.length === 0) return false;

      const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
      if (!activeSchedule) return false;

      const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
      const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

      const [startH, startM] = slot.split(':').map(Number);
      const startDate = new Date(2000, 0, 1, startH, startM);
      const endDate = new Date(startDate.getTime() + durationMs);
      const slotEndStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      const isCovered = dutyStart <= slot && dutyEnd >= slotEndStr;
      if (!isCovered) return false;

      // Check if KTV is busy with another appointment at this slot on dateStr
      const isOccupied = appointments.some(apt => {
        if (String(apt.id) === String(selectedAppointment.id)) return false;
        if (['da_huy', 'khong_den'].includes(apt.trang_thai)) return false;
        if (String(apt.bac_si_id || apt.chuyen_gia_id) !== String(doc.id)) return false;

        const aptD = new Date(apt.ngay_gio_bat_dau);
        const aptDStr = `${aptD.getFullYear()}-${String(aptD.getMonth() + 1).padStart(2, '0')}-${String(aptD.getDate()).padStart(2, '0')}`;
        if (aptDStr !== dateStr) return false;

        const aptS = new Date(apt.ngay_gio_bat_dau);
        const aptSStr = `${String(aptS.getHours()).padStart(2, '0')}:${String(aptS.getMinutes()).padStart(2, '0')}`;
        const [aptSH, aptSM] = aptSStr.split(':').map(Number);
        const aptSMs = new Date(2000, 0, 1, aptSH, aptSM).getTime();
        
        const aptE = new Date(apt.ngay_gio_ket_thuc);
        const aptEStr = `${String(aptE.getHours()).padStart(2, '0')}:${String(aptE.getMinutes()).padStart(2, '0')}`;
        const [aptEH, aptEM] = aptEStr.split(':').map(Number);
        const aptEMs = new Date(2000, 0, 1, aptEH, aptEM).getTime();

        return startDate.getTime() < aptEMs && endDate.getTime() > aptSMs;
      });

      return !isOccupied;
    });

    // 2. Filter unassigned appointments at this slot on dateStr (which will occupy available staff capacity)
    const unassignedAptsCount = appointments.filter(apt => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (['da_huy', 'khong_den'].includes(apt.trang_thai)) return false;
      if (apt.bac_si_id) return false; // has doctor assigned

      const matchType = targetRole === 'Bác sĩ'
        ? apt.loai_lich === 'kham_moi'
        : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
      if (!matchType) return false;

      const aptD = new Date(apt.ngay_gio_bat_dau);
      const aptDStr = `${aptD.getFullYear()}-${String(aptD.getMonth() + 1).padStart(2, '0')}-${String(aptD.getDate()).padStart(2, '0')}`;
      if (aptDStr !== dateStr) return false;

      const aptS = new Date(apt.ngay_gio_bat_dau);
      const aptSStr = `${String(aptS.getHours()).padStart(2, '0')}:${String(aptS.getMinutes()).padStart(2, '0')}`;
      const [aptSH, aptSM] = aptSStr.split(':').map(Number);
      const aptSMs = new Date(2000, 0, 1, aptSH, aptSM).getTime();
      
      const aptE = new Date(apt.ngay_gio_ket_thuc);
      const aptEStr = `${String(aptE.getHours()).padStart(2, '0')}:${String(aptE.getMinutes()).padStart(2, '0')}`;
      const [aptEH, aptEM] = aptEStr.split(':').map(Number);
      const aptEMs = new Date(2000, 0, 1, aptEH, aptEM).getTime();

      const [startH, startM] = slot.split(':').map(Number);
      const targetStart = new Date(2000, 0, 1, startH, startM).getTime();
      const targetEnd = targetStart + durationMs;

      return targetStart < aptEMs && targetEnd > aptSMs;
    }).length;

    if (isReceptionist && assignedStaffId) {
      return availableStaff.length;
    }

    return Math.max(0, availableStaff.length - unassignedAptsCount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
    const newStart = new Date(`${rescheduleDate}T${selectedTimeSlot}:00`);
    const formattedOrigStart = format(origStart, 'yyyy-MM-dd HH:mm');
    const formattedNewStart = format(newStart, 'yyyy-MM-dd HH:mm');
    const isRescheduled = formattedNewStart !== formattedOrigStart;

    const isCancelledOrNoShowStatus = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(assignStatus);
    
    const origStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id || '';
    const currentStaffId = assignStaffId || '';
    const isStaffChanged = String(currentStaffId) !== String(origStaffId);
    
    if (isRescheduled || isStaffChanged || isCancelledOrNoShowStatus) {
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
    
    // Auto-clear staff assignment for Receptionist if old staff is busy in new slot
    if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
      setAssignStaffId('');
      setAssignStatus('cho_xac_nhan');
    }

    const currentStaffIdToCheck = isCurrentStaffUnavailableAtNewSlot && isReceptionist ? '' : assignStaffId;

    if (!['da_huy', 'khong_den', 'chua_xac_nhan', 'cho_xac_nhan', 'cho_huy'].includes(assignStatus)) {
      if (!assignRoomId) {
        toast.error('Vui lòng chọn phòng thực hiện!');
        return;
      }
      if (!currentStaffIdToCheck) {
        toast.error(
          targetRole === 'Bác sĩ' 
            ? 'Vui lòng chọn Bác sĩ phụ trách!' 
            : 'Vui lòng chọn Kỹ thuật viên phụ trách!'
        );
        return;
      }
    }

    if (isStaffUnavailable && !isReceptionist) {
      // For Admin, it's just a warning, we still let them proceed but ask for confirmation
    } else if (isStaffUnavailable && isReceptionist && !isCurrentStaffUnavailableAtNewSlot) {
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
    if (showConfirmType === 'receptionist_confirm') {
      setShowConfirmType(null);
      const toastId = toast.loading('Đang cập nhật trạng thái...');
      try {
        // Compute new start/end date times
        let finalNgayGioBatDau: string | null = null;
        let finalNgayGioKetThuc: string | null = null;
        const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
        const newStart = new Date(`${rescheduleDate}T${selectedTimeSlot}:00`);
        const newEnd = new Date(newStart.getTime() + durationMs);

        // Format check
        const formattedOrigStart = format(origStart, 'yyyy-MM-dd HH:mm');
        const formattedNewStart = format(newStart, 'yyyy-MM-dd HH:mm');

        if (formattedNewStart !== formattedOrigStart) {
          finalNgayGioBatDau = newStart.toISOString();
          finalNgayGioKetThuc = newEnd.toISOString();
        }

        const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
        
        // If current staff is unavailable, clear them
        const finalStaffId = isCurrentStaffUnavailableAtNewSlot && isReceptionist ? null : (assignStaffId || null);
        const finalStatus = isCurrentStaffUnavailableAtNewSlot && isReceptionist ? 'cho_xac_nhan' : 'cho_xac_nhan';

        await updateFn(selectedAppointment.id, {
          trang_thai: finalStatus,
          bac_si_id: finalStaffId,
          chuyen_gia_id: finalStaffId,
          ghi_chu_noi_bo: localGhiChuNoiBo,
          ...(finalNgayGioBatDau && { ngay_gio_bat_dau: finalNgayGioBatDau }),
          ...(finalNgayGioKetThuc && { ngay_gio_ket_thuc: finalNgayGioKetThuc })
        });
        toast.success('Đã xác nhận lịch hẹn thành công!', { id: toastId });
        onClose();
        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái', { id: toastId });
      }
    } else if (showConfirmType === 'cancel') {
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
          let finalNgayGioBatDau: string | null = null;
          let finalNgayGioKetThuc: string | null = null;
          const origStart = new Date(selectedAppointment.ngay_gio_bat_dau);
          const newStart = new Date(`${rescheduleDate}T${selectedTimeSlot}:00`);
          const newEnd = new Date(newStart.getTime() + durationMs);

          const formattedOrigStart = format(origStart, 'yyyy-MM-dd HH:mm');
          const formattedNewStart = format(newStart, 'yyyy-MM-dd HH:mm');

          if (formattedNewStart !== formattedOrigStart) {
            finalNgayGioBatDau = newStart.toISOString();
            finalNgayGioKetThuc = newEnd.toISOString();
          }

          const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
          await updateFn(selectedAppointment.id, {
            trang_thai: 'da_huy',
            ghi_chu_noi_bo: trimmedReason || localGhiChuNoiBo,
            ly_do_huy: trimmedReason || localGhiChuNoiBo,
            ...(finalNgayGioBatDau && { ngay_gio_bat_dau: finalNgayGioBatDau }),
            ...(finalNgayGioKetThuc && { ngay_gio_ket_thuc: finalNgayGioKetThuc })
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
      
      // Auto-clear staff assignment for Receptionist if old staff is busy in new slot
      if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
        setAssignStaffId('');
        setAssignStatus('cho_xac_nhan');
      }

      // Timeout to allow state updates to settle before saving
      setTimeout(() => {
        onSave({ preventDefault: () => {} } as React.FormEvent, localGhiChuNoiBo);
      }, 50);
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const maxDateStr = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-955/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className={`bg-white dark:bg-zinc-900 rounded-[32px] w-full flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden border border-slate-100 dark:border-zinc-800/80 transition-all duration-300 max-h-[90vh] relative ${isRescheduling ? 'max-w-5xl' : 'max-w-2xl'}`}
      >
        {/* Custom Confirmation Dialog Overlay */}
        {showConfirmType && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-zinc-800 text-center space-y-4"
            >
              <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-955/30 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                {showConfirmType === 'cancel' ? '⚠️' : '❓'}
              </div>
              
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide">
                  {showConfirmType === 'cancel' 
                    ? 'Hủy lịch hẹn' 
                    : assignStatus === 'da_checkin' && isStatusChanged
                      ? 'Check-in khách hàng'
                      : 'Xác nhận thay đổi'}
                </h5>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed animate-fade-in">
                  {(() => {
                    if (showConfirmType === 'cancel') {
                      return 'Bạn có chắc chắn muốn hủy lịch hẹn này không? Vui lòng nhập lý do bên dưới:';
                    }
                    if (showConfirmType === 'receptionist_confirm') {
                      return 'Bạn có chắc chắn muốn xác nhận lịch hẹn này không?';
                    }
                    
                    if (isStatusChanged) {
                      if (assignStatus === 'da_checkin') {
                        return 'Bạn có muốn check-in cho khách ngay bây giờ không?';
                      }
                      if (assignStatus === 'dang_kham') {
                        return 'Bạn có muốn chuyển lịch hẹn sang trạng thái đang khám không?';
                      }
                      if (assignStatus === 'hoan_thanh') {
                        return 'Bạn có muốn hoàn thành lịch hẹn này không?';
                      }
                      if (assignStatus === 'da_huy') {
                        return 'Bạn có muốn hủy lịch hẹn này không?';
                      }
                      if (assignStatus === 'khong_den') {
                        return 'Bạn có muốn xác nhận khách không đến cho lịch hẹn này không?';
                      }
                      if (assignStatus === 'da_xac_nhan') {
                        return 'Bạn có muốn xác nhận lịch hẹn này không?';
                      }
                    }

                    if (isRescheduled) {
                      return 'Bạn có muốn đổi lịch hẹn này sang ngày/giờ mới không?';
                    }

                    return 'Bạn có chắc chắn muốn lưu thay đổi của lịch hẹn này không?';
                  })()}
                </p>
              </div>

              {showConfirmType === 'cancel' && (
                <textarea
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy lịch tại đây..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-955 border border-slate-250 dark:border-zinc-850 rounded-xl text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
                />
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmType(null);
                    setCustomCancelReason('');
                  }}
                  className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-855 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`flex-1 py-2 text-white text-xs font-bold rounded-xl transition-colors ${
                    showConfirmType === 'cancel' 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Đồng ý
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors duration-300 shrink-0 select-none">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-150">
              Hồ sơ Lịch hẹn <span className="text-emerald-600 dark:text-emerald-450">#{selectedAppointment.ma_lich_dat}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-550 font-semibold mt-1">Thông tin chi tiết và điều phối phòng khám</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
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
                maLichDat={selectedAppointment.ma_lich_dat}
                tenKhachHang={selectedAppointment.ten_khach_hang}
                soDienThoai={selectedAppointment.so_dien_thoai}
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
                selectedTimeSlot={selectedTimeSlot}
                rescheduleDate={rescheduleDate}
              />

              {/* Installment Payment Warning Notice for Receptionist */}
              {selectedAppointment.loai_lich?.toUpperCase() === 'DIEU_TRI' &&
                selectedAppointment.hinh_thuc_thanh_toan_goi === 'tra_gop' &&
                selectedAppointment.trang_thai_hoa_don_goi !== 'da_thanh_toan' &&
                Number(selectedAppointment.so_tien_da_tra_goi) < Number(selectedAppointment.tong_tien_phai_tra_goi) &&
                Number(selectedAppointment.so_thu_tu_buoi) >= getInstallmentCutoffSession(Number(selectedAppointment.tong_so_buoi_goi || 10)) && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
                    <span className="text-amber-500 shrink-0 text-base">⚠️</span>
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-bold uppercase tracking-wider">Cảnh báo thanh toán Đợt 2 (Trả Góp 50%)</p>
                      <p className="mt-1 font-semibold leading-relaxed">
                        Bệnh nhân đã hoàn thành <strong>{Number(selectedAppointment.so_thu_tu_buoi || 1) - 1} / {selectedAppointment.tong_so_buoi_goi}</strong> buổi điều trị. 
                        Theo quy định bảo vệ dòng tiền, khách hàng <strong>bắt buộc phải đóng 50% còn lại</strong> trước khi tiến hành trị liệu buổi số {selectedAppointment.so_thu_tu_buoi}.
                      </p>
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                            navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                            onClose();
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all text-[11px]"
                        >
                          💵 Thu tiền Đợt 2 ngay
                        </button>
                      </div>
                    </div>
                  </div>
              )}

              <TreatmentHistory
                loaiLich={selectedAppointment.loai_lich}
                chanDoan={selectedAppointment.chan_doan}
                chongChiDinh={selectedAppointment.chong_chi_dinh}
              />

              {/* Warning message when staff selected is busy */}
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
                isUnconfirmedState={isUnconfirmedState}
                isSendingEmail={isSendingEmail}
                handleResendEmail={handleResendEmail}
                appendCallLog={appendCallLog}
              />

              {!isReceptionist && (
                <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Trạng thái lịch hẹn (Quản lý)
                  </label>
                  <select
                    value={assignStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="chua_xac_nhan">Chưa xác nhận</option>
                    <option value="cho_xac_nhan">Chờ gán nhân sự (Chờ xác nhận)</option>
                    <option value="da_xac_nhan">Đã xác nhận</option>
                    <option value="da_checkin">Đã check-in</option>
                    <option value="dang_kham">Đang khám</option>
                    <option value="hoan_thanh">Hoàn thành</option>
                    <option value="da_huy">Đã hủy</option>
                    <option value="khong_den">Không đến</option>
                  </select>
                </div>
              )}

              {/* Ghi chú nội bộ phòng khám (Hiển thị cho tất cả nhân sự) */}
              <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  Ghi chú nội bộ phòng khám {isNoteRequired && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  ref={noteTextareaRef}
                  rows={3}
                  value={localGhiChuNoiBo}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Nhập ghi chú nội bộ (lý do hủy, ghi chú cuộc gọi, ghi chú ca trực, v.v.)..."
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold font-mono leading-relaxed resize-none ${
                    rescheduleError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-250 dark:border-zinc-800'
                  }`}
                />
                {rescheduleError && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 leading-none">{rescheduleError}</p>
                )}
              </div>

              <StaffRoomAllocation
                selectedAppointment={selectedAppointment}
                resolvedRoomName={resolvedRoomName}
                resolvedRoom={resolvedRoom}
                targetRole={targetRole}
                assignStaffId={assignStaffId}
                setAssignStaffId={setAssignStaffId}
                assignStatus={assignStatus}
                isReceptionist={isReceptionist}
                staffList={staffList}
                schedulesList={schedulesList}
                aptDateStr={rescheduleDate}
                aptStartHourStr={newStartHourStr}
                aptEndHourStr={newEndHourStr}
                occupiedStaffIds={occupiedStaffIds}
                appointments={appointments}
              />
            </div>

            {/* Right Column (40% width) - Live Reschedule Workspace */}
            {isRescheduling && (
              <div className="md:col-span-5 md:border-l md:border-slate-100 dark:md:border-zinc-800/80 md:pl-6 space-y-5 flex flex-col justify-start">
                <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800/40">
                  <h4 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    Đổi ngày / giờ hẹn
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-555 font-semibold leading-relaxed">
                    Thay đổi ngày và khung giờ hoạt động của lịch khám/trị liệu
                  </p>
                </div>

                {/* Date selector (limited to 1 month range) */}
                <div className="space-y-1.5 select-none">
                  <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Chọn ngày mới
                  </label>
                  <input 
                    type="date"
                    min={todayStr}
                    max={maxDateStr}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-850 rounded-2xl text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-semibold shadow-inner"
                  />
                </div>

                {/* Lưới giờ trực quan (Live Capacity Grid) */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                  <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Chọn giờ mới (Live Capacity Grid)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[220px] p-1.5 border border-slate-100/50 dark:border-zinc-800/30 rounded-2xl scrollbar-thin">
                    {dynamicTimeSlots
                      .filter(slot => {
                        const assignedStaffId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
                        if (isReceptionist && assignedStaffId) {
                          return isStaffOnDuty(assignedStaffId, rescheduleDate, slot);
                        }
                        return true;
                      })
                      .map(slot => {
                        const availableStaffCount = getSlotAvailabilityForDate(slot, rescheduleDate);
                        const isSelected = selectedTimeSlot === slot;
                        const isAllowed = isSlotAllowed(slot);
                        
                        const isCurrentSlot = slot === aptStartHourStr && rescheduleDate === format(new Date(selectedAppointment.ngay_gio_bat_dau), 'yyyy-MM-dd');
                        
                        const [sh, sm] = slot.split(':').map(Number);
                        const slotStart = new Date(2000, 0, 1, sh, sm);
                        const slotEnd = new Date(slotStart.getTime() + durationMs);
                        const slotEndStr = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;
                        const slotRangeStr = `${slot} - ${slotEndStr}`;

                        let bgClass = '';
                        let textClass = '';
                        let label = '';
                        
                        if (isCurrentSlot) {
                          bgClass = isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                            : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400';
                          label = 'Giờ hiện tại';
                        } else if (!isAllowed) {
                          bgClass = 'bg-slate-50 dark:bg-zinc-800/10 border-slate-100 dark:border-zinc-850 opacity-40 cursor-not-allowed';
                          textClass = 'text-slate-400 dark:text-zinc-555';
                          label = 'Quá giờ';
                        } else if (availableStaffCount === 0) {
                          bgClass = 'bg-slate-50 dark:bg-zinc-800/10 border-slate-150 dark:border-zinc-850 opacity-50 cursor-not-allowed relative overflow-hidden';
                          textClass = 'text-slate-400 dark:text-zinc-555';
                          label = 'Hết chỗ';
                        } else if (isSelected) {
                          bgClass = 'bg-emerald-600 border-emerald-600 text-white shadow-md';
                          label = 'Giờ muốn đổi';
                        } else if (availableStaffCount === 1) {
                          bgClass = 'bg-amber-50/50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-450 hover:border-amber-400';
                          label = 'Còn 1 chỗ';
                        } else {
                          bgClass = 'bg-emerald-50/50 dark:bg-emerald-955/15 border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-455 hover:border-emerald-400';
                          label = `Còn ${availableStaffCount} chỗ`;
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!isAllowed || (availableStaffCount === 0 && !isCurrentSlot)}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-2 px-1 border rounded-xl text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 min-h-[56px] h-14 flex-shrink-0 w-full ${bgClass} ${textClass}`}
                          >
                            <span className="font-extrabold text-[11px] sm:text-[12px] tracking-tight">{slotRangeStr}</span>
                            <span className="text-[8px] font-black uppercase tracking-wider opacity-85">{label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-6 bg-slate-50/30 dark:bg-zinc-900/30 border-t border-slate-100 dark:border-zinc-800/80">
            <DetailFooter
              selectedAppointment={selectedAppointment}
              isReceptionist={isReceptionist}
              hideBilling={hideBilling}
              isAssigning={isAssigning}
              onClose={onClose}
              onSuccess={onSuccess}
              assignStaffId={assignStaffId}
              assignRoomId={assignRoomId}
              localGhiChuNoiBo={localGhiChuNoiBo}
              isUnconfirmedState={isUnconfirmedState}
              setAssignStatus={setAssignStatus}
              setCancelReason={setCancelReason}
              setShowConfirmType={setShowConfirmType}
              appointments={appointments}
            />
          </div>
        </form>
      </motion.div>
    </div>
  );
}
