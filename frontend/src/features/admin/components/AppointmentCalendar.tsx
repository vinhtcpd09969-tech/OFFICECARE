import { useState, useEffect } from 'react';
import { MapPin, Clock, Plus, Coffee } from 'lucide-react';
import { convertToVietnamUtcIso } from '../../../utils/date';

const BREAK_SLOTS = new Set<string>();

interface AppointmentCalendarProps {
  timeSlots: string[];
  appointments: any[];
  statusConfig: any;
  handleOpenDetailModal: (apt: any) => void;
  roomsList?: any[];
  staffList?: any[];
  schedulesList?: any[];
  allAppointments?: any[];
  selectedDateStr?: string;
  onOpenWalkInModal?: (time: string) => void;
  onUpdateAppointment?: (appointmentId: string, updatedFields: any) => Promise<void>;
  viewMode?: 'admin' | 'doctor';
  currentStaffId?: string;
  hideUnassignedColumn?: boolean;
}

export default function AppointmentCalendar({
  timeSlots,
  appointments,
  statusConfig,
  handleOpenDetailModal,
  staffList = [],
  schedulesList = [],
  allAppointments = [],
  selectedDateStr = '',
  onOpenWalkInModal,
  onUpdateAppointment,
  viewMode = 'admin',
  currentStaffId,
  hideUnassignedColumn = false
}: AppointmentCalendarProps) {
  // Lấy danh sách Bác sĩ
  const doctors = viewMode === 'doctor'
    ? staffList.filter(s => s.vai_tro === 'Bác sĩ' && String(s.chuyen_gia_id) === String(currentStaffId))
    : staffList.filter(s => s.vai_tro === 'Bác sĩ');

  // Lấy lịch trực của bác sĩ
  const getDoctorSchedule = (docId: string) => {
    return schedulesList.find(s => 
      String(s.nguoi_dung_id) === String(docId) && 
      s.ngay === selectedDateStr && 
      s.trang_thai === 'hoat_dong'
    );
  };

  // Lọc các lịch hẹn theo giờ và bác sĩ
  const getSlotAppointments = (hour: string, doctorId: string | null) => {
    return appointments.filter(apt => {
      const aptTime = new Date(apt.ngay_gio_bat_dau);
      const hourStr = `${String(aptTime.getHours()).padStart(2, '0')}:${String(aptTime.getMinutes()).padStart(2, '0')}`;
      if (hourStr !== hour) return false;

      // Trong chế độ bác sĩ, API đã lọc sẵn lịch hẹn của bác sĩ đó rồi, không cần so sánh ID
      if (viewMode === 'doctor') {
        return true;
      }

      if (doctorId === null) {
        return !apt.bac_si_id && !apt.chuyen_gia_id;
      } else {
        return apt.bac_si_id === doctorId || apt.chuyen_gia_id === doctorId;
      }
    });
  };

  // Kiểm tra bác sĩ có rảnh không tại khung giờ
  const checkDoctorAvailability = (hour: string, docId: string) => {
    const docSchedule = getDoctorSchedule(docId);
    if (!docSchedule) return false;

    const dutyStart = docSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = docSchedule.gio_ket_thuc.substring(0, 5);
    const isWorking = dutyStart <= hour && dutyEnd > hour; // dutyEnd is exclusive
    if (!isWorking) return false;

    // Xem bác sĩ có ca hẹn nào trùng khung giờ này không
    const isOccupied = allAppointments.some(apt => {
      if (apt.trang_thai === 'da_huy' || apt.trang_thai === 'khong_den') return false;
      
      // Ở chế độ bác sĩ, bỏ qua so sánh ID
      if (viewMode !== 'doctor' && apt.bac_si_id !== docId && apt.chuyen_gia_id !== docId) return false;

      const aptStart = new Date(apt.ngay_gio_bat_dau);
      const aptStartHour = `${String(aptStart.getHours()).padStart(2, '0')}:${String(aptStart.getMinutes()).padStart(2, '0')}`;
      
      return aptStartHour === hour;
    });

    return !isOccupied;
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, apt: any) => {
    e.dataTransfer.setData('text/plain', apt.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('bg-emerald-55/10', 'dark:bg-emerald-950/20', 'border-emerald-300/40');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-emerald-55/10', 'dark:bg-emerald-950/20', 'border-emerald-300/40');
  };

  const handleDrop = async (e: React.DragEvent, hour: string, doctorId: string | null) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-emerald-55/10', 'dark:bg-emerald-950/20', 'border-emerald-300/40');
    
    const aptId = e.dataTransfer.getData('text/plain');
    if (!aptId) return;

    const draggedApt = allAppointments.find(a => a.id === aptId);
    if (!draggedApt) return;

    // Tính toán giờ kết thúc (khám lâm sàng mặc định 30p, trị liệu/dịch vụ lẻ mặc định 60p)
    const durationMin = draggedApt.loai_lich === 'dieu_tri' ? 60 : 30;
    const [h, m] = hour.split(':').map(Number);
    const endTotalMins = h * 60 + m + durationMin;
    const endH = Math.floor(endTotalMins / 60) % 24;
    const endM = endTotalMins % 60;
    const endHourStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    
    const startIso = convertToVietnamUtcIso(selectedDateStr, hour);
    const endIso = convertToVietnamUtcIso(selectedDateStr, endHourStr);

    const payload: any = {
      trang_thai: doctorId === null 
        ? 'chua_xac_nhan' 
        : (draggedApt.trang_thai === 'chua_xac_nhan' ? 'cho_xac_nhan' : draggedApt.trang_thai),
      bac_si_id: doctorId || null,
      ngay_gio_bat_dau: startIso,
      ngay_gio_ket_thuc: endIso
    };

    if (onUpdateAppointment) {
      await onUpdateAppointment(aptId, payload);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-x-auto transition-colors duration-300">
      <table className="w-full border-collapse text-left min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-slate-200 dark:border-zinc-800">
            <th className="w-28 p-4 text-center border-r border-slate-200 dark:border-zinc-800">Khung giờ</th>
            {viewMode !== 'doctor' && !hideUnassignedColumn && (
              <th className="w-64 p-4 border-r border-slate-200 dark:border-zinc-800 bg-amber-50/5 dark:bg-amber-955/5">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-450">
                  ⚠️ Chờ chỉ định
                </span>
              </th>
            )}
            {doctors.map(doc => {
              const sched = getDoctorSchedule(doc.id);
              return (
                <th key={doc.id} className="p-4 border-r border-slate-200 dark:border-zinc-800 min-w-[200px]">
                  <div className="flex flex-col">
                    <span className="text-slate-800 dark:text-zinc-200 font-extrabold text-xs">BS. {doc.ho_ten}</span>
                    <span className={`text-[9px] font-semibold tracking-wide ${
                      sched ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'
                    }`}>
                      {sched ? `Trực: ${sched.gio_bat_dau.substring(0, 5)} - ${sched.gio_ket_thuc.substring(0, 5)}` : 'Nghỉ ca'}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {timeSlots.map((hour) => {
            const isBreak = BREAK_SLOTS.has(hour);
            const unassignedApts = getSlotAppointments(hour, null);

            return (
              <tr 
                key={hour} 
                className={`${isBreak ? 'bg-amber-50/30 dark:bg-amber-955/5' : 'hover:bg-slate-50/5 dark:hover:bg-zinc-800/5'}`}
              >
                {/* Khung giờ */}
                <td className="p-4 text-center border-r border-slate-200 dark:border-zinc-800 font-mono text-xs font-bold text-slate-550 dark:text-zinc-400 bg-slate-50/30 dark:bg-zinc-900/30 relative select-none w-28">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1">
                      {isBreak ? <Coffee size={12} className="text-amber-500" /> : <Clock size={12} className="text-slate-400" />}
                      <span>{hour}</span>
                    </div>
                    {isBreak && (
                      <span className="text-[8px] font-black text-amber-700 bg-amber-100 dark:bg-amber-950/40 px-1 py-0.5 rounded uppercase tracking-wider scale-90">
                        Nghỉ
                      </span>
                    )}
                  </div>
                </td>

                {/* Cột chờ chỉ định */}
                {viewMode !== 'doctor' && !hideUnassignedColumn && (
                  <td
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, hour, null)}
                    className="p-3 align-top border-r border-slate-200 dark:border-zinc-800 bg-amber-50/5 dark:bg-amber-955/5 min-h-[80px] transition-all"
                  >
                    <div className="space-y-2">
                      {unassignedApts.map(apt => (
                        <AppointmentCard 
                          key={apt.id} 
                          apt={apt} 
                          statusConfig={statusConfig} 
                          onClick={() => handleOpenDetailModal(apt)}
                          onDragStart={handleDragStart}
                          viewMode={viewMode}
                        />
                      ))}
                      {unassignedApts.length === 0 && (
                        <div className="text-[10px] text-slate-350 dark:text-zinc-600 italic text-center py-2 select-none">
                          Kéo thả để bỏ gán
                        </div>
                      )}
                    </div>
                  </td>
                )}

                {/* Các cột Bác sĩ */}
                {doctors.map(doc => {
                  const docApts = getSlotAppointments(hour, doc.chuyen_gia_id);
                  const isAvailable = checkDoctorAvailability(hour, doc.id);
                  const sched = getDoctorSchedule(doc.id);

                  // Xác định bác sĩ có nghỉ giữa ca tại khung giờ này không
                  const isDocBreak = false;

                  return (
                    <td
                      key={doc.id}
                      onDragOver={isDocBreak || !sched || viewMode === 'doctor' ? undefined : handleDragOver}
                      onDragLeave={isDocBreak || !sched || viewMode === 'doctor' ? undefined : handleDragLeave}
                      onDrop={isDocBreak || !sched || viewMode === 'doctor' ? undefined : (e) => handleDrop(e, hour, doc.chuyen_gia_id)}
                      className={`p-3 align-top border-r border-slate-200 dark:border-zinc-800 transition-all ${
                        isDocBreak 
                          ? 'bg-amber-50/10 dark:bg-amber-955/5' 
                          : !sched 
                            ? 'bg-slate-100/30 dark:bg-zinc-800/10' 
                            : isAvailable 
                              ? 'bg-emerald-50/5 dark:bg-emerald-950/2' 
                              : 'bg-slate-50/10 dark:bg-zinc-800/2'
                      }`}
                    >
                      {isDocBreak ? (
                        <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold text-center py-2 select-none flex flex-col items-center justify-center gap-1">
                          <Coffee size={10} />
                          <span>Nghỉ giữa ca</span>
                        </div>
                      ) : !sched ? (
                        <div className="text-[9px] text-slate-400 dark:text-zinc-500 italic text-center py-2 select-none">
                          Không trực ca
                        </div>
                      ) : (
                        <div className="space-y-2 min-h-[40px]">
                          {docApts.map(apt => (
                            <AppointmentCard 
                              key={apt.id} 
                              apt={apt} 
                              statusConfig={statusConfig} 
                              onClick={() => handleOpenDetailModal(apt)}
                              onDragStart={handleDragStart}
                              viewMode={viewMode}
                            />
                          ))}
                          {docApts.length === 0 && isAvailable && viewMode !== 'doctor' && (
                            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex justify-center py-1">
                              <button
                                onClick={() => onOpenWalkInModal && onOpenWalkInModal(hour)}
                                className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/30"
                              >
                                <Plus size={10} /> Đặt khám
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Subcomponent: Countdown Timer
function CountdownTimer({ hanXacNhan, onExpire }: { hanXacNhan: string; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(hanXacNhan).getTime() - Date.now();
      return diff > 0 ? Math.floor(diff / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const seconds = calculateTimeLeft();
      setTimeLeft(seconds);
      if (seconds <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hanXacNhan, onExpire]);

  if (timeLeft <= 0) {
    return <span className="text-red-500 font-extrabold text-[9px] animate-pulse">Quá hạn</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}m ${seconds}s`;

  let colorClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
  if (minutes < 5) {
    colorClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 animate-pulse font-extrabold';
  } else if (minutes < 10) {
    colorClass = 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 font-bold';
  }

  return (
    <span className={`text-[9.5px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono ${colorClass}`}>
      <span>⏳</span>
      <span>{timeStr}</span>
    </span>
  );
}

// Subcomponent: Appointment Card (Premium Glassmorphic card styling)
function AppointmentCard({ apt, statusConfig, onClick, onDragStart, viewMode = 'admin' }: { apt: any; statusConfig: any; onClick: () => void; onDragStart: (e: React.DragEvent, apt: any) => void; viewMode?: 'admin' | 'doctor' }) {
  const status = statusConfig[apt.trang_thai] || statusConfig.cho_xac_nhan;
  const isUnassigned = !apt.bac_si_id && !apt.chuyen_gia_id;
  const isCheckedIn = apt.trang_thai === 'da_checkin';
  const showCountdown = isUnassigned && ['cho_xac_nhan', 'chua_xac_nhan'].includes(apt.trang_thai) && apt.han_xac_nhan;

  return (
    <div
      id={`appointment-card-${apt.id}`}
      draggable={viewMode !== 'doctor'}
      onDragStart={(e) => onDragStart(e, apt)}
      onClick={onClick}
      className={`p-3 bg-white dark:bg-zinc-900 border ${viewMode === 'doctor' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} transition-all duration-300 rounded-xl relative flex flex-col justify-between min-h-[105px] group/card hover:-translate-y-0.5 hover:shadow-md select-none ${
        isCheckedIn
          ? 'border-teal-350 dark:border-teal-800 ring-2 ring-teal-500/10 dark:ring-teal-500/5 bg-teal-50/10 dark:bg-teal-950/5 shadow-[0_0_8px_rgba(46,196,182,0.08)]'
          : isUnassigned 
            ? 'border-rose-100 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-800' 
            : 'border-slate-100 dark:border-zinc-800 hover:border-emerald-350 dark:hover:border-emerald-800'
      }`}
    >
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {apt.ma_lich_dat}
          </span>
          <div className="flex items-center gap-1.5">
            {isCheckedIn && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
              </span>
            )}
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="text-xs font-bold text-slate-800 dark:text-zinc-150 line-clamp-1">
          {apt.ten_khach_hang}
        </div>
        
        <div className="text-[9px] text-slate-400 dark:text-zinc-500 line-clamp-1 font-medium mt-0.5">
          {apt.ten_dich_vu}
        </div>
      </div>
 
      <div className="mt-2 pt-2 border-t border-slate-50 dark:border-zinc-800/85 flex items-center justify-between gap-1">
        {apt.ten_phong ? (
          <div className="flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-450 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/20">
            <MapPin size={9} className="text-emerald-500" />
            <span>{apt.ten_phong}</span>
          </div>
        ) : (
          <div />
        )}

        {showCountdown && (
          <CountdownTimer hanXacNhan={apt.han_xac_nhan} />
        )}
      </div>
    </div>
  );
}
