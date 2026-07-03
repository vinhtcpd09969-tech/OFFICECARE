import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Award,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AppointmentWeeklyCalendarProps {
  selectedDate: Date;
  setSelectedDate?: (date: Date) => void;
  appointments: any[];
  statusConfig: any;
  handleOpenDetailModal: (apt: any) => void;
  onOpenWalkInModal?: (time: string) => void;
}

export default function AppointmentWeeklyCalendar({
  selectedDate,
  setSelectedDate,
  appointments,
  statusConfig,
  handleOpenDetailModal,
  onOpenWalkInModal
}: AppointmentWeeklyCalendarProps) {
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Sync expanded day with selectedDate prop
  const [expandedDayStr, setExpandedDayStr] = useState<string>(format(selectedDate, 'yyyy-MM-dd'));

  useEffect(() => {
    setExpandedDayStr(format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate]);

  const handleDaySelect = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    setExpandedDayStr(dayStr);
    if (setSelectedDate) {
      setSelectedDate(day);
    }
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau);
      return isSameDay(aptDate, day);
    }).sort((a, b) => new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime());
  };



  // 1. Calculate capacity stats
  const totalWeeklyApts = appointments.length;
  const maxWeeklyCapacity = 7 * 24; // 7 days * 24 slots/day capacity limit
  const averageCapacity = Math.min(Math.round((totalWeeklyApts / maxWeeklyCapacity) * 100), 100);

  // Active resources count
  const activeDocsCount = Array.from(new Set(appointments.map(apt => apt.bac_si_id).filter(Boolean))).length || 4;
  const activeRoomsCount = Array.from(new Set(appointments.map(apt => apt.phong_id).filter(Boolean))).length || 2;

  // 2. Daily calculations for the selected day (expandedDayStr)
  const dayApts = appointments.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const dayStr = format(aptDate, 'yyyy-MM-dd');
    return dayStr === expandedDayStr;
  }).sort((a, b) => new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime());

  const dayActiveRoomsCount = Array.from(new Set(dayApts.map(apt => apt.phong_id).filter(Boolean))).length;

  const activeDocsMap = dayApts.reduce<Record<string, { id: string; name: string; count: number }>>((acc, apt) => {
    const docId = apt.bac_si_id;
    if (docId) {
      const docName = apt.ten_ky_thuat_vien || `BS. ${docId === 'doc_1' ? 'Khoa' : docId === 'doc_2' ? 'Lan Anh' : docId === 'doc_3' ? 'Hưng' : 'Minh'}`;
      if (!acc[docId]) {
        acc[docId] = { id: docId, name: docName, count: 0 };
      }
      acc[docId].count += 1;
    }
    return acc;
  }, {});
  const activeDocsList = Object.values(activeDocsMap);
  const dayActiveDocsCount = activeDocsList.length;

  const maxDailyCapacity = 24; // 8 hours * 3 doctors capacity limit
  const dayOccupancyPercent = Math.min(Math.round((dayApts.length / maxDailyCapacity) * 100), 100);

  const allSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const occupiedSlots = new Set(dayApts.map(apt => format(new Date(apt.ngay_gio_bat_dau), 'HH') + ':00'));
  const availableSlots = allSlots.filter(slot => !occupiedSlots.has(slot));

  const doctorDailyWorkloads = activeDocsList.map(doc => {
    const docDailyMax = 8;
    const pct = Math.min(Math.round((doc.count / docDailyMax) * 100), 100);
    return {
      id: doc.id,
      name: doc.name,
      count: doc.count,
      percentage: pct
    };
  });

  const getSelectedDayInsights = () => {
    const dayInsights: string[] = [];
    if (availableSlots.length > 5) {
      dayInsights.push(`💡 Ngày này còn nhiều khung giờ trống (${availableSlots.length} khung giờ).`);
    } else if (dayApts.length > 10) {
      dayInsights.push(`🚨 Mật độ cao: Có ${dayApts.length} ca khám. Khuyên dời các ca hẹn mới sang ngày khác.`);
    } else {
      dayInsights.push(`💡 Ngày này có mật độ lịch hẹn lý tưởng.`);
    }

    const peakApts = dayApts.filter(apt => {
      const hour = new Date(apt.ngay_gio_bat_dau).getHours();
      return (hour >= 8 && hour <= 10) || (hour >= 14 && hour <= 16);
    });
    if (peakApts.length > 0) {
      dayInsights.push(`⚡ Khung giờ cao điểm: 08:00 - 10:00 & 14:00 - 16:00.`);
    }

    const roomCounts = dayApts.reduce<Record<string, number>>((acc, apt) => {
      if (apt.phong_id) acc[apt.phong_id] = (acc[apt.phong_id] || 0) + 1;
      return acc;
    }, {});
    const topRoomId = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topRoomId) {
      const roomName = topRoomId === 'room_1' ? 'Phòng Khám 01' : topRoomId === 'room_2' ? 'Phòng Khám 02' : 'Phòng Trị Liệu';
      dayInsights.push(`🏥 ${roomName} được sử dụng nhiều nhất.`);
    }

    if (activeDocsList.length > 1) {
      dayInsights.push(`👨‍⚕️ Công suất bác sĩ trực ca cân bằng.`);
    }

    return dayInsights;
  };
  const selectedDayInsights = getSelectedDayInsights();

  return (
    <div className="space-y-6 w-full font-jakarta text-slate-800 dark:text-zinc-100">
      
      {/* SECTION 1: WEEKLY COMMAND CENTER */}
      <div className="bg-slate-900 dark:bg-zinc-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <span className="text-[#14B8A6] text-[10px] font-black uppercase tracking-widest block">
            Bảng chỉ huy hoạt động
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Tuần: {format(startDate, 'dd/MM')} - {format(addDays(startDate, 6), 'dd/MM/yyyy')}
          </h2>
          <p className="text-xs text-slate-400 font-bold">
            Trình quản lý điều phối nhân sự, phân phòng khám & tối ưu công suất
          </p>
        </div>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto relative z-10 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[120px] text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">HIỆU SUẤT</span>
            <span className="text-xl font-black text-[#14B8A6]">{averageCapacity}%</span>
            <span className="text-[8px] font-bold text-emerald-400 block mt-1">
              <TrendingUp size={9} className="inline mr-0.5" /> +14.2% tuần trước
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[120px] text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">TỔNG CA KHÁM</span>
            <span className="text-xl font-black text-white">{totalWeeklyApts} ca</span>
            <span className="text-[8px] font-bold text-slate-400 block mt-1">Đã lên lịch trực</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[120px] text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">NHÂN LỰC</span>
            <span className="text-xl font-black text-white">{activeDocsCount} NV</span>
            <span className="text-[8px] font-bold text-slate-400 block mt-1">Bác sĩ & KTV</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[120px] text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">PHÒNG KHÁM</span>
            <span className="text-xl font-black text-white">{activeRoomsCount} Phòng</span>
            <span className="text-[8px] font-bold text-slate-400 block mt-1">Đang hoạt động</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: TIMELINE & INTERACTIVE WEEK GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 2: WEEK CAPACITY TIMELINE (Mon-Sun Occupancy Bars) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-wider block">
              Dự báo mật độ tuần (Weekly Timeline)
            </span>
            <p className="text-[11px] text-slate-500 font-semibold">Tỉ lệ lắp đầy phòng khám theo từng ngày</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {weekDays.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayApts = getAppointmentsForDay(day);
              const maxSlots = 24;
              const pct = Math.min(Math.round((dayApts.length / maxSlots) * 100), 100);
              const isSelected = expandedDayStr === dayStr;

              return (
                <div 
                  key={idx} 
                  onClick={() => handleDaySelect(day)}
                  className={`space-y-1 cursor-pointer p-1.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-slate-50 dark:bg-zinc-800/40' : 'hover:bg-slate-50/50 dark:hover:bg-zinc-800/20'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-650 dark:text-zinc-350">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-650" />
                      {format(day, 'EEE', { locale: vi })} ({format(day, 'dd/MM')})
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{dayApts.length} ca • {pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct < 35 
                          ? 'bg-emerald-500' 
                          : pct < 75 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500 animate-pulse'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: INTERACTIVE WEEK CALENDAR (Grid selection) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-wider block">
              Bảng điều phối ngày (Click để thay đổi)
            </span>
            <p className="text-[11px] text-slate-500 font-semibold">Chọn ngày để xem chi tiết danh sách khung giờ trống hoặc lịch đã đặt</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayApts = getAppointmentsForDay(day);
              const isSelected = expandedDayStr === dayStr;
              const isToday = isSameDay(day, new Date());

              // Capacity status labels
              let statusText = 'Tải nhẹ';
              let badgeColor = 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 border-emerald-100/50 dark:border-emerald-900/10';
              if (dayApts.length > 15) {
                statusText = 'Quá tải';
                badgeColor = 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border-rose-100/50 dark:border-rose-900/10';
              } else if (dayApts.length > 8) {
                statusText = 'Đông khách';
                badgeColor = 'bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-455 border-orange-100/50 dark:border-orange-900/10';
              } else if (dayApts.length > 4) {
                statusText = 'Bình thường';
                badgeColor = 'bg-teal-50 dark:bg-teal-955/20 text-teal-700 dark:text-teal-455 border-teal-100/50 dark:border-teal-900/10';
              }

              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  onClick={() => handleDaySelect(day)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 text-center ${
                    isSelected 
                      ? 'bg-slate-900 dark:bg-zinc-800 text-white border-slate-900 dark:border-zinc-700 shadow-md ring-2 ring-slate-900/10 dark:ring-zinc-700/10'
                      : isToday
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-zinc-200'
                        : 'bg-slate-50/40 dark:bg-zinc-900/40 border-slate-150/70 dark:border-zinc-800 hover:border-[#14B8A6]/20 text-slate-700 dark:text-zinc-350'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-60">
                      {format(day, 'EEE', { locale: vi })}
                    </span>
                    <span className="text-xl font-black tracking-tight block my-0.5">
                      {format(day, 'dd')}
                    </span>
                    <span className="text-[10px] font-bold opacity-75">{format(day, 'MM')}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black block">
                      {dayApts.length} ca
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider block ${
                      isSelected ? 'bg-white/10 text-[#14B8A6] border-white/10' : badgeColor
                    }`}>
                      {statusText}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DASHBOARD BOTTOM GRID: SELECTED DAY AGENDA VS DAILY ANALYTICS */}
      <div className="flex flex-col lg:flex-row gap-6 items-start animate-in fade-in duration-200">
        
        {/* LEFT PANEL: AGENDA LIST & HEADER */}
        <div className="flex-1 w-full min-w-0 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-5">
          
          {/* Selected Day Header */}
          <div className="border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4 select-none">
            <span className="text-[#14B8A6] text-[10px] font-black uppercase tracking-widest block mb-1">
              Chi tiết hoạt động ngày
            </span>
            <h3 className="text-xl font-black uppercase text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <span>{format(new Date(expandedDayStr), 'EEEE • dd/MM/yyyy', { locale: vi })}</span>
              {isSameDay(new Date(expandedDayStr), new Date()) && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                  Hôm nay
                </span>
              )}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-150/60 dark:border-zinc-800/80 rounded-xl p-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 block mb-0.5">QUY MÔ</span>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{dayApts.length} lịch khám</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-150/60 dark:border-zinc-800/80 rounded-xl p-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 block mb-0.5">PHÒNG HOẠT ĐỘNG</span>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{dayActiveRoomsCount} phòng</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-150/60 dark:border-zinc-800/80 rounded-xl p-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 block mb-0.5">BÁC SĨ TRỰC</span>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{dayActiveDocsCount} bác sĩ</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-150/60 dark:border-zinc-800/80 rounded-xl p-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 block mb-0.5">LẤP ĐẦY</span>
                <span className="text-sm font-black text-[#14B8A6]">{dayOccupancyPercent}%</span>
              </div>
            </div>
          </div>

          {/* Appointment Agenda List */}
          <div className="space-y-2.5">
            {dayApts.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/20 dark:bg-zinc-900/10 border border-slate-150/50 dark:border-zinc-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-zinc-550 italic font-bold">Không có ca khám nào được lên lịch trong ngày này.</p>
              </div>
            ) : (
              dayApts.map((apt) => {
                const rawStatus = statusConfig[apt.trang_thai] || statusConfig.cho_xac_nhan;
                const status = {
                  ...rawStatus,
                  label: apt.trang_thai === 'cho_xac_nhan' 
                    ? (apt.loai_lich === 'dich_vu_don' ? 'Chờ gán KTV' : 'Chờ gán Bác sĩ')
                    : rawStatus.label
                };
                const aptTime = format(new Date(apt.ngay_gio_bat_dau), 'HH:mm');

                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    whileHover={{ y: -1.5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                    onClick={() => handleOpenDetailModal(apt)}
                    className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-[#14B8A6]/35 rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.01)] hover:shadow-md transition-all duration-205 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <span className="text-[#14B8A6] font-extrabold text-sm select-none">●</span>
                        <span className="font-mono text-sm font-black text-slate-800 dark:text-zinc-200">
                          {aptTime}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 capitalize truncate group-hover:text-[#14B8A6] transition-colors">
                          {apt.ten_khach_hang}
                        </h4>
                        <p className="text-[10px] text-slate-550 dark:text-zinc-400 font-semibold truncate leading-relaxed">
                          {apt.ten_dich_vu}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-750">
                        🩺 {apt.ten_ky_thuat_vien ? `${apt.loai_lich === 'kham_moi' ? 'BS.' : 'KTV.'} ${apt.ten_ky_thuat_vien}` : 'Chưa chỉ định'}
                      </span>
                      {apt.ten_phong && (
                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-955/20 px-2 py-0.5 rounded border border-emerald-100/30">
                          <MapPin size={9} />
                          {apt.ten_phong}
                        </span>
                      )}
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Empty Capacity Summary Card */}
          <div className="bg-slate-50/50 dark:bg-zinc-800/10 border border-dashed border-slate-200 dark:border-zinc-800/80 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[#14B8A6]/10 text-[#14B8A6] rounded text-[10px] font-black uppercase">
                  Còn {availableSlots.length} khung giờ trống
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Khung giờ khả dụng:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableSlots.length === 0 ? (
                  <span className="text-[11px] text-rose-505 font-extrabold">Đầy lịch trực ca ngày này!</span>
                ) : (
                  availableSlots.map(slot => (
                    <span key={slot} className="font-mono text-[9px] font-black text-slate-600 dark:text-zinc-350 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700/60 shadow-sm">
                      {slot}
                    </span>
                  ))
                )}
              </div>
            </div>

            {availableSlots.length > 0 && onOpenWalkInModal && (
              <button
                type="button"
                onClick={() => onOpenWalkInModal(availableSlots[0])}
                className="w-full sm:w-auto py-2.5 px-4.5 bg-[#0D9488] hover:bg-[#0d766e] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm shadow-[#0D9488]/15 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Plus size={11} />
                <span>Đặt lịch nhanh</span>
              </button>
            )}
          </div>

        </div>

        {/* RIGHT PANEL: ACTIVE DOCTORS & CLINIC INSIGHTS OF THE SELECTED DAY */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Doctor Section (Active Doctors) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-zinc-800/80">
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-150 uppercase tracking-widest flex items-center gap-2">
                <Award size={15} className="text-amber-500" />
                <span>Bác sĩ phụ trách ngày này</span>
              </h3>
            </div>

            <div className="space-y-3">
              {doctorDailyWorkloads.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-550 italic text-center py-6">
                  Chưa gán ca khám nào ngày này
                </p>
              ) : (
                doctorDailyWorkloads.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/40 dark:bg-zinc-900/40 border border-slate-100/50 dark:border-zinc-800/50 hover:border-[#14B8A6]/20 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-700 dark:text-zinc-200 truncate">
                        {doc.name}
                      </span>
                      <span className="text-[10px] font-mono font-black text-slate-650 dark:text-zinc-350">
                        {doc.count} ca
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[8px] text-slate-400 dark:text-zinc-550 font-bold uppercase">
                        <span>Hiệu suất ngày</span>
                        <span className="font-mono">{doc.percentage}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            doc.percentage >= 80 ? 'bg-rose-500' : doc.percentage >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${doc.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Smart Insights Center (Daily Insights) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-zinc-800/80">
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-150 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={15} className="text-[#14B8A6]" />
                <span>AI Clinic Insights (Ngày)</span>
              </h3>
            </div>

            <div className="space-y-3">
              {selectedDayInsights.map((insight, idx) => {
                const isWarning = insight.includes('Mật độ cao') || insight.includes('quá tải');
                const isSuccess = insight.includes('lý tưởng') || insight.includes('cân bằng');
                
                const bg = 
                  isWarning
                    ? 'bg-rose-50 dark:bg-rose-955/10 border-rose-200/20 text-slate-800 dark:text-zinc-200' 
                    : isSuccess
                      ? 'bg-emerald-50 dark:bg-emerald-955/10 border-emerald-200/20 text-slate-800 dark:text-zinc-200'
                      : 'bg-[#14B8A6]/5 dark:bg-teal-955/5 border-teal-200/20 text-slate-800 dark:text-zinc-200';

                const icon = 
                  isWarning
                    ? <AlertTriangle className="text-rose-500 shrink-0" size={14} /> 
                    : isSuccess
                      ? <Sparkles className="text-emerald-500 shrink-0" size={14} />
                      : <Clock className="text-[#14B8A6] shrink-0" size={14} />;

                return (
                  <div 
                    key={idx}
                    className={`p-3 border rounded-2xl flex items-start gap-2.5 text-[11px] leading-relaxed font-semibold ${bg}`}
                  >
                    {icon}
                    <span>{insight}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
