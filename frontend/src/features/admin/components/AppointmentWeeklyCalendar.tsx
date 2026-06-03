import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MapPin, Clock, CalendarDays } from 'lucide-react';

interface AppointmentWeeklyCalendarProps {
  selectedDate: Date;
  appointments: any[];
  statusConfig: any;
  handleOpenDetailModal: (apt: any) => void;
  scheduleType: 'kham_moi' | 'dieu_tri';
}

export default function AppointmentWeeklyCalendar({
  selectedDate,
  appointments,
  statusConfig,
  handleOpenDetailModal,
  scheduleType
}: AppointmentWeeklyCalendarProps) {
  // Get start of the week (Monday)
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Define Shifts
  const shifts = [
    { id: 'morning',   label: '🌅 Ca Sáng',  timeRange: '08:00 - 12:00', startHour: 8,  endHour: 12 },
    { id: 'afternoon', label: '☀️ Ca Chiều', timeRange: '13:30 - 17:30', startHour: 13, endHour: 18 },
    { id: 'evening',   label: '🌙 Ca Tối',   timeRange: '18:00 - 19:30', startHour: 18, endHour: 20 },
  ];

  const getAppointmentsForSlot = (day: Date, shiftStartHour: number, shiftEndHour: number) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.ngay_gio_bat_dau);
      const hour = aptDate.getHours();
      return isSameDay(aptDate, day) && hour >= shiftStartHour && hour < shiftEndHour;
    }).sort((a, b) => new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime());
  };

  const getDayTheme = (day: Date) => {
    if (isSameDay(day, new Date())) {
      return 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400';
    }
    return 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200';
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-x-auto transition-colors duration-300">
      <table className="w-full border-collapse min-w-[1200px] text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-850">
            <th className="w-32 p-4 text-center border-r border-slate-200 dark:border-zinc-850 bg-slate-50/80 dark:bg-zinc-900/80 backdrop-blur sticky left-0 z-10">
              <div className="flex flex-col items-center justify-center gap-1 text-slate-555 dark:text-zinc-400">
                <CalendarDays size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Ca Trực</span>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium leading-tight mt-1.5 bg-slate-100/70 dark:bg-zinc-850 px-1.5 py-0.5 rounded border border-slate-200/30 dark:border-zinc-800">
                  Nghỉ trưa:<br/>12:00-13:30
                </span>
              </div>
            </th>
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <th key={idx} className={`p-3 border-r border-slate-200 dark:border-zinc-850 min-w-[180px] ${isToday ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                  <div className={`flex flex-col items-center justify-center rounded-xl py-2 ${getDayTheme(day)} border`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-0.5">
                      {format(day, 'EEEE', { locale: vi })}
                    </span>
                    <span className="text-lg font-black tracking-tight">
                      {format(day, 'dd/MM')}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {shifts.map(shift => (
            <tr key={shift.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 group transition-colors">
              <td className="p-4 text-center border-r border-slate-200 dark:border-zinc-850 bg-slate-50/80 dark:bg-zinc-900/80 sticky left-0 z-10">
                <div className="font-bold text-slate-700 dark:text-zinc-300 text-sm mb-1">{shift.label}</div>
                <div className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 font-mono bg-slate-100/50 dark:bg-zinc-850 px-2 py-1 rounded inline-block">
                  {shift.timeRange}
                </div>
              </td>
              
              {weekDays.map((day, idx) => {
                const cellApts = getAppointmentsForSlot(day, shift.startHour, shift.endHour);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <td key={idx} className={`p-2 border-r border-slate-100 dark:border-zinc-800 align-top relative min-h-[120px] ${isToday ? 'bg-emerald-50/10 dark:bg-emerald-955/5' : ''}`}>
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1">
                      {cellApts.map(apt => {
                        const status = statusConfig[apt.trang_thai] || statusConfig.cho_xac_nhan;
                        const aptTime = format(new Date(apt.ngay_gio_bat_dau), 'HH:mm');
                        
                        return (
                          <div
                            key={apt.id}
                            onClick={() => handleOpenDetailModal(apt)}
                            className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-350 dark:hover:border-emerald-700 transition-all rounded-xl relative group/card"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-105 dark:bg-zinc-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} className="text-slate-400 dark:text-zinc-500" />
                                {aptTime}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {apt.loai_lich === 'dieu_tri' && Number(apt.so_thu_tu_buoi) === 1 && apt.trang_thai === 'hoan_thanh' && apt.trang_thai_thanh_toan === 'chua_thanh_toan' && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-955/35 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30 flex items-center gap-0.5 uppercase tracking-wide animate-pulse" title="Cần thanh toán gói">
                                    💵 Cần TT
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm font-bold text-slate-800 dark:text-zinc-150 line-clamp-1">{apt.ten_khach_hang}</div>
                            
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-450 line-clamp-1 font-medium">
                              {scheduleType === 'kham_moi' 
                                ? (apt.ten_ky_thuat_vien ? `BS. ${apt.ten_ky_thuat_vien}` : <span className="text-rose-500 font-semibold">Chưa chỉ định BS</span>)
                                : (apt.ten_ky_thuat_vien ? `KTV. ${apt.ten_ky_thuat_vien}` : <span className="text-rose-500 font-semibold">Chưa chỉ định KTV</span>)
                              }
                            </div>
                            
                            <div className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500 line-clamp-1 italic">
                              {apt.ten_dich_vu}
                            </div>

                            {apt.ten_phong && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md w-fit border border-emerald-100/50 dark:border-emerald-900/20">
                                <MapPin size={10} />
                                <span>{apt.ten_phong}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {cellApts.length === 0 && (
                        <div className="h-full min-h-[80px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-medium text-slate-350 dark:text-zinc-600 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 bg-slate-50/50 dark:bg-zinc-800/10">
                            Trống
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
