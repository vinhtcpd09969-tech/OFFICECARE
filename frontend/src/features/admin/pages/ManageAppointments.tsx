import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Settings,
  ChevronLeft,
  X
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Import Components đã bóc tách cũ
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import TreatmentBookingModal from '../components/TreatmentBookingModal';
import WalkInBookingModal from '../components/WalkInBookingModal';

// Import các Module FSD mới bóc tách
import { useAppointmentsData } from '../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../components/appointments/hooks/useAppointmentActions';

import { AppointmentKpiCards } from '../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../components/appointments/ui/AppointmentsFilterBar';
import { DoctorWorkloadPanel } from '../components/appointments/ui/DoctorWorkloadPanel';
import { UnassignedPanel } from '../components/appointments/ui/UnassignedPanel';
import { CapacityView } from '../components/appointments/ui/CapacityView';
import { standardTimeSlots, statusConfig } from '../components/appointments/constants';
import { RoleView, ViewMode, TimeRange } from '../components/appointments/types';

export default function ManageAppointments() {
  const location = useLocation();
  const navigate = useNavigate();

  // Chế độ Mô phỏng dữ liệu giúp kiểm thử
  const isDemoMode = false;
  const [demoApts, setDemoApts] = useState<any[]>([]);

  // Chế độ xem vai trò phục vụ kiểm thử (Test) hoặc vai trò thực tế của route
  const roleView: RoleView = (() => {
    if (window.location.pathname.startsWith('/receptionist')) {
      return 'receptionist';
    }
    if (window.location.pathname.startsWith('/doctor')) {
      return 'doctor';
    }
    return 'manager';
  })();
  const [selectedDocSimId, setSelectedDocSimId] = useState<string>('');

  // State quản lý việc gọi dữ liệu từ Custom Hook
  const {
    appointments,
    staffList,
    roomsList,
    services,
    packages,
    schedulesList,
    loading,
    refetch
  } = useAppointmentsData(false);

  // Filters State
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  });


  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const params = new URLSearchParams(window.location.search);
    const rangeParam = params.get('range');
    if (rangeParam && ['today', '7days', 'month'].includes(rangeParam)) {
      return rangeParam as TimeRange;
    }
    return '7days';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      return viewParam as ViewMode;
    }
    return 'capacity';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const focusTimerRef = useRef<any>(null);



  // Khởi tạo dữ liệu mô phỏng thích ứng với tuần hiện tại
  useEffect(() => {
    const baseDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const formatAptTime = (dayOffset: number, timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const date = addDays(baseDate, dayOffset);
      date.setHours(h, m, 0, 0);
      return date.toISOString();
    };

    const mockAptsList = [
      // Thứ 2
      {
        id: "demo_1",
        ma_lich_dat: "LH-M01",
        ten_khach_hang: "Nguyễn Văn Hùng",
        so_dien_thoai: "0901112223",
        ngay_gio_bat_dau: formatAptTime(0, "08:30"),
        ngay_gio_ket_thuc: formatAptTime(0, "09:00"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_1",
        chuyen_gia_id: "doc_1",
        phong_id: "room_1",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_2",
        ma_lich_dat: "LH-M02",
        ten_khach_hang: "Lê Thị Thảo",
        so_dien_thoai: "0902223334",
        ngay_gio_bat_dau: formatAptTime(0, "10:00"),
        ngay_gio_ket_thuc: formatAptTime(0, "10:30"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_2",
        chuyen_gia_id: "doc_2",
        phong_id: "room_2",
        ten_dich_vu: "Khám chấn thương chỉnh hình",
        loai_lich: "kham_moi"
      },
      // Thứ 3
      {
        id: "demo_3",
        ma_lich_dat: "LH-T01",
        ten_khach_hang: "Trần Minh Quân",
        so_dien_thoai: "0903334445",
        ngay_gio_bat_dau: formatAptTime(1, "09:00"),
        ngay_gio_ket_thuc: formatAptTime(1, "09:30"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_1",
        chuyen_gia_id: "doc_1",
        phong_id: "room_1",
        ten_dich_vu: "Khám Cột sống & Cơ xương khớp",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_4",
        ma_lich_dat: "LH-T02",
        ten_khach_hang: "Phạm Hồng Nhung",
        so_dien_thoai: "0904445556",
        ngay_gio_bat_dau: formatAptTime(1, "14:30"),
        ngay_gio_ket_thuc: formatAptTime(1, "15:00"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_3",
        chuyen_gia_id: "doc_3",
        phong_id: "room_1",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      // Thứ 4
      {
        id: "demo_5",
        ma_lich_dat: "LH-W01",
        ten_khach_hang: "Đỗ Quốc Đạt",
        so_dien_thoai: "0905556667",
        ngay_gio_bat_dau: formatAptTime(2, "11:00"),
        ngay_gio_ket_thuc: formatAptTime(2, "11:30"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_2",
        chuyen_gia_id: "doc_2",
        phong_id: "room_2",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      // Thứ 5
      {
        id: "demo_6",
        ma_lich_dat: "LH-TH01",
        ten_khach_hang: "Ngô Hoàng Nam",
        so_dien_thoai: "0906667778",
        ngay_gio_bat_dau: formatAptTime(3, "08:30"),
        ngay_gio_ket_thuc: formatAptTime(3, "09:00"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_1",
        chuyen_gia_id: "doc_1",
        phong_id: "room_1",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_7",
        ma_lich_dat: "LH-TH02",
        ten_khach_hang: "Phan Thanh Sơn",
        so_dien_thoai: "0907778889",
        ngay_gio_bat_dau: formatAptTime(3, "15:00"),
        ngay_gio_ket_thuc: formatAptTime(3, "15:30"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_4",
        chuyen_gia_id: "doc_4",
        phong_id: "room_2",
        ten_dich_vu: "Khám chấn thương chỉnh hình",
        loai_lich: "kham_moi"
      },
      // Thứ 6
      {
        id: "demo_8",
        ma_lich_dat: "LH-F01",
        ten_khach_hang: "Hoàng Khánh Chi",
        so_dien_thoai: "0908889990",
        ngay_gio_bat_dau: formatAptTime(4, "09:30"),
        ngay_gio_ket_thuc: formatAptTime(4, "10:00"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_3",
        chuyen_gia_id: "doc_3",
        phong_id: "room_1",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      // Thứ 7
      {
        id: "demo_9",
        ma_lich_dat: "LH-S01",
        ten_khach_hang: "Đặng Đình Bảo",
        so_dien_thoai: "0909990001",
        ngay_gio_bat_dau: formatAptTime(5, "10:30"),
        ngay_gio_ket_thuc: formatAptTime(5, "11:00"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_2",
        chuyen_gia_id: "doc_2",
        phong_id: "room_2",
        ten_dich_vu: "Khám Cột sống & Cơ xương khớp",
        loai_lich: "kham_moi"
      },
      // Chủ Nhật (Hôm nay!)
      {
        id: "demo_10",
        ma_lich_dat: "LH-SU01",
        ten_khach_hang: "Trần Thế Hải",
        so_dien_thoai: "0901234567",
        ngay_gio_bat_dau: formatAptTime(6, "08:30"),
        ngay_gio_ket_thuc: formatAptTime(6, "09:00"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_1",
        chuyen_gia_id: "doc_1",
        phong_id: "room_1",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_11",
        ma_lich_dat: "LH-SU02",
        ten_khach_hang: "Nguyễn Minh Anh",
        so_dien_thoai: "0987654321",
        ngay_gio_bat_dau: formatAptTime(6, "09:30"),
        ngay_gio_ket_thuc: formatAptTime(6, "10:30"),
        trang_thai: "da_checkin",
        bac_si_id: "doc_1",
        chuyen_gia_id: "doc_1",
        phong_id: "room_1",
        ten_dich_vu: "Khám Cột sống & Cơ xương khớp",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_12",
        ma_lich_dat: "LH-SU03",
        ten_khach_hang: "Phạm Quốc Bảo",
        so_dien_thoai: "0911223344",
        ngay_gio_bat_dau: formatAptTime(6, "10:30"),
        ngay_gio_ket_thuc: formatAptTime(6, "11:30"),
        trang_thai: "cho_xac_nhan",
        bac_si_id: null,
        chuyen_gia_id: null,
        phong_id: null,
        ten_dich_vu: "Khám chấn thương chỉnh hình",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_13",
        ma_lich_dat: "LH-SU04",
        ten_khach_hang: "Lê Hoàng Yến",
        so_dien_thoai: "0955667788",
        ngay_gio_bat_dau: formatAptTime(6, "11:30"),
        ngay_gio_ket_thuc: formatAptTime(6, "12:30"),
        trang_thai: "da_xac_nhan",
        bac_si_id: "doc_2",
        chuyen_gia_id: "doc_2",
        phong_id: "room_2",
        ten_dich_vu: "Khám thoái hóa khớp gối",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_14",
        ma_lich_dat: "LH-SU05",
        ten_khach_hang: "Vũ Hoàng Nam",
        so_dien_thoai: "0922334455",
        ngay_gio_bat_dau: formatAptTime(6, "14:00"),
        ngay_gio_ket_thuc: formatAptTime(6, "15:00"),
        trang_thai: "chua_xac_nhan",
        bac_si_id: null,
        chuyen_gia_id: null,
        phong_id: null,
        ten_dich_vu: "Khám thoát vị đĩa đệm",
        loai_lich: "kham_moi",
        thoi_gian_tao: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        han_xac_nhan: new Date(Date.now() + 8 * 60 * 1000).toISOString()
      },
      {
        id: "demo_15",
        ma_lich_dat: "LH-SU06",
        ten_khach_hang: "Hoàng Thu Trang",
        so_dien_thoai: "0933445566",
        ngay_gio_bat_dau: formatAptTime(6, "15:30"),
        ngay_gio_ket_thuc: formatAptTime(6, "16:30"),
        trang_thai: "chua_xac_nhan",
        bac_si_id: null,
        chuyen_gia_id: null,
        phong_id: null,
        ten_dich_vu: "Trị liệu đau vai gáy",
        loai_lich: "dich_vu_don",
        thoi_gian_tao: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        han_xac_nhan: new Date(Date.now() + 45 * 60 * 1000).toISOString()
      },
      {
        id: "demo_16",
        ma_lich_dat: "LH-SU07",
        ten_khach_hang: "Bùi Quang Huy",
        so_dien_thoai: "0944556677",
        ngay_gio_bat_dau: formatAptTime(6, "16:30"),
        ngay_gio_ket_thuc: formatAptTime(6, "17:30"),
        trang_thai: "hoan_thanh",
        bac_si_id: "doc_4",
        chuyen_gia_id: "doc_4",
        phong_id: "room_2",
        ten_dich_vu: "Khám chuyên khoa Cột sống",
        loai_lich: "kham_moi"
      },
      {
        id: "demo_17",
        ma_lich_dat: "LH-SU08",
        ten_khach_hang: "Đỗ Thùy Linh",
        so_dien_thoai: "0955667788",
        ngay_gio_bat_dau: formatAptTime(6, "17:00"),
        ngay_gio_ket_thuc: formatAptTime(6, "17:30"),
        trang_thai: "da_xac_nhan",
        bac_si_id: "doc_3",
        chuyen_gia_id: "doc_3",
        phong_id: "room_1",
        ten_dich_vu: "Khám chấn thương chỉnh hình",
        loai_lich: "kham_moi"
      }
    ];

    setDemoApts(mockAptsList);
  }, [selectedDate]);

  // Bộ dữ liệu tĩnh mô phỏng cho Bác sĩ, Phòng khám và Ca trực
  const mockStaff = [
    { id: "staff_1", chuyen_gia_id: "doc_1", ho_ten: "Nguyễn Văn Khoa", vai_tro: "Bác sĩ" },
    { id: "staff_2", chuyen_gia_id: "doc_2", ho_ten: "Trần Thị Lan Anh", vai_tro: "Bác sĩ" },
    { id: "staff_3", chuyen_gia_id: "doc_3", ho_ten: "Phạm Quang Hưng", vai_tro: "Bác sĩ" },
    { id: "staff_4", chuyen_gia_id: "doc_4", ho_ten: "Lê Ngọc Minh", vai_tro: "Bác sĩ" },
  ];

  const mockRooms = [
    { id: "room_1", ten_phong: "Phòng Khám 01", loai_phong: "Lâm sàng", suc_chua: 1 },
    { id: "room_2", ten_phong: "Phòng Khám 02", loai_phong: "Lâm sàng", suc_chua: 1 },
    { id: "room_3", ten_phong: "Phòng Trị Liệu 03", loai_phong: "Trị liệu", suc_chua: 5 }
  ];

  const mockSchedules = [
    { id: "sched_1", nguoi_dung_id: "staff_1", ngay: format(selectedDate, 'yyyy-MM-dd'), trang_thai: 'hoat_dong', gio_bat_dau: "08:00", gio_ket_thuc: "18:00" },
    { id: "sched_2", nguoi_dung_id: "staff_2", ngay: format(selectedDate, 'yyyy-MM-dd'), trang_thai: 'hoat_dong', gio_bat_dau: "08:00", gio_ket_thuc: "18:00" },
    { id: "sched_3", nguoi_dung_id: "staff_3", ngay: format(selectedDate, 'yyyy-MM-dd'), trang_thai: 'hoat_dong', gio_bat_dau: "08:00", gio_ket_thuc: "18:00" },
    { id: "sched_4", nguoi_dung_id: "staff_4", ngay: format(selectedDate, 'yyyy-MM-dd'), trang_thai: 'hoat_dong', gio_bat_dau: "08:00", gio_ket_thuc: "18:00" },
  ];

  // Định nghĩa các biến overlay dựa trên Demo Mode
  const appointmentsToUse = isDemoMode ? demoApts : appointments;
  const staffToUse = isDemoMode ? mockStaff : staffList;
  const roomsToUse = isDemoMode ? mockRooms : roomsList;
  const schedulesToUse = isDemoMode ? mockSchedules : schedulesList;

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

  // Staff filter for filtering appointments on calendar
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

  // Clear staff filter when activeType or selectedDate changes
  useEffect(() => {
    setSelectedStaffFilter(null);
  }, [activeType, selectedDate]);

  // Actions custom hook
  const {
    selectedAppointment,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isTreatmentModalOpen,
    setIsTreatmentModalOpen,
    isWalkInModalOpen,
    setIsWalkInModalOpen,
    walkInTime,
    setWalkInTime,
    assignStaffId,
    setAssignStaffId,
    assignRoomId,
    setAssignRoomId,
    assignGiuongSo,
    setAssignGiuongSo,
    assignStatus,
    setAssignStatus,
    isAssigning,
    treatmentType,
    setTreatmentType,
    selectedServiceId,
    setSelectedServiceId,
    selectedPackageId,
    setSelectedPackageId,
    selectedKtvId,
    setSelectedKtvId,
    selectedRoomId,
    setSelectedRoomId,
    selectedGiuongSo,
    setSelectedGiuongSo,
    treatmentDate,
    setTreatmentDate,
    treatmentTime,
    setTreatmentTime,
    bookingLoading,
    handleOpenDetailModal,
    handleOpenTreatmentModal,
    handleUpdateAppointment,
    handleBookTreatment,
    handleBookWalkIn,
    handleUpdateAppointmentFields,
    scrollToAppointment,
    cancelReason,
    setCancelReason
  } = useAppointmentActions({
    appointments: appointmentsToUse,
    services,
    packages,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    timeRange,
    setTimeRange,
    refetch,
    navigate,
    roleView,
    isDemoMode,
    setDemoApts
  });

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

  // Sync role view to localStorage and custom event for AdminLayout to mute/unmute alarm
  useEffect(() => {
    localStorage.setItem('admin-test-role-view', roleView);
    window.dispatchEvent(new CustomEvent('admin-test-role-view-change', { detail: roleView }));
    return () => {
      localStorage.removeItem('admin-test-role-view');
      window.dispatchEvent(new CustomEvent('admin-test-role-view-change', { detail: 'manager' }));
    };
  }, [roleView]);

  // Synchronize state with URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    const viewParam = params.get('view');
    const rangeParam = params.get('range');

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
        setSelectedDate(parsedDate);
      }
    }

    if (rangeParam && ['today', '7days', 'month'].includes(rangeParam)) {
      if (rangeParam !== timeRange) {
        setTimeRange(rangeParam as TimeRange);
      }
    } else if (!rangeParam && viewParam === 'timeline') {
      // If we are showing timeline directly, range should default to today
      setTimeRange('today');
    } else if (!rangeParam) {
      setTimeRange('7days');
    }

    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      if (viewParam !== viewMode) {
        setViewMode(viewParam as ViewMode);
      }
    }

    // Set role defaults if no URL parameters are present
    if (!dateParam && !viewParam) {
      if (roleView === 'receptionist' || roleView === 'manager') {
        setViewMode('capacity');
        setSelectedDate(new Date());
      }
    }
  }, [location.search, roleView]);

  // Update URL when states change (preserving extra params like triggerFocus)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    params.set('range', timeRange);
    params.set('view', viewMode);
    
    const newSearch = `?${params.toString()}`;
    if (location.search !== newSearch) {
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [selectedDate, timeRange, viewMode, navigate, location.pathname]);

  // Navigate to corresponding routes when simulator role changes
  useEffect(() => {
    if (roleView === 'manager' && !location.pathname.startsWith('/admin')) {
      navigate(`/admin/appointments${location.search}`);
    } else if (roleView === 'receptionist' && !location.pathname.startsWith('/receptionist')) {
      navigate(`/receptionist/appointments${location.search}`);
    } else if (roleView === 'doctor' && !location.pathname.startsWith('/doctor')) {
      navigate(`/doctor/appointments${location.search}`);
    }
  }, [roleView, location.pathname, location.search, navigate]);


  // Thiết lập Bác sĩ mặc định cho kiểm thử
  useEffect(() => {
    if (staffToUse.length > 0 && !selectedDocSimId) {
      const doctors = staffToUse.filter(s => s.vai_tro === 'Bác sĩ');
      if (doctors.length > 0) {
        setSelectedDocSimId(String(doctors[0].id));
      }
    }
  }, [staffToUse, selectedDocSimId]);



  // Real-time expiring toast notifier (disabled as per user request)
  useEffect(() => {
    return;
  }, [appointmentsToUse]);

  const getActiveInterval = () => {
    if (timeRange === 'today') {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (timeRange === '7days') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (timeRange === 'month') {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    } else {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };
  const activeInterval = getActiveInterval();

  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (direction === 'next') {
      setSelectedDate(prev => 
        viewMode === 'timeline'
          ? addDays(prev, 1)
          : timeRange === 'month'
            ? addMonths(prev, 1)
            : addDays(prev, 7)
      );
    } else {
      setSelectedDate(prev => 
        viewMode === 'timeline'
          ? subDays(prev, 1)
          : timeRange === 'month'
            ? subMonths(prev, 1)
            : subDays(prev, 7)
      );
    }
  };

  const activeRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  const filteredAppointments = appointmentsToUse.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau || '');
    let matchDate = false;

    if (viewMode === 'timeline') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      matchDate = aptDateStr === formattedSelectedDate;
    } else {
      matchDate = aptDate >= activeInterval.start && aptDate <= activeInterval.end;
    }

    const matchType = activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const matchSearch = searchTerm === '' ||
      apt.ma_lich_dat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStaff = !selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter);

    return matchDate && matchType && matchSearch && matchStaff;
  });

  // KPI Metrics calculation (dailyAppointments removed)

  // KPI Metrics calculation based on the active range (day, week, month)
  const getKpiAppointments = () => {
    const matchType = (apt: any) => activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    if (viewMode === 'timeline') {
      return appointmentsToUse.filter(apt => {
        const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        return aptDateStr === formattedSelectedDate && matchType(apt);
      });
    } else {
      const interval = getActiveInterval();
      return appointmentsToUse.filter(apt => {
        const aptDate = new Date(apt.ngay_gio_bat_dau || '');
        return aptDate >= interval.start && aptDate <= interval.end && matchType(apt);
      });
    }
  };

  const kpiAppointments = getKpiAppointments();

  const kpis = {
    total: kpiAppointments.length,
    waiting: kpiAppointments.filter(a => a.trang_thai === 'chua_xac_nhan' || a.trang_thai === 'cho_xac_nhan').length,
    completed: kpiAppointments.filter(a => a.trang_thai === 'hoan_thanh').length,
    cancelled: kpiAppointments.filter(a => a.trang_thai === 'da_huy' || a.trang_thai === 'khong_den').length,
  };

  const unassignedAppointments = appointmentsToUse
    .filter(apt => {
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
      const isSelectedDate = aptDateStr === formattedSelectedDate;
      const isClinical = apt.loai_lich === 'kham_moi' || apt.loai_lich === 'dich_vu_don';
      const isWaitingForAssignment = apt.trang_thai === 'cho_xac_nhan';
      const hasNoDoctor = !apt.bac_si_id;
      return isSelectedDate && isClinical && isWaitingForAssignment && hasNoDoctor;
    })
    .sort((a, b) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());



  const getIsDoctorUnavailable = (apt: any, doc: any) => {
    if (!doc) return false;
    
    // Check ca trực
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
    
    const staffSchedules = schedulesToUse.filter(s => 
      String(s.nguoi_dung_id) === String(doc.id) && 
      s.ngay === aptDateStr
    );

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) return true;

    // Check overlap
    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
      const s1 = new Date(start1).getTime();
      const e1 = new Date(end1).getTime();
      const s2 = new Date(start2).getTime();
      const e2 = new Date(end2).getTime();
      return s1 < e2 && e1 > s2;
    };

    const isOccupied = appointmentsToUse.some(otherApt => 
      otherApt.id !== apt.id && 
      otherApt.trang_thai !== 'da_huy' &&
      otherApt.trang_thai !== 'khong_den' &&
      String(otherApt.bac_si_id) === String(doc.id) &&
      isOverlapping(apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc, otherApt.ngay_gio_bat_dau, otherApt.ngay_gio_ket_thuc)
    );

    return isOccupied;
  };

  // Định nghĩa danh sách Mascot theo vai trò
  const managerMascotApts = appointmentsToUse.filter(apt => {
    const isClinical = apt.loai_lich === 'kham_moi' || apt.loai_lich === 'dich_vu_don';
    const isActive = ['cho_xac_nhan', 'da_xac_nhan'].includes(apt.trang_thai);
    if (!isClinical || !isActive) return false;

    const hasNoDoctor = !apt.bac_si_id;
    if (hasNoDoctor) return true;

    const doc = staffToUse.find(s => String(s.id) === String(apt.bac_si_id));
    const isDocUnavailable = doc ? getIsDoctorUnavailable(apt, doc) : true;

    return isDocUnavailable;
  }).sort((a, b) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());



  // Chọn danh sách mục tiêu Mascot theo vai trò đang chọn (chỉ manager)
  const mascotTargetAppointments = managerMascotApts;

  // Clean up focus timer on component unmount
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  // Auto-focus appointment when navigated from other pages with triggerFocus=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aptIdParam = params.get('appointmentId');
    if (params.get('triggerFocus') === 'true' && !loading) {
      const targetId = aptIdParam || (mascotTargetAppointments.length > 0 ? String(mascotTargetAppointments[0].id) : null);
      if (targetId) {
        // Clean up URL parameter immediately to prevent infinite loops on re-renders
        params.delete('triggerFocus');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        navigate(location.pathname + newSearch, { replace: true });

        // Cancel previous timer if any
        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
        }

        focusTimerRef.current = setTimeout(() => {
          scrollToAppointment(targetId);
        }, 500);
      }
    }
  }, [location.search, mascotTargetAppointments, scrollToAppointment, navigate, location.pathname, loading]);

  // Tính toán phụ tải làm việc của từng bác sĩ/KTV trong ngày
  const targetWorkloadRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const doctorWorkloads = staffToUse
    .filter(s => s.vai_tro === targetWorkloadRole)
    .map(doc => {
      const docSchedules = schedulesToUse.filter(s =>
        String(s.nguoi_dung_id) === String(doc.id) &&
        s.ngay === formattedSelectedDate &&
        s.trang_thai === 'hoat_dong'
      );
      const hasShift = docSchedules.length > 0;

      const docApts = appointmentsToUse.filter(apt =>
        String(apt.bac_si_id) === String(doc.id) &&
        format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === formattedSelectedDate &&
        apt.trang_thai !== 'da_huy' &&
        apt.trang_thai !== 'khong_den'
      );

      const maxSlots = 16;
      const occupiedCount = docApts.length;
      const percentage = maxSlots > 0 ? Math.min(Math.round((occupiedCount / maxSlots) * 100), 100) : 0;

      return {
        id: doc.id,
        chuyen_gia_id: String(doc.id),
        name: doc.ho_ten,
        hasShift,
        occupiedCount,
        maxSlots,
        percentage
      };
    })
    .filter(doc => doc.hasShift);

  // Cấu hình danh sách lệnh cho Command Palette (Ctrl+K)
  const commandShortcuts = [
    {
      id: 'view_today',
      name: 'Xem Lịch trình Hôm nay',
      icon: <CalendarIcon size={14} />,
      shortcut: 'T',
      action: () => {
        setTimeRange('today');
        setViewMode('timeline');
      }
    },
    {
      id: 'view_week',
      name: 'Xem Lịch trình Tuần này',
      icon: <CalendarDays size={14} />,
      shortcut: 'W',
      action: () => {
        setTimeRange('7days');
        setViewMode('capacity');
      }
    },
    {
      id: 'walk_in',
      name: 'Đăng ký Khách vãng lai (Walk-In)',
      icon: <Settings size={14} />,
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

  const filteredApts = commandSearch.trim() === '' ? [] : appointmentsToUse.filter(apt =>
    apt.ten_khach_hang.toLowerCase().includes(commandSearch.toLowerCase()) ||
    apt.ma_lich_dat.toLowerCase().includes(commandSearch.toLowerCase())
  );

  if (loading && appointmentsToUse.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#0D9488] border-r-2 border-[#0D9488]/20 dark:border-t-[#0D9488]"></div>
        <p className="text-slate-500 dark:text-zinc-400 font-medium text-sm">Đang đồng bộ hóa hệ thống lịch trình...</p>
      </div>
    );
  }

  // Statistics & calculation details for roles (unused local statistics variables removed)

  // Filter Doctor appointments (removed doctor simulator statistics)

  return (
    <div className="space-y-6 max-w-full font-jakarta">



      {/* Onboarding flow guide removed from main area */}

      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* UNIFIED APPOINTMENT CENTER LAYOUT (Manager & Receptionist) */}
        {/* ========================================================= */}
        <motion.div
          key="unified-appointment-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6"
        >
          {/* KPI METRIC CARDS */}
          <AppointmentKpiCards
            isReceptionist={false}
            kpis={kpis}
            receptionistKpis={{ total: 0, pendingContact: 0, assigned: 0, checkedIn: 0 }}
            viewMode={viewMode}
            timeRange={timeRange}
            activeType={activeType}
          />

            <AppointmentsFilterBar
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              startDateOfWeek={activeInterval.start}
              endDateOfWeek={activeInterval.end}
              handleNavigateDay={handleNavigateDay}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              viewMode={viewMode}
              selectedDate={selectedDate}
              activeType={activeType}
              onToggleType={() => setActiveType(prev => prev === 'kham' ? 'dieu_tri' : 'kham')}
            />

            {/* DYNAMIC HEADER & BACK NAVIGATION */}
            {viewMode === 'timeline' && (
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-55/40 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 p-3 rounded-[20px] backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('7days');
                    setViewMode('capacity');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/15 rounded-xl border border-[#0D9488]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ChevronLeft size={14} className="stroke-[3]" />
                  <span>Quay lại Bảng công suất</span>
                </button>

                <div className="text-xs font-bold text-slate-505 dark:text-zinc-400 flex items-center gap-2 self-end sm:self-center">
                  <span>Đang xem ngày:</span>
                  <span className="bg-teal-55 dark:bg-teal-955/20 text-[#0d9488] dark:text-teal-450 px-2.5 py-1 rounded-xl border border-teal-100/30 font-black uppercase tracking-wide">
                    {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
              </div>
            )}

            {/* MAIN WORKBOARD GRID */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Left Content Area */}
              <div className="flex-1 w-full min-w-0">
                {viewMode === 'timeline' && selectedStaffFilter && (
                  <div className="mb-4 flex items-center justify-between bg-teal-550/10 dark:bg-teal-955/20 border border-teal-500/30 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-teal-500 animate-pulse" />
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-150 uppercase tracking-wider">
                        Lịch {activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên'}: {
                          staffToUse.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'
                        }
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedStaffFilter(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-955/20 dark:hover:bg-rose-955/30 rounded-xl border border-rose-250/20 dark:border-rose-900/30 transition-all uppercase tracking-wider"
                    >
                      <X size={12} className="stroke-[3]" />
                      <span>Hủy lọc</span>
                    </button>
                  </div>
                )}

                {viewMode === 'timeline' && (
                  <AppointmentCalendar
                    timeSlots={standardTimeSlots}
                    appointments={filteredAppointments}
                    statusConfig={statusConfig}
                    handleOpenDetailModal={handleOpenDetailModal}
                    staffList={staffToUse}
                    schedulesList={schedulesToUse}
                    allAppointments={appointmentsToUse}
                    selectedDateStr={formattedSelectedDate}
                    onOpenWalkInModal={(time) => {
                      setWalkInTime(time);
                      setIsWalkInModalOpen(true);
                    }}
                    onUpdateAppointment={handleUpdateAppointmentFields}
                    viewMode="admin"
                  />
                )}

                {viewMode === 'capacity' && (
                  <CapacityView
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    setViewMode={setViewMode}
                    appointments={appointmentsToUse.filter(apt => 
                      activeType === 'kham'
                        ? apt.loai_lich === 'kham_moi'
                        : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don')
                    )}
                    timeRange={timeRange}
                    activeType={activeType}
                  />
                )}
              </div>

              {/* Right Sidebar (Collapsible) */}
              {viewMode === 'timeline' && (
                <div className="relative shrink-0 flex items-stretch min-h-[400px]">
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-teal-500 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 shadow-sm transition-all focus:outline-none"
                  >
                    <span className="text-[10px] font-black">{isSidebarOpen ? '❯' : '❮'}</span>
                  </button>

                  {isSidebarOpen ? (
                    <div className="w-80 border-l border-slate-100 dark:border-zinc-800 pl-6 space-y-6 overflow-y-auto animate-in slide-in-from-right-3 duration-200">
                      
                      <UnassignedPanel
                        unassignedAppointments={unassignedAppointments}
                        onOpenDetailModal={handleOpenDetailModal}
                      />
                      <DoctorWorkloadPanel 
                        doctorWorkloads={doctorWorkloads} 
                        activeType={activeType} 
                        selectedStaffId={selectedStaffFilter}
                        onSelectStaff={setSelectedStaffFilter}
                      />
                      
                      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase mb-2 tracking-wide">Trạng thái phòng khám</h4>
                        <div className="space-y-2">
                          {roomsToUse.filter(r => r.loai_phong === 'kham_benh' || r.loai_phong === 'phong_kham').map(r => {
                            const isUsed = filteredAppointments.some(a => String(a.phong_id) === String(r.id));
                            return (
                              <div key={r.id} className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-650 dark:text-zinc-400">{r.ten_phong}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  isUsed 
                                    ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400' 
                                    : 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-750 dark:text-emerald-400'
                                }`}>
                                  {isUsed ? 'Đang hoạt động' : 'Phòng trống'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="w-4 bg-slate-50/50 dark:bg-zinc-800/10 border-l border-slate-100 dark:border-zinc-800 rounded-r-2xl" />
                  )}

                </div>
              )}
            </div>
          </motion.div>
      </AnimatePresence>

      {/* ========================================================= */}
      {/* GLOBAL MODALS (Keep existing business logic & markup) */}
      {/* ========================================================= */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsToUse}
          staffList={staffToUse}
          activeRole={activeRole}
          assignRoomId={assignRoomId}
          setAssignRoomId={setAssignRoomId}
          assignGiuongSo={assignGiuongSo}
          setAssignGiuongSo={setAssignGiuongSo}
          assignStaffId={assignStaffId}
          setAssignStaffId={setAssignStaffId}
          assignStatus={assignStatus}
          setAssignStatus={setAssignStatus}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          isAssigning={isAssigning}
          onClose={() => setIsDetailModalOpen(false)}
          onSave={handleUpdateAppointment}
          onOpenTreatment={handleOpenTreatmentModal}
          appointments={appointmentsToUse}
          schedulesList={schedulesToUse}
          isReceptionistOverride={false}
        />
      )}

      {isTreatmentModalOpen && (
        <TreatmentBookingModal
          selectedAppointment={selectedAppointment}
          services={services}
          packages={packages}
          staffList={staffToUse}
          roomsList={roomsToUse}
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
          selectedGiuongSo={selectedGiuongSo}
          setSelectedGiuongSo={setSelectedGiuongSo}
          treatmentDate={treatmentDate}
          setTreatmentDate={setTreatmentDate}
          treatmentTime={treatmentTime}
          setTreatmentTime={setTreatmentTime}
          bookingLoading={bookingLoading}
          onClose={() => setIsTreatmentModalOpen(false)}
          onSubmit={handleBookTreatment}
        />
      )}

      {isWalkInModalOpen && (
        <WalkInBookingModal
          roomsList={roomsToUse}
          staffList={staffToUse}
          appointments={appointmentsToUse}
          schedulesList={schedulesToUse}
          servicesList={services}
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
            className="fixed inset-0 bg-slate-955/40 dark:bg-zinc-955/65 backdrop-blur-md z-50 flex items-center justify-center p-4"
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
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-400 dark:text-zinc-550 font-mono text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50">
                  Ctrl K
                </span>
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

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-55/60 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 group-hover:text-[#0D9488] transition-colors">
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
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-55/60 dark:hover:bg-zinc-800/60 flex items-center justify-between text-xs text-slate-750 dark:text-zinc-350 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800 dark:text-zinc-100">
                            {apt.ten_khach_hang}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
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
                  <div className="text-center py-8 text-slate-450 dark:text-zinc-500 text-xs italic">
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
