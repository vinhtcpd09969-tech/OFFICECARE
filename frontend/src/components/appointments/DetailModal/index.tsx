import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Pencil, Check, Clock, Undo2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import {
  updateAppointmentStatus as updateAppointmentStatusAdmin,
  getStaffBudgetForBuoi
} from '../../../features/admin/api/admin.api';
import {
  updateAppointmentStatus as updateAppointmentStatusRec,
  resendEmail
} from '../../../features/receptionist/api/receptionist.api';
import { CustomDatePicker } from '../../CustomDatePicker';
import { StatusHistoryModal } from '../../StatusHistoryModal';


import { getInstallmentCutoffSession, isPaymentDue } from '../../../utils/billing';
import { getReceptionistActionOptions, getReceptionistAllowedTargets, hasAssignedStaff, isReceptionistLockedStatus } from './receptionistStatusRules';
import { statusConfig } from '../../appointmentStatusConfig';

// Import subcomponents
import { DetailHeader } from './DetailHeader';
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
  hideBilling = false,
  isReceptionistOverride,
  selectedBuoi,
  setSelectedBuoi,
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
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isStatusHistoryOpen, setIsStatusHistoryOpen] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsEditingStatus(false);
  }, [selectedAppointment]);

  const currentStatusInfo = statusConfig[assignStatus] || statusConfig[selectedAppointment?.trang_thai] || {
    label: assignStatus || selectedAppointment?.trang_thai || 'Chưa xác định',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null
  };

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

  // Lựa chọn trạng thái mới chỉ nằm ở state cục bộ (assignStatus) cho tới khi bấm "Lưu cập nhật" —
  // so sánh với trạng thái gốc để biết có đang có lựa chọn CHƯA LƯU hay không, tránh badge trông
  // giống hệt trạng thái đã lưu thật khiến người dùng tưởng nhầm đã xong (và không có đường hoàn tác).
  const hasPendingStatusChange = !!assignStatus && assignStatus !== selectedAppointment?.trang_thai;

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

  // A7 — đổi lịch chỉ còn ngày + buổi. Mốc buổi danh nghĩa PHẢI khớp GIO_NHAN_KHACH ở backend
  // (domain/capacity.ts) — lịch hẹn theo buổi lưu ngay_gio_bat_dau/ngay_gio_ket_thuc là TRỌN
  // buổi (vd 07:30-12:00), không phải khung giờ riêng của dịch vụ.
  const BUOI_INFO: Record<'sang' | 'chieu', { label: string; batDau: string; ketThuc: string }> = {
    sang: { label: 'Buổi sáng', batDau: '07:30', ketThuc: '12:00' },
    chieu: { label: 'Buổi chiều', batDau: '12:00', ketThuc: '19:30' },
  };

  // Nhân sự có TRỰC GIAO với buổi này không (chỉ cần giao nhau, không bắt phủ trọn buổi — trực
  // 07:00-16:00 vẫn giao với buổi chiều 12:00-19:30, chỉ là phủ một phần, xem StaffRoomAllocation
  // để biết cách hiện cảnh báo "chỉ nhận khách đến trước ...").
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

  // Nhân sự có đang bận (dang_kham) với MỘT lịch khác trong đúng buổi/ngày này không — chỉ ca
  // ĐANG THỰC HIỆN mới thật sự chiếm người, ca chỉ xếp hàng chờ trong cùng buổi không phải xung
  // đột (bình thường của mô hình hàng đợi).
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

  // Khung giờ ĐÍCH — buổi đang chọn để đổi lịch (nếu có), ngược lại là buổi hiện tại của ca hẹn.
  // Dùng để duty-check nhân sự (StaffRoomAllocation) và tự động phân phòng, KHÔNG còn phụ thuộc
  // vào 1 giờ cụ thể nào nữa.
  const effectiveBuoi: 'sang' | 'chieu' = (selectedBuoi || selectedAppointment.buoi || 'sang') as 'sang' | 'chieu';
  const newStartHourStr = BUOI_INFO[effectiveBuoi].batDau;
  const newEndHourStr = BUOI_INFO[effectiveBuoi].ketThuc;

  // Bỏ chọn nhân sự nếu người đang gán không còn phù hợp với buổi/ngày vừa đổi — CHỈ áp dụng cho
  // Quản lý/Admin (người có quyền đổi nhân sự). Lễ tân không có quyền này (xem business rule "Quyền
  // đổi nhân sự") nên không được để hiệu ứng này âm thầm xóa assignStaffId của họ — nếu không, lúc
  // Lễ tân bấm "Lưu cập nhật" chỉ để đổi buổi, payload sẽ gửi bac_si_id: null và XÓA MẤT nhân sự đã
  // phân bổ (đã xác nhận qua dữ liệu thật: nhan_su_id về NULL sau một lượt đổi lịch của Lễ tân).
  useEffect(() => {
    if (isReceptionist || !selectedBuoi || !assignStaffId) return;
    if (!checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi)) {
      setAssignStaffId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuoi, rescheduleDate]);

  // B15 — chỉ Quản lý/Admin được đổi nhân sự, và CHỈ khi ca CHƯA bắt đầu (đã xác nhận/đã check-in)
  // hoặc ĐANG THỰC HIỆN — khớp đúng "Quyền đổi nhân sự" trong kế hoạch tổng. Hoàn thành/đã hủy/
  // không đến/chờ tái lượng giá đều không còn ý nghĩa để đổi người phụ trách.
  const isReassignAllowed = ['da_xac_nhan', 'da_checkin', 'dang_kham'].includes(selectedAppointment.trang_thai);

  // B15 — ngân sách phút còn lại của từng nhân sự (đúng túi vai trò) cho buổi/ngày đang xét, loại
  // trừ chính ca này khỏi "đã dùng". Chỉ Admin/Quản lý cần (Lễ tân không có quyền đổi nhân sự nên
  // không tải, khỏi tốn API mỗi lần mở modal).
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

  // Tự động phân phòng dựa trên ca trực của nhân viên khi gán (giao với buổi đích là đủ, không
  // cần phủ trọn — nếu chỉ phủ 1 phần, cảnh báo riêng ở StaffRoomAllocation đã lo phần nhắc nhở).
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

  // Nhân sự đang gán có còn phù hợp với buổi/ngày đích không (chỉ có ý nghĩa sau khi đã chọn buổi
  // để đổi lịch — chưa chọn thì coi như chưa cần kiểm tra gì).
  const isCurrentStaffUnavailableAtNewSlot = !!(selectedBuoi && assignStaffId && !checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi));
  const isStaffUnavailable = !!(selectedBuoi && assignStaffId) && !checkStaffAvailableForBuoi(assignStaffId, rescheduleDate, selectedBuoi);

  const now = new Date();
  const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = rescheduleDate === todayLocalStr;

  // Buổi đã qua giờ nhận khách kết thúc (chỉ áp dụng khi ngày đích là hôm nay) — mirror isBuoiDaQua
  // phía backend/public booking.
  const isBuoiAllowed = (buoi: 'sang' | 'chieu') => {
    const isOrigBuoiDate = buoi === selectedAppointment.buoi && rescheduleDate === origDateStr;
    if (isOrigBuoiDate) return true; // luôn cho giữ nguyên buổi gốc
    if (!isToday) return true;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
    return nowMinutes < h * 60 + m;
  };

  // Đếm nhân sự đúng vai trò còn khả dụng cho 1 buổi tại 1 ngày — thay lưới giờ cũ bằng 2 thẻ buổi.
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

    // Receptionist status transition validation
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
    
    // Auto-clear staff assignment for Receptionist if old staff is busy in new slot
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
          // Hủy lịch không cần dựng lại ngày/buổi mới — receptionist.repository.ts::updateAppointmentStatus
          // (route Lễ tân hủy đi qua) vốn không có cột nào nhận ngay_gio_bat_dau/buoi, gửi lên cũng
          // không có tác dụng. Giữ nguyên hành vi cũ (không gửi các trường này ở nhánh hủy).
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
      
      // Auto-clear staff assignment for Receptionist if old staff is busy in new slot
      if (isCurrentStaffUnavailableAtNewSlot && isReceptionist) {
        setAssignStaffId('');
        setAssignStatus('da_xac_nhan');
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
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className={`bg-white dark:bg-zinc-900 rounded-[32px] w-full flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden border border-slate-100 dark:border-zinc-800 transition-all duration-300 max-h-[90vh] relative ${isRescheduling ? 'max-w-5xl' : 'max-w-2xl'}`}
      >
        {/* Custom Confirmation Dialog Overlay */}
        {showConfirmType && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-zinc-800 text-center space-y-4"
            >
              <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                {showConfirmType === 'cancel' ? '⚠️' : '❓'}
              </div>
              
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
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
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
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
                isSendingEmail={isSendingEmail}
                handleResendEmail={handleResendEmail}
                appendCallLog={appendCallLog}
              />

              <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                  {isReceptionist ? 'Trạng thái lịch hẹn' : 'Trạng thái lịch hẹn (Quản lý)'}
                </label>
                {!isEditingStatus ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* A10c — cột LÂM SÀNG và cột THANH TOÁN tách hẳn 2 khối riêng biệt (kèm nhãn
                        và đường kẻ phân cách rõ ràng), thay vì 1 hàng dồn hết badge+nút chung một
                        chỗ — dễ đọc hơn hẳn khi cả 2 khối đều có badge + nút hành động riêng. */}
                    <div className="flex flex-col gap-1.5 sm:pr-3 sm:border-r sm:border-slate-200 dark:sm:border-zinc-750">
                      <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                        Trạng thái lịch hẹn
                      </span>
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${currentStatusInfo.color} ${hasPendingStatusChange ? 'border-dashed' : ''}`}>
                          {currentStatusInfo.icon}
                          <span>{currentStatusInfo.label}</span>
                          {hasPendingStatusChange && <span className="font-semibold opacity-70 normal-case">(chưa lưu)</span>}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {hasPendingStatusChange && (
                            <button
                              type="button"
                              onClick={handleUndoStatusChange}
                              className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-600 hover:text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-amber-200/60 dark:border-amber-800/50 shadow-2xs"
                            >
                              <Undo2 size={12} />
                              <span>Hoàn tác</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsStatusHistoryOpen(true)}
                            className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-zinc-700/50 shadow-2xs"
                            title="Lịch sử trạng thái"
                          >
                            <Clock size={12} />
                          </button>
                          {(!isReceptionist || !isReceptionistLocked) && (
                            <button
                              type="button"
                              onClick={() => setIsEditingStatus(true)}
                              className="flex items-center gap-1.5 text-[11px] font-extrabold text-teal-600 hover:text-teal-700 dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-teal-200/60 dark:border-teal-800/50 shadow-2xs"
                              title="Đổi trạng thái"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(selectedAppointment.trang_thai) && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                          Trạng thái thanh toán
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedAppointment.trang_thai_thanh_toan === 'dang_cho_thanh_toan' ? (
                            // A15 — giao dịch PayOS đang treo, chưa có webhook xác nhận: nói thật
                            // thay vì báo "Chưa thu" khiến Lễ tân/khách hoảng và thu trùng lần nữa.
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border-amber-150 dark:border-amber-900/30">
                              ⏳ Đang xác nhận thanh toán…
                            </span>
                          ) : isPaymentDue(selectedAppointment) ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border-rose-150 dark:border-rose-900/30">
                                ⚠ Chưa thu
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                                  navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                                  onClose();
                                }}
                                className="flex items-center gap-1.5 text-[11px] font-extrabold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                              >
                                <DollarSign size={12} />
                                <span>Thu tiền</span>
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 border-emerald-150 dark:border-emerald-900/30">
                              ✓ Đã thu
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Chọn trạng thái mới
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingStatus(false)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Thu gọn
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(isReceptionist
                        ? receptionistActionOptions.map(opt => ({ value: opt.value, label: opt.label }))
                        : [
                            { value: 'da_xac_nhan', label: 'Đã xác nhận' },
                            { value: 'da_checkin', label: 'Đã check-in' },
                            { value: 'dang_kham', label: 'Đang thực hiện' },
                            { value: 'cho_tai_luong_gia', label: 'Chờ tái lượng giá' },
                            { value: 'hoan_thanh', label: 'Hoàn thành' },
                            { value: 'da_huy', label: 'Đã hủy' },
                            { value: 'khong_den', label: 'Không đến' }
                          ]
                      ).map((st) => {
                        // Màu/icon mượn từ statusConfig cho đồng bộ trực quan, nhưng CHỮ luôn lấy từ
                        // st.label (nhãn hành động, vd "Xác nhận") — không lấy statusConfig[value].label
                        // (nhãn trạng thái đích), tránh lệch nghĩa giữa 2 nút cùng đại diện 1 lựa chọn
                        // (bug đã phát hiện ở bản cũ).
                        const meta = statusConfig[st.value] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
                        const isSelected = assignStatus === st.value;
                        return (
                          <button
                            key={st.value}
                            type="button"
                            onClick={() => {
                              handleStatusChange(st.value);
                              setIsEditingStatus(false);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${meta.color} ${
                              isSelected ? 'ring-2 ring-teal-500/50 font-black shadow-xs scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                            }`}
                          >
                            {meta.icon}
                            <span>{st.label}</span>
                            {isSelected && <Check size={12} className="text-teal-600 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

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
              />
            </div>

            {/* Right Column (40% width) - Live Reschedule Workspace */}
            {isRescheduling && (
              <div className="md:col-span-5 md:border-l md:border-slate-100 dark:md:border-zinc-800/80 md:pl-6 space-y-5 flex flex-col justify-start">
                <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800/40">
                  <h4 className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    Đổi lịch
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-555 font-semibold leading-relaxed">
                    Chọn ngày và buổi mới (A7 — không còn chọn giờ cụ thể)
                  </p>
                </div>

                {/* Date selector (limited to 1 month range) */}
                <div className="space-y-1.5 select-none">
                  <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Chọn ngày mới
                  </label>
                  <CustomDatePicker
                    value={rescheduleDate}
                    minDate={todayStr}
                    maxDate={maxDateStr}
                    onChange={(date) => setRescheduleDate(date)}
                    buttonClassName="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
                  />
                </div>

                {/* Chọn buổi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Chọn buổi mới
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(['sang', 'chieu'] as const).map((buoi) => {
                      const availableStaffCount = getBuoiStaffCount(buoi, rescheduleDate);
                      const isSelected = selectedBuoi === buoi;
                      const isAllowed = isBuoiAllowed(buoi);
                      const isCurrentBuoi = buoi === selectedAppointment.buoi && rescheduleDate === origDateStr;

                      let bgClass = '';
                      let textClass = '';
                      let label = '';

                      if (isCurrentBuoi) {
                        bgClass = isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                          : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400';
                        label = 'Buổi hiện tại';
                      } else if (!isAllowed) {
                        bgClass = 'bg-slate-50 dark:bg-zinc-800/10 border-slate-100 dark:border-zinc-850 opacity-40 cursor-not-allowed';
                        textClass = 'text-slate-400 dark:text-zinc-555';
                        label = 'Đã qua giờ nhận khách';
                      } else if (availableStaffCount === 0) {
                        bgClass = 'bg-slate-50 dark:bg-zinc-800/10 border-slate-150 dark:border-zinc-850 opacity-50 cursor-not-allowed';
                        textClass = 'text-slate-400 dark:text-zinc-555';
                        label = 'Hết chỗ';
                      } else if (isSelected) {
                        bgClass = 'bg-emerald-600 border-emerald-600 text-white shadow-md';
                        label = 'Buổi muốn đổi';
                      } else if (availableStaffCount === 1) {
                        bgClass = 'bg-amber-50/50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-450 hover:border-amber-400';
                        label = 'Còn 1 nhân sự';
                      } else {
                        bgClass = 'bg-emerald-50/50 dark:bg-emerald-955/15 border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-455 hover:border-emerald-400';
                        label = `Còn ${availableStaffCount} nhân sự`;
                      }

                      return (
                        <button
                          key={buoi}
                          type="button"
                          disabled={!isAllowed || (availableStaffCount === 0 && !isCurrentBuoi)}
                          onClick={() => setSelectedBuoi(buoi)}
                          className={`py-3 px-3 border rounded-xl text-left flex items-center justify-between gap-2 transition-all duration-200 active:scale-[0.99] ${bgClass} ${textClass}`}
                        >
                          <span className="font-extrabold text-xs">{BUOI_INFO[buoi].label} · {BUOI_INFO[buoi].batDau}-{BUOI_INFO[buoi].ketThuc}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider opacity-85 shrink-0">{label}</span>
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
              isReceptionistLocked={isReceptionistLocked}
              hideBilling={hideBilling}
              isAssigning={isAssigning}
              onClose={onClose}
              onSuccess={onSuccess}
              assignStaffId={assignStaffId}
              assignRoomId={assignRoomId}
              localGhiChuNoiBo={localGhiChuNoiBo}
              appointments={appointments}
            />
          </div>
        </form>
      </motion.div>

      {/* Render ngoài motion.div (đang bị framer-motion gắn transform khi animate) — StatusHistoryModal
          dùng position:fixed để phủ toàn viewport, lồng trong 1 ancestor có transform sẽ bị giới hạn
          lại trong khung modal cha thay vì full-screen. */}
      <StatusHistoryModal
        isOpen={isStatusHistoryOpen}
        onClose={() => setIsStatusHistoryOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
}
