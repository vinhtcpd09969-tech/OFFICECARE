import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { CheckCircle2 } from 'lucide-react';
import { format, startOfWeek, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

import AppointmentCalendar from '../../../admin/components/appointments/AppointmentCalendar';
import AppointmentInfoModal from '../../../admin/components/appointments/AppointmentInfoModal';
import { AppointmentsFilterBar } from '../../../admin/components/appointments/ui/AppointmentsFilterBar';
import { AppointmentKpiCards } from '../../../admin/components/appointments/ui/AppointmentKpiCards';
import { CapacityView } from '../../../admin/components/appointments/ui/CapacityView';
import { getAppointments, getDoctorSchedules, DoctorAppointment, DoctorSchedule } from '../../api/doctor.api';

const STATUS_CONFIG: any = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-955/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30' },
  da_checkin: { label: 'Đã check-in', color: 'bg-teal-50 text-teal-700 dark:bg-teal-955/30 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30' },
  cho_kham: { label: 'Chờ khám', color: 'bg-blue-50 text-blue-700 dark:bg-blue-955/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' },
  dang_kham: { label: 'Đang khám', color: 'bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse' },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' },
  da_huy: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 dark:bg-rose-955/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' },
  khong_den: { label: 'Không đến', color: 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400' }
};

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for viewing finished/cancelled appointments
  const [selectedApt, setSelectedApt] = useState<any>(null);

  // Confirm Modal state for Checked-in ca
  const [confirmApt, setConfirmApt] = useState<any>(null);

  // Filter States
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'custom'>('today');
  const [viewMode, setViewMode] = useState<'timeline' | 'capacity'>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Calculate Active Interval
  const activeInterval = useMemo(() => {
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
    } else { // month
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }, [selectedDate, timeRange]);

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
      console.error('Lỗi khi tải lịch hẹn bác sĩ:', error);
    } finally {
      setLoading(false);
    }
  }, [activeInterval]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate dates
  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
      return;
    }

    const amount = timeRange === 'month' ? 1 : timeRange === '7days' ? 7 : 1;
    if (timeRange === 'month') {
      const monthFn = direction === 'next' ? addMonths : subMonths;
      setSelectedDate(prev => monthFn(prev, 1));
    } else {
      const fn = direction === 'next' ? addDays : subDays;
      setSelectedDate(prev => fn(prev, amount));
    }
  };

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

  // Tính toán số liệu thống kê ca khám cho Bác sĩ dựa trên activeInterval
  const kpiStats = useMemo(() => {
    const total = appointments.length;
    const waiting = appointments.filter(a => ['da_checkin', 'cho_kham'].includes(a.trang_thai)).length;
    const completed = appointments.filter(a => a.trang_thai === 'dang_kham').length;
    const now = Date.now();
    const secondary = appointments.filter(a => 
      ['da_xac_nhan', 'da_checkin', 'cho_kham'].includes(a.trang_thai) &&
      new Date(a.ngay_gio_bat_dau).getTime() < now
    ).length;

    return {
      total,
      waiting,
      completed,
      secondary
    };
  }, [appointments]);

  // Search filter
  const searchedAppointments = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    const lower = searchTerm.toLowerCase();
    return appointments.filter(a => 
      a.ten_khach_hang?.toLowerCase().includes(lower) ||
      a.ma_lich_dat?.toLowerCase().includes(lower) ||
      a.so_dien_thoai?.toLowerCase().includes(lower)
    );
  }, [appointments, searchTerm]);

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
    const selectedDateStr = selectedDate.toLocaleDateString('fr-CA');
    return searchedAppointments.filter(apt => {
      const aptDateStr = new Date(apt.ngay_gio_bat_dau).toLocaleDateString('fr-CA');
      return aptDateStr === selectedDateStr;
    });
  }, [searchedAppointments, selectedDate]);

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
      />

      {/* Top filter bar inherited from Admin style */}
      <AppointmentsFilterBar
        timeRange={timeRange}
        setTimeRange={(range) => {
          setTimeRange(range);
          if (range === 'today') {
            setViewMode('timeline');
          } else {
            setViewMode('capacity');
          }
        }}
        startDateOfWeek={activeInterval.start}
        endDateOfWeek={activeInterval.end}
        handleNavigateDay={handleNavigateDay}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        selectedDate={selectedDate}
        activeType="kham"
        onToggleType={() => {}}
        canToggleType={false}
        setViewMode={setViewMode}
      />

      {/* Dynamic Navigation Indicator for Timeline view */}
      {viewMode === 'timeline' && (
        <div className="flex items-center justify-center bg-slate-55/40 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 p-3 rounded-[20px] backdrop-blur-md">
          <div className="text-xs font-bold text-slate-505 dark:text-zinc-400 flex items-center gap-2">
            <span>Đang xem lịch khám ngày:</span>
            <span className="bg-teal-55 dark:bg-teal-955/20 text-[#0d9488] dark:text-teal-450 px-2.5 py-1 rounded-xl border border-teal-100/30 font-black uppercase tracking-wide">
              {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}
            </span>
          </div>
        </div>
      )}

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
              timeSlots={TIME_SLOTS}
              appointments={filteredAppointmentsForDay}
              allAppointments={searchedAppointments}
              statusConfig={STATUS_CONFIG}
              handleOpenDetailModal={handleOpenDetailModal}
              staffList={staffList}
              schedulesList={schedulesList}
              selectedDateStr={selectedDate.toLocaleDateString('fr-CA')}
              viewMode="doctor"
              currentStaffId={user?.id}
            />
          ) : (
            <CapacityView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setViewMode={setViewMode}
              appointments={mappedAppointments}
              timeRange={timeRange}
              activeType="kham"
              searchTerm={searchTerm}
              onSelectAppointment={(id) => {
                const apt = appointments.find(a => String(a.id) === String(id));
                if (apt) handleOpenDetailModal(apt);
              }}
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
          if (!apt || !apt.nhat_ky_ngay_tao) return 0;
          const start = new Date(apt.nhat_ky_ngay_tao);
          const serviceStart = new Date(apt.ngay_gio_bat_dau);
          const serviceEnd = new Date(apt.ngay_gio_ket_thuc);
          const durationMs = serviceEnd.getTime() - serviceStart.getTime();
          const durationMinutes = Math.round(durationMs / 60000) || 30;
          
          const completionTime = start.getTime() + durationMinutes * 60000;
          const remainingMs = completionTime - Date.now();
          return Math.max(0, Math.ceil(remainingMs / 60000));
        };
        const remaining = getRemainingMinutes(confirmApt);

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
                    : 'Bạn đã sẵn sàng cho ca khám này chưa?'}
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
