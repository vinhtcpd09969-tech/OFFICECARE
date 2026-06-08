import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Calendar as CalendarIcon,
  CalendarDays,
  HelpCircle,
  Coffee,
  Bell,
  Settings,
  Activity,
  Command
} from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { format, addDays, subDays, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores/authStore';

// Import Components đã bóc tách
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentWeeklyCalendar from '../components/AppointmentWeeklyCalendar';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import TreatmentBookingModal from '../components/TreatmentBookingModal';
import WalkInBookingModal from '../components/WalkInBookingModal';
import CreateTreatmentRecordModal from '../components/CreateTreatmentRecordModal';
import AssignTreatmentModal from '../components/AssignTreatmentModal';

const standardTimeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

const statusConfig = {
  chua_xac_nhan: { label: 'Chưa xác nhận', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <HelpCircle size={14} /> },
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle size={14} /> },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle2 size={14} /> },
  da_checkin: { label: 'Đã Check-in', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <PlayCircle size={14} /> },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
  cho_huy: { label: 'Chờ hủy', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse', icon: <XCircle size={14} className="text-rose-600 animate-pulse" /> },
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
  khong_den: { label: 'Không đến', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <XCircle size={14} /> },
};

export default function ManageAppointments() {
  const user = useAuthStore(state => state.user);

  const [viewRole, setViewRole] = useState<'manager' | 'receptionist' | 'doctor'>(() => {
    if (user?.vai_tro_id === 4) return 'doctor';
    if (user?.vai_tro_id === 2) return 'receptionist';
    return 'manager';
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const scheduleType = 'kham_moi'; // Hardcoded cho màn hình Lịch Hẹn Khám
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [clearingBreak, setClearingBreak] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

  // Keyboard shortcut listener for Ctrl+K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCancelBreakTime = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy tất cả các lịch khám đang hoạt động nằm trong giờ nghỉ trưa (12:00–12:30) không?')) {
      return;
    }

    try {
      setClearingBreak(true);
      const res = await axiosInstance.delete('/admin/appointments/break-time');
      toast.success(res.data.message || 'Đã dọn dẹp các lịch khám trong giờ nghỉ trưa thành công.');
      fetchData();
    } catch (error: any) {
      console.error('Lỗi khi dọn lịch giờ nghỉ trưa:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi dọn dẹp lịch giờ nghỉ.');
    } finally {
      setClearingBreak(false);
    }
  };

  // Modals State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInTime, setWalkInTime] = useState<string>('');

  // Sound chime notifier for doctor
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.12);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.error('Không thể phát âm thanh thông báo:', err);
    }
  };

  const seenCheckedInIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Polling for live updates (receptionist counter registration check)
  useEffect(() => {
    const interval = setInterval(() => {
      axiosInstance.get('/admin/appointments')
        .then(res => setAppointments(res.data))
        .catch(err => console.error('Silent refresh failed:', err));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Monitor changes in check-ins and trigger chime sound for new entries
  useEffect(() => {
    if (appointments.length === 0) return;
    
    const currentCheckedInIds = appointments
      .filter(apt => apt.trang_thai === 'da_checkin')
      .map(apt => String(apt.id));

    if (isFirstLoad.current) {
      currentCheckedInIds.forEach(id => seenCheckedInIds.current.add(id));
      isFirstLoad.current = false;
    } else {
      let hasNewCheckIn = false;
      currentCheckedInIds.forEach(id => {
        if (!seenCheckedInIds.current.has(id)) {
          seenCheckedInIds.current.add(id);
          hasNewCheckIn = true;
        }
      });
      
      if (hasNewCheckIn) {
        playNotificationSound();
        toast('🔔 Bệnh nhân mới vừa check-in phòng khám!', {
          icon: '👏',
          style: {
            borderRadius: '16px',
            background: '#0d9488',
            color: '#fff',
            fontWeight: 'bold',
          },
        });
      }
    }
  }, [appointments]);

  // New states for Treatment Records (ho_so_dieu_tri)
  const [treatmentRecords, setTreatmentRecords] = useState<any[]>([]);
  const [isCreateRecordModalOpen, setIsCreateRecordModalOpen] = useState(false);
  const [activeAptForTreatmentRecord, setActiveAptForTreatmentRecord] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<any>(null);
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState<string>('');
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<string>('all');
  const [managerActiveTab, setManagerActiveTab] = useState<'treatments' | 'clinical'>('treatments');
  const [receptionistActiveTab, setReceptionistActiveTab] = useState<'calendar' | 'new_bookings' | 'final_confirm'>('calendar');
  const [cancelAptId, setCancelAptId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const prevPendingCountRef = useRef<number>(-1);

  // Assignment State in Detail Modal
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignRoomId, setAssignRoomId] = useState<string>('');
  const [assignStatus, setAssignStatus] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Treatment Booking Form State
  const [treatmentType, setTreatmentType] = useState<'single' | 'package'>('single');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedKtvId, setSelectedKtvId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [treatmentDate, setTreatmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [treatmentTime, setTreatmentTime] = useState<string>('09:00');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [aptRes, staffRes, serviceRes, packageRes, roomsRes, schedulesRes, treatmentRes] = await Promise.all([
        axiosInstance.get('/admin/appointments'),
        axiosInstance.get('/admin/staff'),
        axiosInstance.get('/admin/services'),
        axiosInstance.get('/admin/packages').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/rooms').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/schedules').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/treatment-records').catch(() => ({ data: [] }))
      ]);

      setAppointments(aptRes.data);
      setStaffList(staffRes.data);
      setServices(serviceRes.data);
      setPackages(packageRes.data || []);
      setRoomsList(roomsRes.data || []);
      setSchedulesList(schedulesRes.data || []);

      const newRecords = treatmentRes.data || [];
      setTreatmentRecords(newRecords);

      // Real-time Manager alert on new treatment records (cho_dieu_phoi)
      if (viewRole === 'manager') {
        const pendingCount = newRecords.filter((r: any) => r.trang_thai === 'cho_dieu_phoi').length;
        if (prevPendingCountRef.current !== -1 && pendingCount > prevPendingCountRef.current) {
          toast("Có hồ sơ điều trị mới cần điều phối từ Bác sĩ!", { icon: "🩺", duration: 8000 });
        }
        prevPendingCountRef.current = pendingCount;
      } else {
        prevPendingCountRef.current = -1;
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      if (!silent) toast.error('Không thể tải dữ liệu lịch hẹn');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 10-second polling for real-time alerts & automatic dashboard list updates
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [viewRole]);

  const handleUpdateAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsAssigning(true);

      let finalStatus = assignStatus;
      if ((selectedAppointment.trang_thai === 'cho_phan_phong' || selectedAppointment.trang_thai === 'chua_xac_nhan') && assignStaffId && assignRoomId) {
        finalStatus = 'cho_xac_nhan';
      }

      await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
        trang_thai: finalStatus,
        bac_si_id: assignStaffId || null,
        chuyen_gia_id: assignStaffId || null,
        phong_id: assignRoomId || null
      });

      if (finalStatus === 'da_checkin') {
        const staffName = staffList.find(s => String(s.ky_thuat_vien_id || s.id) === String(assignStaffId))?.ho_ten || 'Bác sĩ';
        const roomName = roomsList.find(r => String(r.id) === String(assignRoomId))?.ten_phong || 'Phòng khám';
        toast.success(`Check-in thành công! Hãy hướng dẫn khách di chuyển đến ${roomName} gặp ${staffName}.`, { icon: '🛎️', duration: 8000 });
      } else {
        toast.success('Cập nhật ca khám y khoa thành công');
      }

      setIsDetailModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Lỗi cập nhật thông tin ca khám');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBookTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    const chosenServiceId = treatmentType === 'single' ? selectedServiceId : null;
    const chosenPackageId = treatmentType === 'package' ? selectedPackageId : null;

    if (treatmentType === 'single' && !chosenServiceId) { toast.error('Vui lòng chọn dịch vụ linh động'); return; }
    if (treatmentType === 'package' && !chosenPackageId) { toast.error('Vui lòng chọn liệu trình'); return; }
    if (!selectedKtvId) { toast.error('Vui lòng chọn Chuyên gia y tế'); return; }

    try {
      setBookingLoading(true);

      let durationMin = 60; // default to 60 mins
      if (treatmentType === 'single') {
        const service = services.find(s => String(s.id) === String(chosenServiceId));
        if (service) {
          durationMin = Number(service.thoi_luong_phut) || 60;
        }
      } else {
        const pkg = packages.find(p => String(p.id) === String(chosenPackageId));
        if (pkg && pkg.chi_tiet_dich_vu) {
          let items: any[] = [];
          try {
            items = typeof pkg.chi_tiet_dich_vu === 'string' 
              ? JSON.parse(pkg.chi_tiet_dich_vu) 
              : pkg.chi_tiet_dich_vu;
          } catch (e) {
            console.error('Lỗi parse chi_tiet_dich_vu:', e);
          }
          if (Array.isArray(items)) {
            let sum = 0;
            items.forEach(item => {
              const svc = services.find(s => String(s.id) === String(item.dich_vu_id));
              if (svc) {
                sum += Number(svc.thoi_luong_phut) || 0;
              }
            });
            if (sum > 0) {
              durationMin = sum;
            }
          }
        }
      }

      // Chuyển đổi giờ cục bộ (VN UTC+7) sang UTC đúng chuẩn
      const startDateTimeStr = new Date(`${treatmentDate}T${treatmentTime}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTimeStr).getTime() + durationMin * 60 * 1000);

      const payload = {
        khach_hang_id: selectedAppointment.khach_hang_id,
        ho_ten_khach: selectedAppointment.khach_hang_id ? undefined : selectedAppointment.ten_khach_hang,
        so_dien_thoai: selectedAppointment.khach_hang_id ? undefined : selectedAppointment.so_dien_thoai,
        dich_vu_id: chosenServiceId || null,
        ky_thuat_vien_id: selectedKtvId,
        phong_id: selectedRoomId || null,
        ghi_chu_dat_lich: `Ca trị liệu khởi tạo từ Lịch khám: ${selectedAppointment.ma_lich_dat}`,
        ngay_gio_bat_dau: startDateTimeStr,
        ngay_gio_ket_thuc: endDateTime.toISOString(),
        loai_lich: 'dieu_tri',
        dang_ky_goi_id: chosenPackageId,
        lich_dat_id: selectedAppointment.id
      };

      await axiosInstance.post('/admin/appointments', payload);
      toast.success('Lên lịch ca điều trị thành công!');
      setIsTreatmentModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo ca điều trị');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    // Enforce safeguard: Check if treatment record has been created for this appointment
    const hasRecord = treatmentRecords.some(r => r.lich_dat_id === appointmentId);
    if (!hasRecord) {
      toast.error("Vui lòng click '🩺 Lên phác đồ' để tạo hồ sơ điều trị trước khi hoàn thành ca khám!");
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn hoàn thành ca khám lâm sàng này?')) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'hoan_thanh'
      });
      toast.success('Đã hoàn thành ca khám lâm sàng thành công!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi hoàn thành ca khám: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewBooking = async (appointmentId: string) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'cho_phan_phong'
      });
      toast.success('Đã gọi xác nhận và chuyển qua cho Quản lý xếp lịch!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi chuyển Quản lý: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFinalConfirmBooking = async (appointmentId: string) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'da_xac_nhan'
      });
      toast.success('Xác nhận lịch khám thành công!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xác nhận lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelRequest = async (appointmentId: string, lyDo: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xác nhận hủy lịch hẹn này theo yêu cầu của khách hàng?')) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, {
        trang_thai: 'da_huy',
        ly_do_huy: lyDo
      });
      toast.success('Đã xác nhận hủy lịch hẹn thành công!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi hủy lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBookingPrompt = (appointmentId: string) => {
    setCancelAptId(appointmentId);
    setCancelReasonInput('');
    setIsCancelModalOpen(true);
  };

  const handleCancelBookingSubmit = async () => {
    if (!cancelAptId || !cancelReasonInput.trim()) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/admin/appointments/${cancelAptId}/status`, {
        trang_thai: 'da_huy',
        ly_do_huy: cancelReasonInput.trim()
      });
      toast.success('Đã hủy lịch hẹn thành công!');
      setIsCancelModalOpen(false);
      setCancelAptId(null);
      setCancelReasonInput('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi hủy lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTreatmentRecordSubmit = async (payload: any) => {
    try {
      await axiosInstance.post('/admin/treatment-records', payload);
      toast.success('Tạo hồ sơ điều trị thành công!');
      setIsCreateRecordModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi tạo hồ sơ điều trị: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignTreatmentSubmit = async (ktvId: string, roomId: string) => {
    if (!selectedRecordForAssign) return;
    try {
      await axiosInstance.patch(`/admin/treatment-records/${selectedRecordForAssign.id}/assign`, {
        ky_thuat_vien_id: ktvId,
        phong_tri_lieu_id: Number(roomId)
      });
      toast.success('Điều phối kỹ thuật viên và phòng trị liệu thành công!');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi điều phối trị liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (direction === 'next') {
      setSelectedDate(prev => viewMode === 'week' ? addDays(prev, 7) : addDays(prev, 1));
    } else {
      setSelectedDate(prev => viewMode === 'week' ? subDays(prev, 7) : subDays(prev, 1));
    }
  };


  const activeRole = 'Bác sĩ';
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  const startDateOfWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const endDateOfWeek = addDays(startDateOfWeek, 6);

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    let matchDate = false;

    if (viewMode === 'today') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      matchDate = aptDateStr === formattedSelectedDate;
    } else {
      matchDate = aptDate >= startDateOfWeek && aptDate <= new Date(endDateOfWeek.setHours(23, 59, 59, 999));
    }

    const matchType = apt.loai_lich === scheduleType || apt.loai_lich === 'dich_vu_don';
    const matchRoom = roomFilter === 'all' || String(apt.phong_id) === roomFilter;
    const matchSearch = searchTerm === '' ||
      apt.ma_lich_dat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());

    const hideUnconfirmed = viewRole === 'receptionist' || viewRole === 'doctor';
    if (hideUnconfirmed && (apt.trang_thai === 'chua_xac_nhan' || apt.trang_thai === 'cho_xac_nhan' || apt.trang_thai === 'cho_phan_phong')) {
      return false;
    }

    return matchDate && matchType && matchRoom && matchSearch;
  });

  const pendingClinicalAppointments = appointments.filter(apt =>
    apt.loai_lich === 'kham_moi' &&
    apt.trang_thai === 'cho_phan_phong' &&
    (!apt.ky_thuat_vien_id || !apt.phong_id)
  );

  const receptionistNewBookings = appointments.filter(apt =>
    apt.loai_lich === 'kham_moi' &&
    (apt.trang_thai === 'cho_xac_nhan' || apt.trang_thai === 'cho_huy') &&
    apt.ky_thuat_vien_id === null &&
    apt.phong_id === null
  );

  const receptionistFinalConfirmBookings = appointments.filter(apt =>
    apt.loai_lich === 'kham_moi' &&
    (apt.trang_thai === 'cho_xac_nhan' || apt.trang_thai === 'cho_huy') &&
    apt.ky_thuat_vien_id !== null &&
    apt.phong_id !== null
  );

  // KPI Metrics calculation
  const dailyAppointments = appointments.filter(apt => {
    const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
    const matchType = apt.loai_lich === scheduleType || apt.loai_lich === 'dich_vu_don';
    return aptDateStr === formattedSelectedDate && matchType;
  });

  const kpis = {
    total: viewMode === 'today' ? dailyAppointments.length : filteredAppointments.length,
    waiting: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'cho_xac_nhan' || a.trang_thai === 'cho_huy').length,
    completed: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'hoan_thanh').length,
    cancelled: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'da_huy' || a.trang_thai === 'khong_den').length,
  };




  const unconfirmedAppointments = appointments
    .filter(apt => apt.trang_thai === 'chua_xac_nhan')
    .sort((a, b) => new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime());

  // Tính toán phụ tải làm việc của từng bác sĩ trong ngày
  const doctorWorkloads = staffList
    .filter(s => s.vai_tro === 'Bác sĩ')
    .map(doc => {
      const docSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(doc.id) && 
        s.ngay === formattedSelectedDate &&
        s.trang_thai === 'hoat_dong'
      );
      const hasShift = docSchedules.length > 0;
      
      const docApts = appointments.filter(apt => 
        (apt.bac_si_id === doc.chuyen_gia_id || apt.chuyen_gia_id === doc.chuyen_gia_id) &&
        format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd') === formattedSelectedDate &&
        apt.trang_thai !== 'da_huy' &&
        apt.trang_thai !== 'khong_den'
      );

      const maxSlots = 16;
      const occupiedCount = docApts.length;
      const percentage = maxSlots > 0 ? Math.min(Math.round((occupiedCount / maxSlots) * 100), 100) : 0;

      return {
        id: doc.id,
        chuyen_gia_id: doc.chuyen_gia_id,
        name: doc.ho_ten,
        hasShift,
        occupiedCount,
        maxSlots,
        percentage
      };
    });

  // Cấu hình danh sách lệnh cho Command Palette (Ctrl+K)
  const commandShortcuts = [
    {
      id: 'view_today',
      name: 'Xem Lịch trình Hôm nay',
      icon: <CalendarIcon size={14} />,
      shortcut: 'T',
      action: () => setViewMode('today')
    },
    {
      id: 'view_week',
      name: 'Xem Lịch trình Tuần này',
      icon: <CalendarDays size={14} />,
      shortcut: 'W',
      action: () => setViewMode('week')
    },
    {
      id: 'walk_in',
      name: 'Đăng ký Khách vãng lai (Walk-In)',
      icon: <Activity size={14} />,
      shortcut: 'N',
      action: () => {
        setWalkInTime('09:00');
        setIsWalkInModalOpen(true);
      }
    },
    {
      id: 'clear_break',
      name: 'Hủy các lịch hẹn trong giờ nghỉ trưa',
      icon: <Coffee size={14} />,
      shortcut: 'D',
      action: () => handleCancelBreakTime()
    },
    {
      id: 'toggle_theme',
      name: 'Chuyển đổi giao diện Sáng / Tối',
      icon: <Settings size={14} />,
      shortcut: 'L',
      action: () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
        window.dispatchEvent(new Event('theme-change'));
      }
    }
  ];

  const filteredCommands = commandShortcuts.filter(cmd =>
    cmd.name.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredApts = commandSearch.trim() === '' ? [] : appointments.filter(apt =>
    apt.ten_khach_hang.toLowerCase().includes(commandSearch.toLowerCase()) ||
    apt.ma_lich_dat.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const handleOpenDetailModal = (apt: any) => {
    setSelectedAppointment(apt);
    setAssignStatus(apt.trang_thai);
    setAssignStaffId(apt.bac_si_id || apt.chuyen_gia_id || '');
    setAssignRoomId(apt.phong_id ? String(apt.phong_id) : '');
    setIsDetailModalOpen(true);
  };

  const handleOpenTreatmentModal = (type: 'single' | 'package' | null = null, recId: string | null = null) => {
    if (!selectedAppointment) return;
    setIsDetailModalOpen(false);
    setTreatmentType(type || 'single');
    setSelectedServiceId(type === 'single' && recId ? recId : '');
    setSelectedPackageId(type === 'package' && recId ? recId : '');
    setSelectedKtvId('');
    setSelectedRoomId('');
    setTreatmentDate(format(new Date(), 'yyyy-MM-dd'));
    setTreatmentTime('10:00');
    setIsTreatmentModalOpen(true);
  };

  const handleBookWalkIn = async (payload: any) => {
    try {
      setBookingLoading(true);
      await axiosInstance.post('/admin/appointments', payload);
      toast.success('Đăng ký khách vãng lai thành công. Ca khám đã được Check-in!');
      setIsWalkInModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo ca khám vãng lai');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleUpdateAppointmentFields = async (appointmentId: string, updatedFields: any) => {
    try {
      await axiosInstance.patch(`/admin/appointments/${appointmentId}/status`, updatedFields);
      toast.success('Đã cập nhật phân bổ lịch trình');
      fetchData();
    } catch (error: any) {
      console.error('Lỗi khi điều phối kéo thả:', error);
      toast.error(error.response?.data?.message || 'Bác sĩ hoặc phòng đã bị trùng vào khung giờ này.');
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600 border-r-2 border-emerald-200 dark:border-t-emerald-400"></div>
        <p className="text-slate-500 dark:text-zinc-400 font-medium text-sm">Đang đồng bộ hóa hệ thống lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* ROLE SWITCHER FOR ADMIN */}
      {user?.vai_tro_id === 5 && (
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-150/80 shadow-xs flex flex-wrap items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 px-2">
            👁️ Chế độ xem vai trò (Admin):
          </span>
          <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-200/60">
            <button
              onClick={() => setViewRole('manager')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewRole === 'manager'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-105'
                }`}
            >
              💼 Quản lý
            </button>
            <button
              onClick={() => setViewRole('receptionist')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewRole === 'receptionist'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-105'
                }`}
            >
              📅 Lễ tân
            </button>
            <button
              onClick={() => setViewRole('doctor')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewRole === 'doctor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-105'
                }`}
            >
              🩺 Bác sĩ
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="text-emerald-700 dark:text-emerald-450" size={28} />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2.5">
              {viewRole === 'doctor' && 'Màn hình Khám bệnh của Bác sĩ'}
              {viewRole === 'receptionist' && 'Màn hình điều phối của Lễ tân'}
              {viewRole === 'manager' && 'Màn hình Quản lý Hồ sơ Điều trị'}
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700 font-semibold select-none">
                <Command size={10} /> K
              </span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">
            {viewRole === 'doctor' && 'Theo dõi danh sách bệnh nhân chờ khám và lên phác đồ điều trị.'}
            {viewRole === 'receptionist' && 'Tiếp đón khách hàng, cập nhật trạng thái check-in và xử lý yêu cầu hủy lịch.'}
            {viewRole === 'manager' && 'Quản lý và điều phối các hồ sơ điều trị nhận từ bác sĩ chuyên khoa.'}
          </p>
        </div>

        {viewRole !== 'manager' && (
          <div className="flex items-center bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 p-1 justify-between select-none transition-colors duration-300">
            <button onClick={() => handleNavigateDay('prev')} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-350 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="px-5 text-sm font-semibold text-slate-700 dark:text-zinc-200 text-center min-w-[180px] md:min-w-[220px]">
              {viewMode === 'today'
                ? format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })
                : `Tuần: ${format(startDateOfWeek, 'dd/MM')} - ${format(endDateOfWeek, 'dd/MM/yyyy')}`
              }
            </div>
            <button onClick={() => handleNavigateDay('next')} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-350 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* UNCONFIRMED APPOINTMENTS ALERT WIDGET */}
      <AnimatePresence>
        {unconfirmedAppointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleOpenDetailModal(unconfirmedAppointments[0])}
            className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-600/5 hover:from-amber-500/15 hover:to-amber-600/10 border border-amber-500/20 dark:border-amber-900/30 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 group shadow-sm active:scale-[0.99] overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/10 font-black shrink-0 animate-pulse">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 font-jakarta flex items-center gap-2">
                  Còn <span className="text-amber-650 dark:text-amber-450 font-black text-base">{unconfirmedAppointments.length}</span> lịch hẹn mới chưa được xác nhận
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                  Lịch tiếp theo: <span className="font-extrabold text-[#0f172a] dark:text-zinc-100 capitalize">{unconfirmedAppointments[0].ten_khach_hang}</span> lúc <span className="font-extrabold text-amber-700 dark:text-amber-450 bg-amber-55 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/20 px-1.5 py-0.5 rounded">{format(new Date(unconfirmedAppointments[0].ngay_gio_bat_dau), 'HH:mm - dd/MM/yyyy')}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-500/20 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shrink-0"
            >
              Phân bổ ngay →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI METRIC CARDS */}
      {viewRole !== 'manager' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
            <span className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tổng số ca khám</span>
            <div className="flex justify-between items-end mt-3">
              <div>
                <span className="text-4xl font-black text-slate-800 dark:text-zinc-100">{kpis.total}</span>
                <span className="text-[10px] text-emerald-500 dark:text-emerald-450 font-bold block mt-1">+14.2% hôm nay</span>
              </div>
              <div className="pb-1">
                <svg className="w-16 h-8 text-emerald-500 dark:text-emerald-450" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 25C15 23 30 15 45 18C60 21 75 5 100 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
            <span className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Chờ xử lý</span>
            <div className="flex justify-between items-end mt-3">
              <div>
                <span className="text-4xl font-black text-amber-600 dark:text-amber-550">{kpis.waiting}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold block mt-1">Cần điều phối gấp</span>
              </div>
              <div className="pb-1">
                <svg className="w-16 h-8 text-amber-550 dark:text-amber-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 20C15 15 30 25 45 10C60 5 75 18 100 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
            <span className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Đã hoàn thành</span>
            <div className="flex justify-between items-end mt-3">
              <div>
                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500">{kpis.completed}</span>
                <span className="text-[10px] text-emerald-555 dark:text-emerald-450 font-bold block mt-1">+8 ca phục hồi</span>
              </div>
              <div className="pb-1">
                <svg className="w-16 h-8 text-emerald-500 dark:text-emerald-450" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 28C15 25 30 18 45 12C60 14 75 5 100 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
            <span className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Hủy / Vắng mặt</span>
            <div className="flex justify-between items-end mt-3">
              <div>
                <span className="text-4xl font-black text-rose-600 dark:text-rose-500">{kpis.cancelled}</span>
                <span className="text-[10px] text-rose-500 dark:text-rose-455 font-bold block mt-1">Giảm 5% so với tuần trước</span>
              </div>
              <div className="pb-1">
                <svg className="w-16 h-8 text-rose-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 5C15 10 30 5 45 12C60 18 75 8 100 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HÀNG ĐỢI LÂM SÀNG: BỆNH NHÂN ĐÃ CHECK-IN ĐANG CHỜ KHÁM (DOCTOR ONLY) */}
      {viewRole === 'doctor' && appointments.some(apt => apt.trang_thai === 'da_checkin') && (
        <div className="bg-[#E6F4F1] dark:bg-emerald-950/20 border border-primary/20 dark:border-emerald-800/30 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-primary dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Hàng đợi lâm sàng: Bệnh nhân đã check-in đang chờ khám
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments
              .filter(apt => apt.trang_thai === 'da_checkin')
              .map(apt => (
                <div key={apt.id} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex flex-col justify-between gap-3 relative hover:border-primary/45 hover:shadow-sm transition-all duration-200">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[9px] font-black text-primary dark:text-emerald-400 bg-primary/10 dark:bg-emerald-500/10 border border-primary/20 dark:border-emerald-800/30 px-2.5 py-0.5 rounded-md">
                        {apt.ma_lich_dat}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-555 font-bold font-mono">
                        {(() => {
                          try {
                            const d = new Date(apt.ngay_gio_bat_dau);
                            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return '';
                          }
                        })()}
                      </span>
                    </div>
                    <h4 className="font-bold text-secondary dark:text-zinc-100 text-sm">{apt.ten_khach_hang}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
                      Triệu chứng: <span className="font-medium italic text-zinc-650 dark:text-zinc-300">"{apt.ly_do_kham || 'Không mô tả triệu chứng'}"</span>
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {apt.ten_phong && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-455 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-md">
                          Phòng: {apt.ten_phong}
                        </span>
                      )}
                      {apt.ten_ky_thuat_vien && (
                        <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                          Bác sĩ: {apt.ten_ky_thuat_vien}
                        </span>
                      )}
                    </div>
                  </div>
                  {treatmentRecords.some(r => r.lich_dat_id === apt.id) ? (
                    <button
                      type="button"
                      disabled
                      className="w-full mt-2 py-2 bg-emerald-100 dark:bg-emerald-955/40 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      ✓ Đã Lên Phác Đồ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAptForTreatmentRecord(apt);
                        setIsCreateRecordModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      🩺 Khám & Lên Phác Đồ
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* PENDING CANCELLATION ALERTS (RECEPTIONIST ONLY) */}
      {viewRole === 'receptionist' && appointments.some(apt => apt.trang_thai === 'cho_huy') && (
        <div className="bg-rose-50 dark:bg-rose-955/10 border-l-4 border-rose-600 p-4 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-sm">
            <AlertCircle className="text-rose-600 animate-bounce" size={18} />
            CẢNH BÁO: CÓ YÊU CẦU HỦY LỊCH HẸN CẦN XÁC MINH
          </div>
          <div className="divide-y divide-rose-100 dark:divide-rose-900/30 max-h-40 overflow-y-auto">
            {appointments
              .filter(apt => apt.trang_thai === 'cho_huy')
              .map(apt => (
                <div key={apt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-800 dark:text-zinc-200">
                    <span className="font-extrabold text-rose-700 dark:text-rose-400">[{apt.ma_lich_dat}]</span>{' '}
                    Khách hàng <span className="font-bold">{apt.ten_khach_hang}</span> ({apt.so_dien_thoai})
                    yêu cầu hủy lịch khám lúc <span className="font-bold">{format(new Date(apt.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy')}</span>.
                    <span className="block text-slate-500 dark:text-zinc-400 mt-0.5 italic">Lý do: "{apt.ly_do_huy || 'Không có lý do chi tiết'}"</span>
                  </div>
                  <button
                    onClick={() => handleOpenDetailModal(apt)}
                    className="self-start sm:self-center bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
                  >
                    Xử lý ngay
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RECEPTIONIST VIEW - CALENDAR & QUEUES */}
      {viewRole === 'receptionist' && (
        <div className="space-y-6">
          {/* RECEPTIONIST TABS */}
          <div className="flex border-b border-zinc-250 dark:border-zinc-800">
            <button
              onClick={() => setReceptionistActiveTab('calendar')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                receptionistActiveTab === 'calendar'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-655 dark:hover:text-zinc-300'
              }`}
            >
              📅 Lịch trình hôm nay
            </button>
            <button
              onClick={() => setReceptionistActiveTab('new_bookings')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                receptionistActiveTab === 'new_bookings'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-655 dark:hover:text-zinc-300'
              }`}
            >
              📞 Ca khám mới chờ liên hệ ({receptionistNewBookings.length})
            </button>
            <button
              onClick={() => setReceptionistActiveTab('final_confirm')}
              className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                receptionistActiveTab === 'final_confirm'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-655 dark:hover:text-zinc-300'
              }`}
            >
              ✓ Chờ xác nhận lịch xếp ({receptionistFinalConfirmBookings.length})
            </button>
          </div>

          {/* TAB 1: CALENDAR */}
          {receptionistActiveTab === 'calendar' && (
            <div className="space-y-6">
              {/* FILTER CONTROLS BAR */}
              <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800/80 p-2 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between transition-colors duration-300">
                <div className="flex bg-slate-50 dark:bg-zinc-800/50 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('today')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      viewMode === 'today'
                        ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-zinc-600/30'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <CalendarIcon size={18} /> Hôm nay
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      viewMode === 'week'
                        ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-zinc-600/30'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <CalendarDays size={18} /> Tuần này
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:justify-end">
                  <button
                    onClick={handleCancelBreakTime}
                    disabled={clearingBreak}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-955/20 hover:bg-amber-105 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-900/30 disabled:opacity-50 transition-colors text-sm font-semibold text-amber-700 dark:text-amber-400 rounded-xl shrink-0 shadow-sm"
                  >
                    <Coffee size={16} className={clearingBreak ? 'animate-bounce' : ''} />
                    {clearingBreak ? 'Đang dọn lịch...' : 'Dọn lịch giờ nghỉ'}
                  </button>

                  <button onClick={() => handleNavigateDay('today')} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm font-semibold text-slate-755 dark:text-zinc-350 rounded-xl shrink-0">
                    Trở về Hiện tại
                  </button>

                  <div className="relative shrink-0">
                    <select
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 text-slate-800 dark:text-zinc-250 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    >
                      <option value="all">Tất cả Phòng khám</option>
                      {roomsList
                        .filter(room => room.loai_phong === 'kham_benh')
                        .map(room => (
                          <option key={room.id} value={room.id}>{room.ten_phong}</option>
                        ))}
                    </select>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550" size={16} />
                  </div>

                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm bệnh nhân, mã lịch..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 rounded-xl text-sm text-slate-800 dark:text-zinc-150 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                  </div>
                </div>
              </div>

              {/* OPERATIONS GRID: TIMELINE & WORKLOAD SIDEBAR */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Area: Scheduling Board */}
                <div className="flex-1 w-full min-w-0">
                  {viewMode === 'today' ? (
                    <AppointmentCalendar
                      timeSlots={standardTimeSlots}
                      appointments={filteredAppointments}
                      statusConfig={statusConfig}
                      handleOpenDetailModal={handleOpenDetailModal}
                      roomsList={roomsList}
                      staffList={staffList}
                      schedulesList={schedulesList}
          hideBilling={viewRole === 'doctor'}

        />
      )}

      {/* COMPONENT: MODAL ĐẶT LỊCH ĐIỀU TRỊ CHUYÊN SÂU */}
      {isTreatmentModalOpen && (
        <TreatmentBookingModal
          selectedAppointment={selectedAppointment}
          services={services}
          packages={packages}
          staffList={staffList}
          roomsList={roomsList}
          treatmentType={treatmentType}
          setTreatmentType={setTreatmentType}
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          selectedPackageId={selectedPackageId}
          setSelectedPackageId={setSelectedPackageId}
          selectedKtvId={selectedKtvId}
          setSelectedKtvId={setSelectedKtvId}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          treatmentDate={treatmentDate}
          setTreatmentDate={setTreatmentDate}
          treatmentTime={treatmentTime}
          setTreatmentTime={setTreatmentTime}
          bookingLoading={bookingLoading}
          onClose={() => setIsTreatmentModalOpen(false)}
          onSubmit={handleBookTreatment}
        />
      )}

{/* COMPONENT: MODAL ĐĂNG KÝ KHÁM VÃNG LAI */}
      {isWalkInModalOpen && (
        <WalkInBookingModal
          roomsList={roomsList}
          staffList={staffList}
          appointments={appointments}
          schedulesList={schedulesList}
          onClose={() => setIsWalkInModalOpen(false)}
          onSubmitApi={handleBookWalkIn}
          bookingLoading={bookingLoading}
          initialTime={walkInTime}
        />
      )}

      {/* COMMAND PALETTE (CTRL+K) */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 dark:bg-zinc-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header search bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800">
                <Command className="text-slate-400 dark:text-zinc-505" size={18} />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân, tác vụ hoặc gõ lệnh..."
                  value={commandSearch}
                  onChange={e => setCommandSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-zinc-150 text-sm placeholder-slate-400 dark:placeholder-zinc-550"
                  autoFocus
                />
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700">
                  ESC
                </span>
              </div>

              {/* Results list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Filtered actions & shortcuts */}
                {filteredCommands.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1.5">
                      Tác vụ & Phím tắt
                    </p>
                    {filteredCommands.map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsCommandPaletteOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs font-semibold text-slate-750 dark:text-zinc-350 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 group-hover:text-primary dark:text-zinc-500 transition-colors">
                            {cmd.icon}
                          </span>
                          <span>{cmd.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {cmd.shortcut}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Filtered Appointments */}
                {commandSearch.trim() !== '' && filteredApts.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1.5 border-t border-slate-50 dark:border-zinc-800/50">
                      Lịch hẹn khớp tìm kiếm
                    </p>
                    {filteredApts.map(apt => (
                      <button
                        key={apt.id}
                        onClick={() => {
                          handleOpenDetailModal(apt);
                          setIsCommandPaletteOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 dark:text-zinc-100">
                            {apt.ten_khach_hang}
                          </span>
                          <span className="text-[10px] text-slate-450 dark:text-zinc-400">
                            {apt.ten_dich_vu}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="font-mono text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400">
                            {apt.ma_lich_dat}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                            {format(new Date(apt.ngay_gio_bat_dau), 'HH:mm dd/MM')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {commandSearch.trim() !== '' && filteredApts.length === 0 && filteredCommands.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs italic">
                    Không tìm thấy kết quả phù hợp...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPONENT: TẠO HỒ SƠ ĐIỀU TRỊ (DOCTOR) */}
      {isCreateRecordModalOpen && activeAptForTreatmentRecord && (
        <CreateTreatmentRecordModal
          selectedAppointment={activeAptForTreatmentRecord}
          roomsList={roomsList}
          staffList={staffList}
          packages={packages}
          onClose={() => {
            setIsCreateRecordModalOpen(false);
            setActiveAptForTreatmentRecord(null);
          }}
          onSubmit={handleCreateTreatmentRecordSubmit}
        />
      )}

      {/* COMPONENT: ĐIỀU PHỐI KTV & PHÒNG TRỊ LIỆU (MANAGER) */}
      {isAssignModalOpen && selectedRecordForAssign && (
        <AssignTreatmentModal
          record={selectedRecordForAssign}
          staffList={staffList}
          roomsList={roomsList}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedRecordForAssign(null);
          }}
          onSubmit={handleAssignTreatmentSubmit}
        />
      )}

      {/* COMPONENT: DIALOG HỦY LỊCH HẸN CHUYÊN NGHIỆP */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150 dark:border-zinc-800 max-w-md w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-heading font-black text-secondary dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={16} />
                Yêu cầu hủy lịch khám
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-full transition-all"
              >
                <XCircle size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-semibold">
              Vui lòng nhập lý do hủy lịch để cập nhật hệ thống và gửi thông báo đến khách hàng:
            </p>

            <textarea
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: Khách bận đột xuất, Số điện thoại không liên lạc được...)"
              rows={3}
              className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-200"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelBookingSubmit}
                disabled={!cancelReasonInput.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-rose-600/10 uppercase tracking-wider font-bold"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
