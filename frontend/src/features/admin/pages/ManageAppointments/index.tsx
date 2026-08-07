import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Settings
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';

// Import Components
import AppointmentDetailModal from '../../../../components/appointments/DetailModal';
import TreatmentBookingModal from '../../../../components/appointments/TreatmentBookingModal';
import WalkInBookingModal from '../../../../components/WalkInBookingModal';

// Import Module Hooks & UI Components
import { useAppointmentsData } from '../../../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { TodayFlowBoard } from '../../../../components/appointments/ui/TodayFlowBoard';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';
import { RoleView, ViewMode } from '../../../../components/appointments/types';

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
    selectedBuoi,
    setSelectedBuoi,
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

  const getKpiAppointments = () => {
    const matchType = (apt: any) => activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const filterByStaff = (apt: any) => !selectedStaffFilter || String(apt.bac_si_id) === String(selectedStaffFilter);

    if (viewMode === 'timeline') {
      return appointmentsToUse.filter(apt => {
        const aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        return aptDateStr === formattedSelectedDate && matchType(apt) && filterByStaff(apt);
      });
    } else {
      const startBound = new Date(startDate);
      startBound.setHours(0, 0, 0, 0);
      const endBound = new Date(endDate);
      endBound.setHours(23, 59, 59, 999);
      return appointmentsToUse.filter(apt => {
        const aptDate = new Date(apt.ngay_gio_bat_dau || '');
        return aptDate >= startBound && aptDate <= endBound && matchType(apt) && filterByStaff(apt);
      });
    }
  };

  const kpiAppointments = getKpiAppointments();

  const kpis = computeAppointmentKpiBuckets(kpiAppointments);

  // A5 — 1 màn hình duy nhất cho mọi ngày đơn lẻ, dùng chung với Lễ tân: viewMode 'timeline' (dù
  // đang xem hôm nay hay ngày khác) luôn dùng TodayFlowBoard (nhóm dòng chảy) — không còn rơi về
  // AppointmentCalendar cũ (dạng slot-giờ). Chỉ "Bảng công suất" (nhiều ngày) mới khác, có 8 thẻ KPI
  // + danh sách tổng hợp riêng — đúng góp ý "lễ tân và admin xem lịch không khác gì nhau".
  const isCapacityView = viewMode === 'capacity';

  const dayAppointmentsForBoard = useMemo(() => {
    const dayStr = format(startDate, 'yyyy-MM-dd');
    return appointmentsToUse.filter((apt) => format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === dayStr);
  }, [appointmentsToUse, startDate]);

  const handleQuickCheckin = async (apt: any) => {
    await handleUpdateAppointmentFields(String(apt.id), { trang_thai: 'da_checkin' }, `Đã check-in cho ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách hàng'}`);
  };

  // Chỉ còn kiểm tra CA TRỰC — bỏ kiểm tra "trùng giờ" giữa 2 lịch hẹn của cùng nhân sự.
  // Lý do: từ khi đặt lịch chuyển sang mô hình theo BUỔI, mọi lịch hẹn trong cùng 1 buổi đều
  // mang cùng mốc ngay_gio_bat_dau/ngay_gio_ket_thuc NOMINAL, nên 1 nhân sự có ≥2 lịch trong
  // cùng buổi là bình thường (phục vụ tuần tự qua hàng đợi), không phải xung đột.
  const getIsDoctorUnavailable = (apt: any, doc: any) => {
    if (!doc) return false;

    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;

    const staffSchedules = schedulesToUse.filter(s =>
      String(s.nguoi_dung_id) === String(doc.id) &&
      s.ngay === aptDateStr
    );

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    return !activeSchedule;
  };

  const managerMascotApts = appointmentsToUse.filter(apt => {
    const isClinical = apt.loai_lich === 'kham_moi' || apt.loai_lich === 'dich_vu_don';
    const isActive = apt.trang_thai === 'da_xac_nhan';
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

  const targetWorkloadRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';

  // Danh sách nhân sự đang trực đúng ngày đang xem — nguồn cho dropdown lọc trong TodayFlowBoard
  // (thay cho card DoctorWorkloadPanel cũ). Chỉ có ý nghĩa ở màn hình 1 ngày (viewMode timeline).
  const onDutyStaffOptions = useMemo(() => {
    return staffToUse
      .filter((s) => s.vai_tro === targetWorkloadRole)
      .filter((doc) => schedulesToUse.some((s) =>
        String(s.nguoi_dung_id) === String(doc.id) &&
        s.ngay === formattedSelectedDate &&
        s.trang_thai === 'hoat_dong'
      ))
      .map((doc) => ({ id: String(doc.id), name: doc.ho_ten }));
  }, [staffToUse, schedulesToUse, targetWorkloadRole, formattedSelectedDate]);

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
        window.dispatchEvent(new Event('theme-change'));
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
      {/* KPI METRIC CARDS — chỉ hiện ở "Bảng công suất" (nhiều ngày): statusFilter mà các thẻ này
          set không tác động tới TodayFlowBoard (bảng dòng chảy có anchor-nav riêng, cố ý không lọc
          theo trạng thái — cùng lý do đã áp cho ReceptionistAppointments). */}
      {isCapacityView && (
        <AppointmentKpiCards
          role="admin"
          kpis={kpis}
          viewMode={viewMode}
          timeRange="custom"
          activeType={activeType}
          activeStatusFilter={statusFilter}
          onSelectStatus={setStatusFilter}
        />
      )}

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

          {/* MAIN WORKBOARD — full-width, không còn sidebar riêng (bộ lọc nhân sự đã chuyển vào
              dropdown ngay trong TodayFlowBoard, cạnh Sức khỏe ca). */}
          <div className="w-full">
            {selectedStaffFilter && (
                <div className="mb-4">
                  <ActiveFilterChip
                    label={`Lịch ${activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên'}: ${staffToUse.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'}`}
                    onClear={() => setSelectedStaffFilter(null)}
                  />
                </div>
              )}

              {isCapacityView && statusFilter && (
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
                    <TodayFlowBoard
                      appointments={dayAppointmentsForBoard}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      staffList={staffToUse}
                      schedulesList={schedulesToUse}
                      selectedDateStr={formattedSelectedDate}
                      onOpenDetailModal={handleOpenDetailModal}
                      onQuickCheckin={handleQuickCheckin}
                      onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
                      focusAppointmentId={new URLSearchParams(location.search).get('appointmentId') || undefined}
                      staffFilterId={selectedStaffFilter}
                      staffFilterOptions={onDutyStaffOptions}
                      onStaffFilterChange={setSelectedStaffFilter}
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
          selectedBuoi={selectedBuoi}
          setSelectedBuoi={setSelectedBuoi}
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
