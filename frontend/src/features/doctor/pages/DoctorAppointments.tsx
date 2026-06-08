import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import AppointmentCalendar from '../../admin/components/AppointmentCalendar';
import { getAppointments, getDoctorSchedules, DoctorAppointment, DoctorSchedule } from '../api/doctor.api';

const STATUS_CONFIG: any = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30' },
  da_checkin: { label: 'Đã check-in', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30' },
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const selectedDateStr = useMemo(() => {
    return selectedDate.toLocaleDateString('fr-CA'); // YYYY-MM-DD format
  }, [selectedDate]);

  // Fetch appointments and schedules
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startOfDay = `${selectedDateStr}T00:00:00.000Z`;
      const endOfDay = `${selectedDateStr}T23:59:59.999Z`;
      
      const [apptRes, schedRes] = await Promise.all([
        getAppointments(startOfDay, endOfDay),
        getDoctorSchedules()
      ]);
      
      setAppointments(apptRes.data);
      setSchedules(schedRes.data);
    } catch (error) {
      console.error('Lỗi khi tải lịch hẹn bác sĩ:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate dates
  const handlePrevDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
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

  // Khi bác sĩ click vào 1 card hẹn trên calendar
  const handleOpenDetailModal = useCallback((apt: any) => {
    // Nếu trạng thái là chờ khám hoặc đang khám, chuyển sang màn hình khám
    if (['cho_kham', 'dang_kham', 'da_checkin'].includes(apt.trang_thai)) {
      navigate(`/doctor/appointments/${apt.id}/assess`);
    } else {
      // Đã hoàn thành hoặc hủy, mở modal xem chi tiết chẩn đoán
      setSelectedApt(apt);
      setIsDetailOpen(true);
    }
  }, [navigate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Calendar Header Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-secondary dark:text-zinc-100 tracking-tight uppercase">Lịch khám của tôi</h1>
          <p className="text-zinc-450 dark:text-zinc-500 text-[10px] font-bold uppercase mt-0.5">Thời gian biểu khám lâm sàng hàng ngày</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 self-center sm:self-auto">
          <button 
            onClick={handlePrevDay}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 rounded-xl border border-zinc-250/20 dark:border-zinc-700 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-250/20 dark:border-zinc-700 rounded-xl text-xs font-bold text-secondary dark:text-zinc-150">
            <CalendarIcon size={14} className="text-primary" />
            <span>
              {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <button 
            onClick={handleNextDay}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 rounded-xl border border-zinc-250/20 dark:border-zinc-700 transition-all"
          >
            <ChevronRight size={16} />
          </button>

          <button 
            onClick={handleToday}
            className="ml-2 text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* Calendar Area */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-24 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang đồng bộ lịch trình...</p>
        </div>
      ) : (
        <AppointmentCalendar
          timeSlots={TIME_SLOTS}
          appointments={appointments}
          allAppointments={appointments}
          statusConfig={STATUS_CONFIG}
          handleOpenDetailModal={handleOpenDetailModal}
          staffList={staffList}
          schedulesList={schedulesList}
          selectedDateStr={selectedDateStr}
          viewMode="doctor"
          currentStaffId={user?.id}
        />
      )}

      {/* Detail Modal for Finished/Cancelled Appointments */}
      {isDetailOpen && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                  {selectedApt.ma_lich_dat}
                </span>
                <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase mt-2">Thông tin ca khám</h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-secondary dark:text-zinc-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider text-[9px]">Tên bệnh nhân</p>
                  <p className="font-bold text-sm mt-1">{selectedApt.ten_khach_hang}</p>
                </div>
                <div>
                  <p className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider text-[9px]">Số điện thoại</p>
                  <p className="font-bold text-sm mt-1">{selectedApt.so_dien_thoai}</p>
                </div>
              </div>

              <div>
                <p className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider text-[9px]">Giờ hẹn khám</p>
                <p className="font-bold mt-1 text-primary">
                  {new Date(selectedApt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedApt.ngay_gio_ket_thuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div>
                <p className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider text-[9px]">Lý do khám bệnh</p>
                <p className="mt-1 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium">
                  {selectedApt.ly_do_kham || 'Không có ghi chú lý do.'}
                </p>
              </div>

              {selectedApt.chan_doan && (
                <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider text-[9px]">Chẩn đoán lâm sàng</p>
                    <p className="mt-1 font-bold text-slate-800 dark:text-zinc-200">
                      {selectedApt.chan_doan}
                    </p>
                  </div>

                  {selectedApt.chong_chi_dinh && (
                    <div>
                      <p className="text-rose-500 font-bold uppercase tracking-wider text-[9px]">Chống chỉ định điều trị</p>
                      <p className="mt-1 font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900/20">
                        {selectedApt.chong_chi_dinh}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-right">
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
