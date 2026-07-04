import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../../../stores/authStore';
import axiosInstance from '../../../../../api/axios';

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
  onSave: (e: React.FormEvent) => void;
  onOpenTreatment?: (type?: 'single' | 'package', recId?: string) => void;
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
  isReceptionistOverride
}: AppointmentDetailModalProps) {
  const { user } = useAuthStore();
  
  const isReceptionist = isReceptionistOverride !== undefined 
    ? isReceptionistOverride 
    : (Number(user?.vai_tro_id) === 2);
    
  const targetRole = selectedAppointment?.loai_lich === 'kham_moi' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const [localGhiChuNoiBo, setLocalGhiChuNoiBo] = useState<string>(selectedAppointment?.ghi_chu_noi_bo || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const resolvedRoom = roomsList.find(r => String(r.id) === String(assignRoomId));
  const resolvedRoomName = resolvedRoom?.ten_phong || selectedAppointment.ten_phong || 'Chưa chỉ định';
  const isUnconfirmedState = isReceptionist && ['cho_xac_nhan', 'chua_xac_nhan'].includes(selectedAppointment.trang_thai);

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

  const overlappingApts = appointments.filter(apt => 
    apt.id !== selectedAppointment.id && 
    apt.trang_thai !== 'da_huy' &&
    apt.trang_thai !== 'khong_den' &&
    isOverlapping(currentStart, currentEnd, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
  );

  const occupiedStaffIds = overlappingApts.map(apt => apt.bac_si_id || apt.chuyen_gia_id).filter(Boolean);

  // Phân tích ca trực của nhân viên ngày hôm nay
  const aptDate = new Date(selectedAppointment.ngay_gio_bat_dau);
  const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
  
  const getLocalTimeStr = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const aptStartHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_bat_dau);
  const aptEndHourStr = getLocalTimeStr(selectedAppointment.ngay_gio_ket_thuc);

  // Tự động phân phòng dựa trên ca trực của nhân viên khi gán
  useEffect(() => {
    if (!assignStaffId) return;

    const staffSchedule = (schedulesList || []).find(s => 
      String(s.nguoi_dung_id) === String(assignStaffId) &&
      s.ngay === aptDateStr &&
      s.trang_thai === 'hoat_dong' &&
      s.gio_bat_dau.substring(0, 5) <= aptStartHourStr &&
      s.gio_ket_thuc.substring(0, 5) >= aptEndHourStr
    );

    if (staffSchedule && staffSchedule.phong_id) {
      setAssignRoomId(String(staffSchedule.phong_id));
    }
  }, [assignStaffId, schedulesList, aptDateStr, aptStartHourStr, aptEndHourStr, setAssignRoomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!['da_huy', 'khong_den', 'chua_xac_nhan', 'cho_xac_nhan', 'cho_huy'].includes(assignStatus)) {
      if (!assignRoomId) {
        toast.error('Vui lòng chọn phòng thực hiện!');
        return;
      }
      if (!assignStaffId) {
        toast.error(
          targetRole === 'Bác sĩ' 
            ? 'Vui lòng chọn Bác sĩ phụ trách!' 
            : 'Vui lòng chọn Kỹ thuật viên phụ trách!'
        );
        return;
      }
    }

    if (assignStatus === 'da_huy') {
      const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?');
      if (!confirmCancel) return;

      const reason = window.prompt('Vui lòng nhập lý do hủy lịch hẹn:');
      if (reason === null) return;
      
      const trimmedReason = reason.trim();
      if (!trimmedReason) {
        toast.error('Vui lòng nhập lý do hủy lịch!');
        return;
      }

      if (setCancelReason) {
        setCancelReason(trimmedReason);
      }
    } else {
      const confirmSave = window.confirm('Bạn có chắc chắn muốn lưu thay đổi trạng thái của lịch hẹn này không?');
      if (!confirmSave) return;
    }
    
    onSave(e);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-955/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-zinc-800 transition-colors duration-300">
        
        <DetailHeader
          maLichDat={selectedAppointment.ma_lich_dat}
          tenKhachHang={selectedAppointment.ten_khach_hang}
          soDienThoai={selectedAppointment.so_dien_thoai}
          ngayGioBatDau={selectedAppointment.ngay_gio_bat_dau}
          aptStartHourStr={aptStartHourStr}
          aptEndHourStr={aptEndHourStr}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-thin">
          
          <TreatmentHistory
            loaiLich={selectedAppointment.loai_lich}
            chanDoan={selectedAppointment.chan_doan}
            chongChiDinh={selectedAppointment.chong_chi_dinh}
          />

          <SymptomNotes
            selectedAppointment={selectedAppointment}
            isUnconfirmedState={isUnconfirmedState}
            isSendingEmail={isSendingEmail}
            handleResendEmail={handleResendEmail}
            appendCallLog={appendCallLog}
            localGhiChuNoiBo={localGhiChuNoiBo}
            setLocalGhiChuNoiBo={setLocalGhiChuNoiBo}
          />

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
            aptDateStr={aptDateStr}
            aptStartHourStr={aptStartHourStr}
            aptEndHourStr={aptEndHourStr}
            occupiedStaffIds={occupiedStaffIds}
          />

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
          />

        </form>
      </div>
    </div>
  );
}
