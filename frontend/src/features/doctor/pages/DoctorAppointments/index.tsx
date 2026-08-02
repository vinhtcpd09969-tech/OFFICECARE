import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { CheckCircle2 } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

import AppointmentCalendar from '../../../../components/appointments/AppointmentCalendar';
import AppointmentInfoModal from '../../../../components/appointments/AppointmentInfoModal';
import { AppointmentsFilterBar } from '../../../../components/appointments/ui/AppointmentsFilterBar';
import { AppointmentKpiCards } from '../../../../components/appointments/ui/AppointmentKpiCards';
import { CapacityView } from '../../../../components/appointments/ui/CapacityView';
import { getAppointments, getDoctorSchedules, DoctorAppointment, DoctorSchedule } from '../../api/doctor.api';
import { computeAppointmentKpiBuckets, KPI_BUCKET_STATUSES, KPI_BUCKET_LABELS, AppointmentKpiBuckets } from '../../../../utils/appointmentKpi';
import { ActiveFilterChip } from '../../../../components/appointments/ui/ActiveFilterChip';
import { getClinicalStatusConfig } from '../../../../components/appointmentStatusConfig';

const STATUS_CONFIG = getClinicalStatusConfig('doctor');

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);

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

  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for viewing finished/cancelled appointments
  const [selectedApt, setSelectedApt] = useState<any>(null);

  // Confirm Modal state for Checked-in ca
  const [confirmApt, setConfirmApt] = useState<any>(null);

  useEffect(() => {
    const pending = (location.state as any)?.pendingConfirmAppointment;
    if (pending) {
      setConfirmApt(pending);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  // Filter States
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'custom'>('7days');
  const [viewMode, setViewMode] = useState<'timeline' | 'capacity'>('capacity');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  // Lọc theo 1 trạng thái cụ thể khi bấm thẻ KPI — độc lập với số liệu trên thẻ (kpiStats tính từ
  // appointments gốc, không bị thu hẹp bởi filter này).
  const [statusFilter, setStatusFilter] = useState<Exclude<keyof AppointmentKpiBuckets, 'total'> | null>(null);

  // Calculate Active Interval
  const activeInterval = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [startDate, endDate]);

  // Fetch appointments and schedules
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startIso = activeInterval.start.toISOString();
      const endIso = activeInterval.end.toISOString();
      
      const [apptRes, schedRes] = await Promise.all([
        getAppointments(startIso, endIso),
        getDoctorSchedules()
      ]);
      
      setAppointments(apptRes.data);
      setSchedules(schedRes.data);
    } catch (error) {
      console.error('Lỗi khi tải lịch khám:', error);
    } finally {
      setLoading(false);
    }
  }, [activeInterval]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Giả lập staffList chứa chính bác sĩ đang đăng nhập để hiển thị 1 cột trên calendar
  const staffList = useMemo(() => {
    if (!user) return [];
    return [
      {
        id: user.id,
        chuyen_gia_id: user.id, // Doctor ID matches User ID in doctor layout resolve logic
        ho_ten: user.ho_ten || 'Bác sĩ',
        vai_tro: 'Bác sĩ'
      }
    ];
  }, [user]);

  // Ánh xạ schedules sang định dạng mà AppointmentCalendar hiểu
  const schedulesList = useMemo(() => {
    return schedules.map(s => ({
      nguoi_dung_id: s.nguoi_dung_id,
      ngay: s.ngay.substring(0, 10), // Tránh giờ giấc đằng sau nếu có
      gio_bat_dau: s.gio_bat_dau,
      gio_ket_thuc: s.gio_ket_thuc,
      trang_thai: s.trang_thai
    }));
  }, [schedules]);

  // Tính toán số liệu thống kê ca khám cho Bác sĩ dựa trên activeInterval — dùng chung 1 hàm với
  // Admin/Lễ tân/KTV (utils/appointmentKpi.ts) để cả 4 actor nhìn cùng 1 con số cho cùng 1 khái
  // niệm trạng thái, thay vì mỗi trang tự định nghĩa "waiting"/"completed"/"secondary" khác nhau.
  const kpiStats = useMemo(() => computeAppointmentKpiBuckets(appointments), [appointments]);

  // Search filter + lọc trạng thái (áp dụng cho cả timeline lẫn capacity view vì cả 2 đều dựa
  // trên danh sách này — xem filteredAppointmentsForDay/mappedAppointments bên dưới).
  const searchedAppointments = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    return appointments.filter(a => {
      const matchSearch = !lower ||
        a.ten_khach_hang?.toLowerCase().includes(lower) ||
        a.ma_lich_dat?.toLowerCase().includes(lower) ||
        a.so_dien_thoai?.toLowerCase().includes(lower);
      const matchStatus = !statusFilter || KPI_BUCKET_STATUSES[statusFilter].includes(a.trang_thai);
      return matchSearch && matchStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Mapped appointments for CapacityView compatibility
  const mappedAppointments = useMemo(() => {
    return searchedAppointments.map(apt => ({
      ...apt,
      loai_lich: 'kham_moi',
      bac_si_id: user?.id,
      chuyen_gia_id: user?.id
    }));
  }, [searchedAppointments, user]);

  // Daily filtered appointments for the timeline view
  const filteredAppointmentsForDay = useMemo(() => {
    const selectedDateStr = format(startDate, 'yyyy-MM-dd');
    return searchedAppointments.filter(apt => {
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
      return aptDateStr === selectedDateStr;
    });
  }, [searchedAppointments, startDate]);

  // Khi bác sĩ click vào 1 card hẹn trên calendar
  const handleOpenDetailModal = useCallback((apt: any) => {
    if (['cho_kham', 'dang_kham', 'da_checkin'].includes(apt.trang_thai)) {
      setConfirmApt(apt);
    } else {
      setSelectedApt(apt);
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI METRIC CARDS */}
      <AppointmentKpiCards
        role="doctor"
        kpis={kpiStats}
        viewMode={viewMode}
        timeRange={timeRange}
        activeType="kham"
        activeStatusFilter={statusFilter}
        onSelectStatus={setStatusFilter}
      />

      {statusFilter && (
        <ActiveFilterChip
          label={`Đang lọc: ${KPI_BUCKET_LABELS[statusFilter]}`}
          onClear={() => setStatusFilter(null)}
        />
      )}

      {/* Top filter bar inherited from Admin style */}
      <AppointmentsFilterBar
        startDate={startDate}
        endDate={endDate}
        onSelectDateRange={handleSelectDateRange}
        handleNavigateRange={handleNavigateRange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        activeType="kham"
        onToggleType={() => {}}
        canToggleType={false}
        setViewMode={setViewMode}
      />

      {/* Calendar Area */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-24 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang đồng bộ lịch trình...</p>
        </div>
      ) : (
        <>
          {viewMode === 'timeline' ? (
            <AppointmentCalendar
              appointments={filteredAppointmentsForDay}
              allAppointments={searchedAppointments}
              statusConfig={STATUS_CONFIG}
              handleOpenDetailModal={handleOpenDetailModal}
              staffList={staffList}
              schedulesList={schedulesList}
              selectedDateStr={format(startDate, 'yyyy-MM-dd')}
              viewMode="doctor"
            />
          ) : (
            <CapacityView
              selectedDate={startDate}
              setSelectedDate={(d) => {
                setStartDate(d);
                setEndDate(d);
                setViewMode('timeline');
              }}
              setViewMode={setViewMode}
              appointments={mappedAppointments}
              timeRange="custom"
              startDate={startDate}
              endDate={endDate}
              activeType="kham"
              searchTerm={searchTerm}
              onSelectAppointment={(id) => {
                const apt = appointments.find(a => String(a.id) === String(id));
                if (apt) handleOpenDetailModal(apt);
              }}
              activeStatusLabel={statusFilter ? KPI_BUCKET_LABELS[statusFilter] : null}
            />
          )}
        </>
      )}

      {/* Detail Modal for Finished/Cancelled Appointments */}
      <AppointmentInfoModal appointment={selectedApt} onClose={() => setSelectedApt(null)} />

      {/* Confirmation Modal for Checked-in Appointments */}
      {confirmApt && (() => {
        const isStarted = confirmApt.trang_thai === 'dang_kham';
        const getRemainingMinutes = (apt: any) => {
          // Thống nhất với HUD "Còn lại trong ca" ở trang Bàn làm việc (ClinicalAssessment/index.tsx)
          // — luôn tính theo giờ KẾT THÚC THEO LỊCH ĐÃ ĐẶT (ngay_gio_ket_thuc), không theo giờ mở bàn
          // thực tế, vì mốc cần cảnh báo là tràn slot/phòng đã đặt cho bệnh nhân sau, không phải ước
          // lượng cá nhân dựa trên lúc thật sự bắt đầu làm.
          if (!apt?.ngay_gio_ket_thuc) return 0;
          const end = new Date(apt.ngay_gio_ket_thuc);
          const remainingMs = end.getTime() - Date.now();
          return Math.max(0, Math.ceil(remainingMs / 60000));
        };
        const remaining = getRemainingMinutes(confirmApt);

        // Sớm/đúng giờ/trễ so với giờ hẹn — luôn hỏi lại 1 bước trước khi mở bàn khám, chỉ khác
        // nội dung cảnh báo, để BS ý thức rõ đang mở sớm hay ca đã trễ trước khi bấm tiếp.
        const scheduledStart = new Date(confirmApt.ngay_gio_bat_dau);
        const diffMinutes = Math.round((Date.now() - scheduledStart.getTime()) / 60000);
        const scheduledTimeStr = format(scheduledStart, 'HH:mm');
        const readyMessage = diffMinutes < 0
          ? `Ca này chưa tới giờ hẹn (${scheduledTimeStr}) — bạn có chắc muốn mở bàn khám ngay bây giờ không?`
          : diffMinutes > 5
            ? `Lịch hẹn này đã trễ ${diffMinutes} phút so với giờ hẹn (${scheduledTimeStr}) — bạn có chắc muốn mở bàn khám không?`
            : 'Bạn đã sẵn sàng cho ca khám này chưa?';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`size-12 rounded-full flex items-center justify-center ${isStarted ? 'bg-amber-50 dark:bg-amber-955/30 text-amber-500 animate-pulse' : 'bg-teal-50 dark:bg-teal-955/30 text-[#0D9488]'}`}>
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase">
                    {isStarted ? 'Ca khám đang thực hiện' : 'Xác nhận vào ca'}
                  </h3>
                  <p className="text-xs text-zinc-555 dark:text-zinc-400 font-bold">
                    Bệnh nhân: <span className="text-slate-800 dark:text-zinc-200">{confirmApt.ten_khach_hang}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    {confirmApt.ten_dich_vu}
                  </p>
                </div>
                
                <p className="text-xs font-bold text-secondary dark:text-zinc-355 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl w-full border border-zinc-100 dark:border-zinc-800">
                  {isStarted
                    ? `Ca khám này đã được mở trước đó. Dự kiến ca khám sẽ hoàn thành sau ${remaining} phút.`
                    : readyMessage}
                </p>

                <div className="flex items-center gap-3 w-full pt-3">
                  <button
                    onClick={() => setConfirmApt(null)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-355 py-2.5 rounded-xl font-bold transition-all text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      const aptId = confirmApt.id;
                      setConfirmApt(null);
                      navigate(`/doctor/appointments/${aptId}/assess`);
                    }}
                    className={`flex-1 text-white py-2.5 rounded-xl font-bold transition-all text-xs shadow-md ${isStarted ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' : 'bg-primary hover:bg-primary-hover shadow-primary/10'}`}
                  >
                    {isStarted ? 'Vào bàn khám' : 'Mở bàn khám'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
