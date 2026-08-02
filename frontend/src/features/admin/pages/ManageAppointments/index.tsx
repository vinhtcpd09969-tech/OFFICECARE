import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Import Components
import AppointmentCalendar from '../../../../components/appointments/AppointmentCalendar';
import AppointmentDetailModal from '../../../../components/appointments/DetailModal';
import TreatmentBookingModal from '../../../../components/appointments/TreatmentBookingModal';
import WalkInBookingModal from '../../../../components/WalkInBookingModal';

// Import Module Hooks & UI Components
import { useAppointmentsData } from '../../../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { DoctorWorkloadPanel } from '../../../../components/appointments/ui/DoctorWorkloadPanel';
import { UnassignedPanel } from '../../../../components/appointments/ui/UnassignedPanel';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { statusConfig } from '../../../../components/appointmentStatusConfig';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { getSmartSearchScore } from '../../../../utils/smartSearch';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';
import { RoleView, ViewMode, TimeRange } from '../../../../components/appointments/types';

// Import Local Components
import { CommandPalette } from './CommandPalette';

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

  // Filters State: Dynamic Start Date & End Date Range
  const [startDate, setStartDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('startDate') || params.get('date');
    if (startParam) {
      const parsedDate = new Date(startParam);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const endParam = params.get('endDate');
    if (endParam) {
      const parsedDate = new Date(endParam);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return addDays(today, 6); // Mặc định 7 ngày (Hôm nay + 6 ngày)
  });

  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

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

  // Local Filter for staff/doctor in Timeline view
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

  // Lọc theo 1 trạng thái cụ thể khi bấm thẻ KPI (AppointmentKpiCards.tsx) — độc lập với KPI,
  // không thu hẹp số liệu trên thẻ, chỉ thu hẹp danh sách hiển thị bên dưới. Không có 'total' vì
  // thẻ Tổng ca không dùng để lọc.
  const [statusFilter, setStatusFilter] = useState<Exclude<keyof AppointmentKpiBuckets, 'total'> | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Choose list of appointments to use based on mode
  const appointmentsToUse = isDemoMode ? demoApts : (appointments || []);
  const staffToUse = staffList || [];
  const roomsToUse = roomsList || [];
  const schedulesToUse = schedulesList || [];

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
    setCancelReason,
    selectedTimeSlot,
    setSelectedTimeSlot,
    rescheduleDate,
    setRescheduleDate
  } = useAppointmentActions({
    appointments: appointmentsToUse,
    services,
    packages,
    selectedDate: startDate,
    setSelectedDate: (d: Date) => {
      setStartDate(d);
      setEndDate(d);
    },
    viewMode,
    setViewMode,
    timeRange: 'custom',
    setTimeRange: () => {},
    refetch,
    navigate,
    roleView,
    isDemoMode,
    setDemoApts,
    activeType,
    setActiveType
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

  // Sync role view to localStorage and custom event for AdminLayout
  useEffect(() => {
    localStorage.setItem('admin-test-role-view', roleView);
    window.dispatchEvent(new CustomEvent('admin-test-role-view-change', { detail: roleView }));
    return () => {
      localStorage.removeItem('admin-test-role-view');
      window.dispatchEvent(new CustomEvent('admin-test-role-view-change', { detail: 'manager' }));
    };
  }, [roleView]);

  const bookingFormRef = useRef<HTMLDivElement>(null);

  // Auto-scroll xuống form Đặt lịch tại quầy khi mở form từ đường dẫn / đặt lịch tiếp theo
  useEffect(() => {
    if (isWalkInModalOpen && bookingFormRef.current) {
      const timer = setTimeout(() => {
        bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isWalkInModalOpen]);

  // Synchronize state with URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startParam = params.get('startDate') || params.get('date');
    const endParam = params.get('endDate');
    const viewParam = params.get('view');

    if (startParam) {
      const parsedDate = new Date(startParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
        setStartDate(parsedDate);
      }
    }

    if (endParam) {
      const parsedDate = new Date(endParam);
      if (!isNaN(parsedDate.getTime()) && format(parsedDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd')) {
        setEndDate(parsedDate);
      }
    }

    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      if (viewParam !== viewMode) {
        setViewMode(viewParam as ViewMode);
      }
    }

    const khId = params.get('khach_hang_id');
    const svcId = params.get('goi_dich_vu_id');
    if (khId && svcId) {
      setActiveType('dieu_tri');
      setIsWalkInModalOpen(true);
    }
  }, [location.search, roleView, setActiveType, setIsWalkInModalOpen, startDate, endDate, viewMode]);

  // Update URL when states change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('startDate', format(startDate, 'yyyy-MM-dd'));
    params.set('endDate', format(endDate, 'yyyy-MM-dd'));
    params.set('view', viewMode);
    
    const newSearch = `?${params.toString()}`;
    if (location.search !== newSearch) {
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [startDate, endDate, viewMode, navigate, location.pathname]);

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

  // Set default doctor
  useEffect(() => {
    if (staffToUse.length > 0 && !selectedDocSimId) {
      const doctors = staffToUse.filter(s => s.vai_tro === 'Bác sĩ');
      if (doctors.length > 0) {
        setSelectedDocSimId(String(doctors[0].id));
      }
    }
  }, [staffToUse, selectedDocSimId]);

  // Tự động reset bộ lọc và đóng form khi chuyển đổi tab (lịch khám <=> lịch điều trị)
  useEffect(() => {
    setSelectedStaffFilter(null);
    setStatusFilter(null);
    setIsWalkInModalOpen(false);
  }, [activeType, setIsWalkInModalOpen]);

  const handleSelectDateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    if (isSameDay(start, end)) {
      setViewMode('timeline');
    } else {
      setViewMode('capacity');
    }
  };

  const handleNavigateRange = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStartDate(today);
      setEndDate(addDays(today, 6));
      setViewMode('capacity');
      return;
    }

    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(0, 0, 0, 0);
    const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    if (direction === 'next') {
      setStartDate(prev => addDays(prev, diffDays));
      setEndDate(prev => addDays(prev, diffDays));
    } else {
      setStartDate(prev => addDays(prev, -diffDays));
      setEndDate(prev => addDays(prev, -diffDays));
    }
  };

  const activeRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const formattedSelectedDate = format(startDate, 'yyyy-MM-dd');

  const removeAccents = (str: string) => {
    return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredAppointments = appointmentsToUse.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau || '');
    let matchDate = false;

    if (viewMode === 'timeline') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      const startStr = format(startDate, 'yyyy-MM-dd');
      matchDate = aptDateStr === startStr;
    } else {
      const startBound = new Date(startDate);
      startBound.setHours(0, 0, 0, 0);
      const endBound = new Date(endDate);
      endBound.setHours(23, 59, 59, 999);
      matchDate = aptDate >= startBound && aptDate <= endBound;
    }

    const matchType = activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const cleanSearch = removeAccents(searchTerm);
    const matchSearch = searchTerm === '' ||
      getSmartSearchScore(apt.ten_khach_hang || '', searchTerm) > 0 ||
      removeAccents(apt.ma_lich_dat).includes(cleanSearch) ||
      (apt.so_dien_thoai || '').includes(searchTerm.trim());

    const matchStaff = !selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter);
    const matchStatus = !statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(apt.trang_thai);

    return matchDate && matchType && matchSearch && matchStaff && matchStatus && apt.trang_thai !== 'giu_cho';
  });

  const getKpiAppointments = () => {
    const matchType = (apt: any) => activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const filterByStaff = (apt: any) => !selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter);

    if (viewMode === 'timeline') {
      return appointmentsToUse.filter(apt => {
        const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        return aptDateStr === formattedSelectedDate && matchType(apt) && filterByStaff(apt) && apt.trang_thai !== 'giu_cho';
      });
    } else {
      const startBound = new Date(startDate);
      startBound.setHours(0, 0, 0, 0);
      const endBound = new Date(endDate);
      endBound.setHours(23, 59, 59, 999);
      return appointmentsToUse.filter(apt => {
        const aptDate = new Date(apt.ngay_gio_bat_dau || '');
        return aptDate >= startBound && aptDate <= endBound && matchType(apt) && filterByStaff(apt) && apt.trang_thai !== 'giu_cho';
      });
    }
  };

  const kpiAppointments = getKpiAppointments();

  const kpis = computeAppointmentKpiBuckets(kpiAppointments);

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
    
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
    
    const staffSchedules = schedulesToUse.filter(s => 
      String(s.nguoi_dung_id) === String(doc.id) && 
      s.ngay === aptDateStr
    );

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) return true;

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

  const mascotTargetAppointments = managerMascotApts;

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aptIdParam = params.get('appointmentId');
    if (params.get('triggerFocus') === 'true' && !loading) {
      const targetId = aptIdParam || (mascotTargetAppointments.length > 0 ? String(mascotTargetAppointments[0].id) : null);
      if (targetId) {
        setIsWalkInModalOpen(false);
        params.delete('triggerFocus');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        navigate(location.pathname + newSearch, { replace: true });

        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
        }

        focusTimerRef.current = setTimeout(() => {
          scrollToAppointment(targetId);
        }, 500);
      }
    }
  }, [location.search, mascotTargetAppointments, scrollToAppointment, navigate, location.pathname, loading, setIsWalkInModalOpen]);

  const periodLabel = viewMode === 'timeline'
    ? 'Hôm nay'
    : 'Bảng công suất';

  const targetWorkloadRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const doctorWorkloads = staffToUse
    .filter(s => s.vai_tro === targetWorkloadRole)
    .map(doc => {
      let hasShift = false;
      let occupiedCount = 0;
      let maxSlots = 16;

      if (viewMode === 'timeline') {
        const docSchedules = schedulesToUse.filter(s =>
          String(s.nguoi_dung_id) === String(doc.id) &&
          s.ngay === formattedSelectedDate &&
          s.trang_thai === 'hoat_dong'
        );
        hasShift = docSchedules.length > 0;

        const docApts = appointmentsToUse.filter(apt => {
          const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
          return String(assignedId) === String(doc.id) &&
            format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === formattedSelectedDate &&
            apt.trang_thai !== 'da_huy' &&
            apt.trang_thai !== 'khong_den' &&
            apt.trang_thai !== 'giu_cho';
        });
        occupiedCount = docApts.length;
      } else {
        const startBound = new Date(startDate);
        startBound.setHours(0, 0, 0, 0);
        const endBound = new Date(endDate);
        endBound.setHours(23, 59, 59, 999);

        const docSchedules = schedulesToUse.filter(s => {
          if (String(s.nguoi_dung_id) !== String(doc.id) || s.trang_thai !== 'hoat_dong') return false;
          const shiftDate = new Date(s.ngay);
          return shiftDate >= startBound && shiftDate <= endBound;
        });

        const docApts = appointmentsToUse.filter(apt => {
          const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
          if (String(assignedId) !== String(doc.id)) return false;
          const aptDate = new Date(apt.ngay_gio_bat_dau || '');
          return aptDate >= startBound && aptDate <= endBound &&
            apt.trang_thai !== 'da_huy' &&
            apt.trang_thai !== 'khong_den' &&
            apt.trang_thai !== 'giu_cho';
        });

        hasShift = docSchedules.length > 0 || docApts.length > 0;
        occupiedCount = docApts.length;
        const activeDays = new Set(docSchedules.map(s => s.ngay)).size;
        maxSlots = Math.max(activeDays * 16, 16);
      }

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

  const commandShortcuts = [
    {
      id: 'view_today',
      name: 'Xem Lịch trình Hôm nay',
      icon: <CalendarIcon size={14} />,
      shortcut: 'T',
      action: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        handleSelectDateRange(today, today);
      }
    },
    {
      id: 'view_week',
      name: 'Xem 7 ngày tới',
      icon: <CalendarDays size={14} />,
      shortcut: 'W',
      action: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        handleSelectDateRange(today, addDays(today, 6));
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
      }
    }
  ];

  if (loading && appointmentsToUse.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#0D9488] border-r-2 border-[#0D9488]/20 dark:border-t-[#0D9488]"></div>
        <p className="text-slate-505 dark:text-zinc-400 font-medium text-sm">Đang đồng bộ hóa hệ thống lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full font-jakarta">
      {/* KPI METRIC CARDS */}
      <AppointmentKpiCards
        role="admin"
        kpis={kpis}
        viewMode={viewMode}
        timeRange="custom"
        activeType={activeType}
        activeStatusFilter={statusFilter}
        onSelectStatus={setStatusFilter}
      />

          <AppointmentsFilterBar
            startDate={startDate}
            endDate={endDate}
            onSelectDateRange={handleSelectDateRange}
            handleNavigateRange={handleNavigateRange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            activeType={activeType}
            onToggleType={() => setActiveType(prev => prev === 'kham' ? 'dieu_tri' : 'kham')}
            canToggleType={true}
            setViewMode={setViewMode}
          />

          {/* MAIN WORKBOARD GRID */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Left Content Area */}
            <div className="flex-1 w-full min-w-0">
              {selectedStaffFilter && (
                <div className="mb-4">
                  <ActiveFilterChip
                    label={`Lịch ${activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên'}: ${staffToUse.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'}`}
                    onClear={() => setSelectedStaffFilter(null)}
                  />
                </div>
              )}

              {statusFilter && (
                <div className="mb-4">
                  <ActiveFilterChip
                    label={`Đang lọc: ${KPI_BUCKET_LABELS[statusFilter]}`}
                    onClear={() => setStatusFilter(null)}
                  />
                </div>
              )}

              {isWalkInModalOpen ? (
                <div ref={bookingFormRef} className="scroll-mt-6">
                  <WalkInBookingModal
                    roomsList={roomsToUse}
                    staffList={staffToUse}
                    appointments={appointmentsToUse}
                    schedulesList={schedulesToUse}
                    servicesList={services}
                    onClose={() => {
                      setIsWalkInModalOpen(false);
                      const newParams = new URLSearchParams(location.search);
                      newParams.delete('khach_hang_id');
                      newParams.delete('goi_dich_vu_id');
                      navigate(location.pathname + '?' + newParams.toString(), { replace: true });
                    }}
                    onSubmitApi={handleBookWalkIn}
                    bookingLoading={bookingLoading}
                    initialTime={walkInTime}
                    activeType={activeType}
                    isReceptionist={roleView === 'receptionist'}
                    selectedDateStr={formattedSelectedDate}
                    initialCustomerId={new URLSearchParams(location.search).get('khach_hang_id') || undefined}
                    initialServiceId={new URLSearchParams(location.search).get('goi_dich_vu_id') || undefined}
                    onDateChange={(d) => {
                      setStartDate(d);
                      setEndDate(d);
                    }}
                  />
                </div>
              ) : (
                <>
                  {viewMode === 'timeline' && (
                    <AppointmentCalendar
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
                      selectedDate={startDate}
                      setSelectedDate={(d) => {
                        setStartDate(d);
                        setEndDate(d);
                        setViewMode('timeline');
                      }}
                      setViewMode={setViewMode}
                      appointments={appointmentsToUse.filter(apt =>
                        (activeType === 'kham'
                          ? apt.loai_lich === 'kham_moi'
                          : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don')) &&
                        (!statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(apt.trang_thai)) &&
                        (!selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter))
                      )}
                      timeRange="custom"
                      startDate={startDate}
                      endDate={endDate}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      onSelectAppointment={scrollToAppointment}
                      activeStatusLabel={statusFilter ? KPI_BUCKET_LABELS[statusFilter] : null}
                      selectedStaffFilter={selectedStaffFilter}
                      staffList={staffToUse}
                    />
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar (Collapsible) */}
            {!isWalkInModalOpen && (
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
                    
                    {viewMode === 'timeline' && (
                      <UnassignedPanel
                        unassignedAppointments={unassignedAppointments}
                        onOpenDetailModal={handleOpenDetailModal}
                      />
                    )}
                    <DoctorWorkloadPanel 
                      doctorWorkloads={doctorWorkloads} 
                      activeType={activeType} 
                      selectedStaffId={selectedStaffFilter}
                      onSelectStaff={setSelectedStaffFilter}
                      periodLabel={periodLabel}
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

      {/* GLOBAL MODALS */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsToUse}
          staffList={staffToUse}
          activeRole={activeRole}
          assignRoomId={assignRoomId}
          setAssignRoomId={setAssignRoomId}
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
          selectedTimeSlot={selectedTimeSlot}
          setSelectedTimeSlot={setSelectedTimeSlot}
          rescheduleDate={rescheduleDate}
          setRescheduleDate={setRescheduleDate}
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
          treatmentDate={treatmentDate}
          setTreatmentDate={setTreatmentDate}
          treatmentTime={treatmentTime}
          setTreatmentTime={setTreatmentTime}
          bookingLoading={bookingLoading}
          onClose={() => setIsTreatmentModalOpen(false)}
          onSubmit={handleBookTreatment}
        />
      )}



      {/* COMMAND PALETTE (CTRL+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandShortcuts}
        appointments={appointmentsToUse}
        onOpenDetailModal={handleOpenDetailModal}
      />
    </div>
  );
}
