import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { format, addDays, isSameDay } from 'date-fns';

// Import Shared Components
import AppointmentCalendar from '../../../../components/appointments/AppointmentCalendar';
import AppointmentDetailModal from '../../../../components/appointments/DetailModal';
import WalkInBookingModal from '../../../../components/WalkInBookingModal';
import TreatmentBookingModal from '../../../../components/appointments/TreatmentBookingModal';

// Import Shared Hooks & UI
import { useAppointmentsData } from '../../../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { PendingContactPanel } from '../../../../components/appointments/ui/PendingContactPanel';
import { OverdueCheckinPanel } from '../../../../components/appointments/ui/OverdueCheckinPanel';
import { PendingPaymentPanel } from '../../../../components/appointments/ui/PendingPaymentPanel';
import { isAwaitingPaymentForList } from '../../../../utils/billing';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { statusConfig } from '../../../../components/appointmentStatusConfig';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { getSmartSearchScore } from '../../../../utils/smartSearch';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';
import { ViewMode } from '../../../../components/appointments/types';

export default function ReceptionistAppointments() {
  const location = useLocation();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return addDays(today, 6);
  });

  const [viewMode, setViewMode] = useState<ViewMode>('capacity');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

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

  // Lọc theo 1 trạng thái cụ thể khi bấm thẻ KPI — độc lập với số liệu trên thẻ (xem
  // ManageAppointments/index.tsx cho cùng pattern).
  const [statusFilter, setStatusFilter] = useState<Exclude<keyof AppointmentKpiBuckets, 'total'> | null>(null);

  // Fetch appointments and resources (isReceptionist = true)
  const {
    appointments,
    staffList,
    roomsList,
    schedulesList,
    services,
    packages,
    loading,
    refetch
  } = useAppointmentsData(true);

  // Use the appointment actions hook
  const {
    selectedAppointment,
    isDetailModalOpen,
    setIsDetailModalOpen,
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
    bookingLoading,
    isTreatmentModalOpen,
    setIsTreatmentModalOpen,
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
    appointments,
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
    roleView: 'receptionist',
    isDemoMode: false,
    activeType,
    setActiveType
  });

  const focusTimerRef = useRef<any>(null);
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

  // Unmount cleanup only
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  // Parse URL search parameters on load
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
  }, [location.search, setActiveType, setIsWalkInModalOpen, startDate, endDate, viewMode]);

  // Handle Mascot redirection focus
  const mascotTargetAppointments = location.search;
  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(location.search);
    const focusAptId = params.get('appointmentId');
    const triggerFocus = params.get('triggerFocus');

    if (focusAptId && triggerFocus === 'true') {
      setIsWalkInModalOpen(false);
      scrollToAppointment(focusAptId);
      
      // Clean up parameter without re-triggering timers
      const newParams = new URLSearchParams(location.search);
      newParams.delete('triggerFocus');
      const newSearch = `?${newParams.toString()}`;
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [mascotTargetAppointments, scrollToAppointment, navigate, location.pathname, loading, setIsWalkInModalOpen]);

  // Update URL search parameters when filtering state changes
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

  const removeAccents = (str: string) => {
    return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Filtered appointments list for the main daily schedule view
  const filteredAppointments = appointments.filter(apt => {
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

    const allowedStatuses = ['chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh', 'da_huy', 'khong_den'];
    
    // Thêm ca chưa xác nhận đã quá 10 phút
    const graceTimeMs = 10 * 60 * 1000;
    const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
    const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
    const isOverdueUnconfirmed = apt.trang_thai === 'chua_xac_nhan' && isGracePassed;

    const isAllowed = allowedStatuses.includes(apt.trang_thai) || isOverdueUnconfirmed;
    const matchStatus = !statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(apt.trang_thai);
    return isAllowed && matchDate && matchType && matchSearch && matchStatus && apt.trang_thai !== 'giu_cho';
  });

  // Danh sách các ca khám chưa xác nhận đã quá 10 phút (cho toàn bộ các ngày)
  const pendingContactAppointments = appointments.filter(apt => {
    const graceTimeMs = 10 * 60 * 1000;
    const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
    const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
    return apt.trang_thai === 'chua_xac_nhan' && isGracePassed;
  });

  // Danh sách các ca quá giờ chưa check-in (chỉ tính ngày hôm nay và trạng thái chưa check-in)
  const overdueCheckinAppointments = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    return appointments.filter(apt => {
      if (!['da_xac_nhan', 'cho_xac_nhan'].includes(apt.trang_thai)) {
        return false;
      }
      const start = new Date(apt.ngay_gio_bat_dau);
      const isToday = start.toDateString() === todayStr;
      return isToday && start.getTime() <= now.getTime();
    });
  }, [appointments]);

  // Danh sách các ca cần thanh toán (cho toàn bộ các ngày, theo loại dịch vụ đang chọn)
  const pendingPaymentAppointments = useMemo(() => {
    return appointments.filter(isAwaitingPaymentForList);
  }, [appointments]);

  const getKpiAppointments = () => {
    const matchType = (apt: any) => activeType === 'kham'
      ? apt.loai_lich === 'kham_moi'
      : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
    
    const startBound = new Date(startDate);
    startBound.setHours(0, 0, 0, 0);
    const endBound = new Date(endDate);
    endBound.setHours(23, 59, 59, 999);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau || '');
      return (
        aptDate >= startBound &&
        aptDate <= endBound &&
        matchType(apt) &&
        apt.trang_thai !== 'giu_cho'
      );
    });
  };
  const kpiAppointments = getKpiAppointments();

  const kpis = computeAppointmentKpiBuckets(kpiAppointments);

  return (
    <div className="space-y-6 max-w-full font-jakarta">
      {/* KPI METRIC CARDS */}
      <AppointmentKpiCards
        role="receptionist"
        kpis={kpis}
        viewMode={viewMode}
        timeRange="custom"
        activeType={activeType}
        activeStatusFilter={statusFilter}
            onSelectStatus={setStatusFilter}
          />

          {statusFilter && (
            <ActiveFilterChip
              label={`Đang lọc: ${KPI_BUCKET_LABELS[statusFilter]}`}
              onClear={() => setStatusFilter(null)}
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

          {/* MAIN CALENDAR / TIMELINE WORKSPACE */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Left Content Area */}
            <div className="flex-1 w-full min-w-0">
              {isWalkInModalOpen ? (
                <div ref={bookingFormRef} className="scroll-mt-6">
                  <WalkInBookingModal
                    roomsList={roomsList}
                    staffList={staffList}
                    appointments={appointments}
                    schedulesList={schedulesList}
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
                    isReceptionist={true}
                    selectedDateStr={format(startDate, 'yyyy-MM-dd')}
                    initialCustomerId={new URLSearchParams(location.search).get('khach_hang_id') || undefined}
                    initialServiceId={new URLSearchParams(location.search).get('goi_dich_vu_id') || undefined}
                  />
                </div>
              ) : (
                <>
                  {viewMode === 'timeline' && (
                    <AppointmentCalendar
                      appointments={filteredAppointments}
                      statusConfig={statusConfig}
                      handleOpenDetailModal={handleOpenDetailModal}
                      staffList={staffList}
                      schedulesList={schedulesList}
                      allAppointments={appointments}
                      selectedDateStr={format(startDate, 'yyyy-MM-dd')}
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
                      appointments={appointments.filter(apt =>
                        (activeType === 'kham'
                          ? apt.loai_lich === 'kham_moi'
                          : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don')) &&
                        (!statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(apt.trang_thai))
                      )}
                      timeRange="custom"
                      startDate={startDate}
                      endDate={endDate}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      onSelectAppointment={scrollToAppointment}
                      activeStatusLabel={statusFilter ? KPI_BUCKET_LABELS[statusFilter] : null}
                    />
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar (Collapsible) */}
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
                  {pendingContactAppointments.length === 0 &&
                   overdueCheckinAppointments.length === 0 &&
                   pendingPaymentAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-zinc-800/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-center text-slate-400 dark:text-zinc-550 gap-2.5">
                      <span className="text-2xl">🎉</span>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Mọi việc đã hoàn tất!</p>
                      <p className="text-[10px] text-slate-400">Không có lịch hẹn cần liên hệ, quá giờ chưa check-in, hay ca chờ thanh toán.</p>
                    </div>
                  ) : (
                    <>
                      <PendingContactPanel
                        pendingAppointments={pendingContactAppointments}
                        onOpenDetailModal={handleOpenDetailModal}
                      />
                      <OverdueCheckinPanel
                        appointments={overdueCheckinAppointments}
                        onOpenDetailModal={handleOpenDetailModal}
                      />
                      <PendingPaymentPanel
                        appointments={pendingPaymentAppointments}
                        onOpenDetailModal={handleOpenDetailModal}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="w-4 bg-slate-50/50 dark:bg-zinc-800/10 border-l border-slate-100 dark:border-zinc-800 rounded-r-2xl" />
              )}
            </div>
          </div>

      {/* GLOBAL MODALS */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsList}
          staffList={staffList}
          activeRole="receptionist"
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
          appointments={appointments}
          schedulesList={schedulesList}
          isReceptionistOverride={true}
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
    </div>
  );
}
