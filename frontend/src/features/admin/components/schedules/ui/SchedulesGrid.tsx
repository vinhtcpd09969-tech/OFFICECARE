import React from 'react';
import { AlertTriangle, Plus, Sun, Sunset, Moon, UserX } from 'lucide-react';
import { Schedule, Staff, WeekDate } from '../types';
import { getAvatarInitials } from '../constants';

interface SchedulesGridProps {
  weekDates: WeekDate[];
  groupedStaff: Record<string, Staff[]>;
  schedules: Schedule[];
  conflicts: any[];
  onOpenModal: (userId: string, dateStr?: string) => void;
  onOpenEditModal: (sched: Schedule) => void;
}

export function SchedulesGrid({
  weekDates,
  groupedStaff,
  schedules,
  conflicts,
  onOpenModal,
  onOpenEditModal
}: SchedulesGridProps) {

  const todayDateStr = React.useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const renderShiftBadge = (sched: Schedule) => {
    const isConflict = conflicts.some(
      c => c.id === sched.nguoi_dung_id && 
      c.dowLabel === (weekDates.find(d => d.fullDateStr === sched.ngay)?.label || sched.ngay)
    );
    
    let label = 'Ca Sáng'; 
    let colorClass = 'bg-gradient-to-r from-teal-50 to-emerald-50 text-emerald-800 border-teal-200/80 hover:border-teal-400 hover:shadow-xs';
    let ShiftIcon = Sun;
    let iconColor = 'text-amber-500';
    
    if (sched.trang_thai === 'tam_nghi') {
      label = 'Nghỉ phép'; 
      colorClass = 'bg-rose-50/80 text-rose-700 border-rose-200 hover:border-rose-350';
      ShiftIcon = UserX;
      iconColor = 'text-rose-500';
    } else {
      const hour = parseInt(sched.gio_bat_dau.split(':')[0]);
      if (hour >= 11 && hour < 16) {
        label = 'Ca Chiều'; 
        colorClass = 'bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-800 border-indigo-200/80 hover:border-indigo-400 hover:shadow-xs';
        ShiftIcon = Sunset;
        iconColor = 'text-indigo-500';
      } else if (hour >= 16) {
        label = 'Ca Tối'; 
        colorClass = 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-200/80 hover:border-amber-400 hover:shadow-xs';
        ShiftIcon = Moon;
        iconColor = 'text-amber-600';
      }
    }

    if (isConflict && sched.trang_thai !== 'tam_nghi') {
      colorClass = 'bg-rose-100/90 text-rose-800 border-rose-300 border-dashed animate-pulse hover:border-rose-500';
      label = `Trùng ca (${label})`;
    }

    const isPastDate = sched.ngay < todayDateStr;

    if (isPastDate) {
      return (
        <div 
          key={sched.id} 
          className="text-[11px] font-bold border border-slate-200/60 p-1.5 rounded-xl text-center mb-1.5 shadow-xs bg-slate-50 text-slate-400 cursor-not-allowed select-none opacity-75 flex flex-col items-center gap-0.5"
        >
          <div className="flex items-center gap-1">
            <ShiftIcon size={12} className="opacity-60" />
            <span className="uppercase tracking-wider font-extrabold text-[10px]">{label}</span>
          </div>
          {sched.trang_thai !== 'tam_nghi' && (
            <div className="flex items-center gap-1 text-[9.5px]">
              {sched.ma_phong && <span className="bg-slate-200 px-1 py-0.2 rounded text-[8.5px] font-black text-slate-600">{sched.ma_phong}</span>}
              <span>{sched.gio_bat_dau.slice(0, 5)}-{sched.gio_ket_thuc.slice(0, 5)}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        key={sched.id} 
        onClick={(e) => { e.stopPropagation(); onOpenEditModal(sched); }}
        className={`text-[11px] font-bold border p-1.5 rounded-xl text-center mb-1.5 shadow-2xs transition-all cursor-pointer flex flex-col items-center gap-0.5 ${colorClass}`}
        title={`Click để chỉnh sửa ca trực (${sched.gio_bat_dau.slice(0, 5)} - ${sched.gio_ket_thuc.slice(0, 5)})`}
      >
        <div className="flex items-center gap-1">
          <ShiftIcon size={12} className={iconColor} />
          <span className="uppercase tracking-wider font-extrabold text-[10px]">{label}</span>
        </div>
        {sched.trang_thai !== 'tam_nghi' && (
          <div className="flex items-center gap-1 text-[9.5px] mt-0.5">
            {sched.ma_phong && (
              <span className="bg-white/80 dark:bg-zinc-800 px-1.5 py-0.2 rounded-md text-[8.5px] font-black text-teal-800 border border-teal-150 shadow-2xs">
                {sched.ma_phong}
              </span>
            )}
            <span className="opacity-90 font-mono">{sched.gio_bat_dau.slice(0, 5)}-{sched.gio_ket_thuc.slice(0, 5)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/50 select-none">
              <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider w-1/4 border-b border-r border-gray-100">Nhân viên</th>
              {weekDates.map(d => (
                <th 
                  key={d.key} 
                  className={`p-3 text-center border-b border-r border-gray-100 min-w-[100px] transition-all relative ${
                    d.isToday 
                      ? 'bg-teal-50/50 border-b-2 border-b-teal-500 text-teal-700 font-extrabold' 
                      : 'border-b-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="flex items-center gap-1">
                      {d.isToday && (
                        <span className="flex h-2 w-2 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                      )}
                      <span className={`font-bold text-sm ${d.isToday ? 'text-teal-700' : 'text-gray-800'}`}>{d.label}</span>
                    </div>
                    <div className={`text-xs mt-1 ${d.isToday ? 'text-teal-600 font-bold' : 'text-gray-500'}`}>{d.dateStr}</div>
                    {d.isToday && (
                      <span className="absolute top-1 text-[8px] font-black uppercase text-[#0d9488] bg-teal-100/50 px-1.5 py-0.5 rounded scale-[0.8] select-none">
                        Hôm nay
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {['Bác sĩ', 'Lễ tân', 'Kỹ thuật viên'].map(role => {
              const roleStaff = groupedStaff[role];
              if (!roleStaff || roleStaff.length === 0) return null;
              
              return (
                <React.Fragment key={role}>
                  <tr className="bg-gray-50 select-none">
                    <td colSpan={8} className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {role} ({roleStaff.length})
                    </td>
                  </tr>
                  {roleStaff.map(staff => {
                    const isStaffConflict = conflicts.some(c => c.id === staff.id);
                    return (
                      <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-100 last:border-none">
                        <td className="p-4 border-r border-gray-100 bg-white group-hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-sm border border-white select-none">
                              {getAvatarInitials(staff.ho_ten)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-800">{staff.ho_ten}</span>
                              {isStaffConflict && <AlertTriangle size={16} className="text-rose-500" />}
                            </div>
                          </div>
                        </td>
                        {weekDates.map(dow => {
                          const cellSchedules = schedules.filter(s => s.nguoi_dung_id === staff.id && s.ngay === dow.fullDateStr);
                          const isPastDate = dow.fullDateStr < todayDateStr;
                          return (
                            <td 
                              key={dow.key} 
                              className={`p-2 border-r border-gray-100 align-top transition-colors relative ${
                                dow.isToday 
                                  ? 'bg-teal-50/20 ring-1 ring-teal-500/10' 
                                  : 'bg-white'
                              } group-hover:bg-gray-50/50`}
                            >
                              {cellSchedules.length > 0 ? (
                                cellSchedules.map(renderShiftBadge)
                              ) : (
                                !isPastDate ? (
                                  <div 
                                    onClick={() => onOpenModal(staff.id, dow.fullDateStr)}
                                    className="h-full min-h-[40px] rounded-lg border border-transparent hover:border-gray-300 hover:bg-gray-50 border-dashed flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 text-gray-400 hover:text-teal-600"
                                  >
                                    <Plus size={16} />
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[40px]" />
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default SchedulesGrid;
