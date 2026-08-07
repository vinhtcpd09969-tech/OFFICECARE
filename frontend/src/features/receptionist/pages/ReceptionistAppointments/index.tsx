import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { format, addDays, isSameDay } from 'date-fns';

// Import Shared Components
import AppointmentDetailModal from '../../../../components/appointments/DetailModal';
import WalkInBookingModal from '../../../../components/WalkInBookingModal';
import TreatmentBookingModal from '../../../../components/appointments/TreatmentBookingModal';

// Import Shared Hooks & UI
import { useAppointmentsData } from '../../../../components/appointments/hooks/useAppointmentsData';
import { useAppointmentActions } from '../../../../components/appointments/hooks/useAppointmentActions';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { TodayFlowBoard } from '../../../../components/appointments/ui/TodayFlowBoard';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
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
  const [activeType, setActiveType] = useState<'kham' | 'dieu_tri'>('kham');
  // Lễ tân được lọc xem theo nhân sự giống Admin (chỉ không có quyền phân bổ/đổi nhân sự cho lịch).
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

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
    selectedBuoi,
    setSelectedBuoi,
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
      return aptDate >= startBound && aptDate <= endBound && matchType(apt);
    });
  };
  const kpiAppointments = getKpiAppointments();

  const kpis = computeAppointmentKpiBuckets(kpiAppointments);

  // A5 — 1 màn hình duy nhất cho mọi ngày đơn lẻ: viewMode 'timeline' (dù đang xem hôm nay hay ngày
  // khác) luôn dùng TodayFlowBoard (nhóm dòng chảy) — không còn tách theo "hôm nay"/"ngày khác",
  // không còn rơi về AppointmentCalendar cũ dạng slot-giờ. Chỉ khoảng nhiều ngày (viewMode capacity,
  // "Bảng công suất") mới dùng CapacityView + 4 thẻ KPI riêng.
  const isCapacityView = viewMode === 'capacity';

  const dayTypedAppointments = useMemo(() => {
    const dayStr = format(startDate, 'yyyy-MM-dd');
    return appointments.filter(apt => format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd') === dayStr);
  }, [appointments, startDate]);

  const handleQuickCheckin = async (apt: any) => {
    await handleUpdateAppointmentFields(String(apt.id), { trang_thai: 'da_checkin' }, `Đã check-in cho ${apt.ten_khach_hang || apt.ho_ten_khach || 'khách hàng'}`);
  };

  // Danh sách nhân sự đang trực đúng ngày đang xem — nguồn cho dropdown lọc trong TodayFlowBoard.
  // Lễ tân được xem/lọc giống Admin, chỉ không có quyền phân bổ/đổi nhân sự cho lịch hẹn (đó là thao
  // tác riêng trong DetailModal, không liên quan tới bộ lọc xem này).
  const targetWorkloadRole = activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên';
  const formattedSelectedDate = format(startDate, 'yyyy-MM-dd');
  const onDutyStaffOptions = useMemo(() => {
    return staffList
      .filter((s) => s.vai_tro === targetWorkloadRole)
      .filter((doc) => schedulesList.some((s) =>
        String(s.nguoi_dung_id) === String(doc.id) &&
        s.ngay === formattedSelectedDate &&
        s.trang_thai === 'hoat_dong'
      ))
      .map((doc) => ({ id: String(doc.id), name: doc.ho_ten }));
  }, [staffList, schedulesList, targetWorkloadRole, formattedSelectedDate]);

  return (
    <div className="space-y-6 max-w-full font-jakarta">
      {/* KPI METRIC CARDS — chỉ hiện ở "Bảng công suất" (nhiều ngày): statusFilter mà các thẻ này
          set không tác động tới TodayFlowBoard (bảng dòng chảy có nhóm/anchor-nav riêng, cố ý không
          lọc theo trạng thái — xem lý do trong kế hoạch A5), nên giữ card ở màn hình 1 ngày chỉ tạo
          cảm giác "lọc được" trong khi bấm vào không đổi gì trên bảng bên dưới. */}
      {isCapacityView && (
        <>
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
        </>
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
              dropdown ngay trong TodayFlowBoard, cạnh Sức khỏe ca — giống Admin). */}
          <div className="w-full">
              {selectedStaffFilter && (
                <div className="mb-4">
                  <ActiveFilterChip
                    label={`Lịch ${activeType === 'kham' ? 'Bác sĩ' : 'Kỹ thuật viên'}: ${staffList.find(s => String(s.id) === String(selectedStaffFilter))?.ho_ten || 'Chuyên gia'}`}
                    onClear={() => setSelectedStaffFilter(null)}
                  />
                </div>
              )}

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
                    <TodayFlowBoard
                      appointments={dayTypedAppointments}
                      activeType={activeType}
                      searchTerm={searchTerm}
                      staffList={staffList}
                      schedulesList={schedulesList}
                      selectedDateStr={format(startDate, 'yyyy-MM-dd')}
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
                      appointments={appointments.filter(apt =>
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
                      staffList={staffList}
                    />
                  )}
                </>
              )}
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
