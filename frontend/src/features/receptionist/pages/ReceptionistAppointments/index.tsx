import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { format, addDays, subDays, startOfWeek, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Import Shared Components
import AppointmentCalendar from '../../../admin/components/appointments/AppointmentCalendar';
import AppointmentDetailModal from '../../../admin/components/appointments/DetailModal';
import WalkInBookingModal from '../../../admin/components/appointments/WalkInBookingModal';
import TreatmentBookingModal from '../../../admin/components/appointments/TreatmentBookingModal';

// Import Shared Hooks & UI
import { useAppointmentsData } from '../../../admin/components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../admin/components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../admin/components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../admin/components/appointments/ui/AppointmentsFilterBar';
import { PendingContactPanel } from '../../../admin/components/appointments/ui/PendingContactPanel';
import { OverdueCheckinPanel } from '../../../admin/components/appointments/ui/OverdueCheckinPanel';
import { PendingPaymentPanel } from '../../../admin/components/appointments/ui/PendingPaymentPanel';
import { isAwaitingPaymentForList } from '../../../../utils/billing';
import { CapacityView } from '../../../admin/components/appointments/ui/CapacityView';
import { standardTimeSlots, statusConfig } from '../../../admin/components/appointments/constants';
import { ViewMode, TimeRange } from '../../../admin/components/appointments/types';

export default function ReceptionistAppointments() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');

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
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    timeRange,
    setTimeRange,
    refetch,
    navigate,
    roleView: 'receptionist',
    isDemoMode: false,
    activeType,
    setActiveType
  });

  const focusTimerRef = useRef<any>(null);

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
    const dateParam = params.get('date');
    const rangeParam = params.get('range');
    const viewParam = params.get('view');

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }
    if (rangeParam && ['today', '7days', 'month'].includes(rangeParam)) {
      setTimeRange(rangeParam as TimeRange);
    }
    if (viewParam && ['timeline', 'capacity'].includes(viewParam)) {
      setViewMode(viewParam as ViewMode);
    }

    const khId = params.get('khach_hang_id');
    const svcId = params.get('goi_dich_vu_id');
    if (khId && svcId) {
      setActiveType('dieu_tri');
      setIsWalkInModalOpen(true);
    }
  }, [location.search, setActiveType, setIsWalkInModalOpen]);

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
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    params.set('range', timeRange);
    params.set('view', viewMode);
    
    const newSearch = `?${params.toString()}`;
    if (location.search !== newSearch) {
      navigate(location.pathname + newSearch, { replace: true });
    }
  }, [selectedDate, timeRange, viewMode, navigate, location.pathname]);

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

  const removeAccents = (str: string) => {
    return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  // Filtered appointments list for the main daily schedule view
  const filteredAppointments = appointments.filter(apt => {
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
    
    const cleanSearch = removeAccents(searchTerm);
    const matchSearch = searchTerm === '' ||
      removeAccents(apt.ma_lich_dat).includes(cleanSearch) ||
      removeAccents(apt.ten_khach_hang).includes(cleanSearch) ||
      (apt.so_dien_thoai || '').includes(searchTerm.trim());

    const allowedStatuses = ['chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh', 'da_huy', 'khong_den'];
    
    // Thêm ca chưa xác nhận đã quá 10 phút
    const graceTimeMs = 10 * 60 * 1000;
    const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
    const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
    const isOverdueUnconfirmed = apt.trang_thai === 'chua_xac_nhan' && isGracePassed;

    const isAllowed = allowedStatuses.includes(apt.trang_thai) || isOverdueUnconfirmed;
    return isAllowed && matchDate && matchType && matchSearch && apt.trang_thai !== 'giu_cho';
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
    
    const interval = getActiveInterval();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau || '');
      return (
        aptDate >= interval.start &&
        aptDate <= interval.end &&
        matchType(apt) &&
        apt.trang_thai !== 'giu_cho'
      );
    });
  };
  const kpiAppointments = getKpiAppointments();

  const kpis = {
    total: kpiAppointments.length,
    waiting: kpiAppointments.filter(a => ['chua_xac_nhan', 'cho_xac_nhan'].includes(a.trang_thai)).length,
    completed: pendingPaymentAppointments.length,
    secondary: kpiAppointments.filter(a => ['da_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(a.trang_thai)).length,
  };

  return (
    <div className="space-y-6 max-w-full font-jakarta">
      <AnimatePresence mode="wait">
        <motion.div
          key="unified-appointment-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6"
        >
          {/* KPI METRIC CARDS */}
          <AppointmentKpiCards
            role="receptionist"
            kpis={kpis}
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
            canToggleType={true}
            setViewMode={setViewMode}
          />

          {viewMode === 'timeline' && (
            <div className="flex items-center justify-center bg-slate-55/40 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 p-3 rounded-[20px] backdrop-blur-md">
              <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                <span>Đang xem lịch ngày:</span>
                <span className="font-extrabold text-[#0D9488] uppercase tracking-wide bg-[#0D9488]/5 dark:bg-teal-950/20 px-3 py-1 rounded-lg border border-[#0D9488]/15">
                  {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
            </div>
          )}

          {/* MAIN CALENDAR / TIMELINE WORKSPACE */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 w-full min-w-0">
              {isWalkInModalOpen ? (
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
                  selectedDateStr={formattedSelectedDate}
                  initialCustomerId={new URLSearchParams(location.search).get('khach_hang_id') || undefined}
                  initialServiceId={new URLSearchParams(location.search).get('goi_dich_vu_id') || undefined}
                />
              ) : (
                <>
                  {viewMode === 'timeline' && (
                    <AppointmentCalendar
                      timeSlots={standardTimeSlots}
                      appointments={filteredAppointments}
                      statusConfig={statusConfig}
                      handleOpenDetailModal={handleOpenDetailModal}
                      staffList={staffList}
                      schedulesList={schedulesList}
                      allAppointments={appointments}
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
                      appointments={appointments.filter(apt =>
                        activeType === 'kham'
                          ? apt.loai_lich === 'kham_moi'
                          : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don')
                      )}
                      timeRange={timeRange}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      onSelectAppointment={scrollToAppointment}
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
        </motion.div>
      </AnimatePresence>

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
