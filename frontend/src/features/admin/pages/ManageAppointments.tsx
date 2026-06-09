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

// Import Components đã bóc tách
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentWeeklyCalendar from '../components/AppointmentWeeklyCalendar';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import TreatmentBookingModal from '../components/TreatmentBookingModal';
import WalkInBookingModal from '../components/WalkInBookingModal';

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
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
  khong_den: { label: 'Không đến', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <XCircle size={14} /> },
};

export default function ManageAppointments() {
  const location = useLocation();
  const isReceptionist = location.pathname.startsWith('/receptionist');

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, staffRes, serviceRes, packageRes, roomsRes, schedulesRes] = await Promise.all([
        axiosInstance.get('/admin/appointments'),
        axiosInstance.get('/admin/staff'),
        axiosInstance.get('/admin/services'),
        axiosInstance.get('/admin/packages').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/rooms').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/schedules').catch(() => ({ data: [] }))
      ]);

      setAppointments(aptRes.data);
      setStaffList(staffRes.data);
      setServices(serviceRes.data);
      setPackages(packageRes.data || []);
      setRoomsList(roomsRes.data || []);
      setSchedulesList(schedulesRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsAssigning(true);
      
      let finalStatus = assignStatus;
      if (selectedAppointment.trang_thai === 'chua_xac_nhan' && assignStaffId && assignRoomId) {
        finalStatus = 'cho_xac_nhan';
      }

      await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
        trang_thai: finalStatus,
        bac_si_id: assignStaffId || null,
        chuyen_gia_id: assignStaffId || null,
        phong_id: assignRoomId || null
      });

      toast.success('Cập nhật thông tin ca trực thành công');
      setIsDetailModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Lỗi cập nhật ca trực');
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

    if (isReceptionist && apt.trang_thai !== 'cho_xac_nhan') {
      return false;
    }

    return matchDate && matchType && matchRoom && matchSearch;
  });

  // KPI Metrics calculation
  const dailyAppointments = appointments.filter(apt => {
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
      const matchType = apt.loai_lich === scheduleType || apt.loai_lich === 'dich_vu_don';
      return aptDateStr === formattedSelectedDate && matchType;
  });

  const kpis = {
    total: viewMode === 'today' ? dailyAppointments.length : filteredAppointments.length,
    waiting: (viewMode === 'today' ? dailyAppointments : filteredAppointments).filter(a => a.trang_thai === 'cho_xac_nhan').length,
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
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="text-emerald-700 dark:text-emerald-450" size={28} />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2.5">
              Lịch Hẹn Khám
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700 font-semibold select-none">
                <Command size={10} /> K
              </span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">Quản lý và điều phối các ca khám lâm sàng với Bác sĩ.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
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
        </div>
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
              <span className="text-4xl font-black text-amber-600 dark:text-amber-500">{kpis.waiting}</span>
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

      {/* FILTER CONTROLS BAR - NO LONGER STICKY */}
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


          <button onClick={() => handleNavigateDay('today')} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm font-semibold text-slate-750 dark:text-zinc-300 rounded-xl shrink-0">
            Trở về Hiện tại
          </button>

          <div className="relative shrink-0">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả Phòng khám</option>
              {roomsList
                .filter(room => room.loai_phong === 'kham_benh')
                .map(room => (
                  <option key={room.id} value={room.id}>{room.ten_phong}</option>
                ))}
            </select>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
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
              allAppointments={appointments}
              selectedDateStr={formattedSelectedDate}
              onOpenWalkInModal={(time) => {
                setWalkInTime(time);
                setIsWalkInModalOpen(true);
              }}
              onUpdateAppointment={handleUpdateAppointmentFields}
            />
          ) : (
            <AppointmentWeeklyCalendar
              selectedDate={selectedDate}
              appointments={filteredAppointments}
              statusConfig={statusConfig}
              handleOpenDetailModal={handleOpenDetailModal}
              scheduleType={scheduleType}
            />
          )}
        </div>

        {/* Right Area: Doctor Workload Sidebar */}
        <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={16} className="text-primary" /> Phụ tải Bác sĩ
            </h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">Hôm nay</span>
          </div>

          <div className="space-y-4">
            {doctorWorkloads.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic text-center py-4">Không tìm thấy bác sĩ nào trong danh sách</p>
            ) : (
              doctorWorkloads.map(doc => {
                const isOverloaded = doc.percentage >= 80;
                
                return (
                  <div key={doc.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-100/50 dark:border-zinc-800/50 hover:border-slate-200 dark:hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {doc.name.charAt(0)}
                        </div>
                        <div className="max-w-[130px] sm:max-w-none">
                          <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">{doc.name}</p>
                          <span className={`text-[9px] font-semibold ${
                            doc.hasShift ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400 dark:text-zinc-500'
                          }`}>
                            {doc.hasShift ? 'Đang trực ca' : 'Không trực ca'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-200">{doc.occupiedCount}/{doc.maxSlots} ca</span>
                      </div>
                    </div>

                    {doc.hasShift && (
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 mb-1 font-semibold">
                          <span>Mật độ công việc</span>
                          <span className={isOverloaded ? 'text-rose-500 font-bold animate-pulse' : ''}>{doc.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              doc.percentage < 50 
                                ? 'bg-emerald-500' 
                                : doc.percentage < 80 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500 animate-pulse'
                            }`}
                            style={{ width: `${doc.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* COMPONENT: MODAL CHI TIẾT CA TRỰC */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsList}
          staffList={staffList}
          activeRole={activeRole}
          assignRoomId={assignRoomId}
          setAssignRoomId={setAssignRoomId}
          assignStaffId={assignStaffId}
          setAssignStaffId={setAssignStaffId}
          assignStatus={assignStatus}
          setAssignStatus={setAssignStatus}
          isAssigning={isAssigning}
          onClose={() => setIsDetailModalOpen(false)}
          onSave={handleUpdateAppointment}
          onOpenTreatment={handleOpenTreatmentModal}
          appointments={appointments}
          schedulesList={schedulesList}
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
                <Command className="text-slate-400 dark:text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân, tác vụ hoặc gõ lệnh..."
                  value={commandSearch}
                  onChange={e => setCommandSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-zinc-150 text-sm placeholder-slate-400 dark:placeholder-zinc-500"
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
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs font-semibold text-slate-750 dark:text-zinc-300 transition-colors group"
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
    </div>
  );
}
