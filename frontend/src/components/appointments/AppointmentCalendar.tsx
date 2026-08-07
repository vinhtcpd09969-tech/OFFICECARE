import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Plus, Coffee, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { isPaymentDue, getInstallmentCutoffSession } from '../../utils/billing';
import { useAuthStore } from '../../stores/authStore';

interface AppointmentCalendarProps {
  appointments: any[];
  statusConfig: any;
  handleOpenDetailModal: (apt: any) => void;
  staffList?: any[];
  schedulesList?: any[];
  allAppointments?: any[];
  selectedDateStr?: string;
  onOpenWalkInModal?: (time: string) => void;
  onUpdateAppointment?: (appointmentId: string, updatedFields: any) => Promise<void>;
  viewMode?: 'admin' | 'doctor';
}

export default function AppointmentCalendar({
  appointments,
  statusConfig,
  handleOpenDetailModal,
  staffList = [],
  selectedDateStr = '',
  onOpenWalkInModal,
  onUpdateAppointment: _onUpdateAppointment,
  viewMode = 'admin',
  schedulesList = [],
  allAppointments: _allAppointments = []
}: AppointmentCalendarProps) {
  const { user } = useAuthStore();
  const canCreateAppointment = user && [2, 5, 6].includes(Number(user.vai_tro_id));
  const [currentTime, setCurrentTime] = useState(new Date());

  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '' };
    }

    const staffSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(staff.id) && 
      s.ngay === selectedDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay' };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày' };
    }

    return { hasDuty: true, label: '' };
  };

  // Chỉ còn kiểm tra CA TRỰC — không còn kiểm tra "trùng giờ" giữa 2 lịch hẹn của cùng
  // nhân sự: từ khi đặt lịch chuyển sang mô hình theo BUỔI (ngân sách phút), mọi lịch hẹn
  // trong cùng 1 buổi đều mang cùng mốc ngay_gio_bat_dau/ngay_gio_ket_thuc NOMINAL (vd 7h30–12h00),
  // nên 1 nhân sự có ≥2 lịch trong cùng buổi là chuyện BÌNH THƯỜNG (phục vụ tuần tự qua hàng đợi),
  // không phải xung đột. Giữ lại kiểm tra overlap ở đây sẽ luôn coi nhân sự "không khả dụng"
  // ngay khi họ có lịch thứ 2 trong buổi, dù dữ liệu nhan_su_id vẫn đúng.
  const getIsDoctorUnavailable = (_apt: any, doc: any) => {
    if (!doc) return false;
    const duty = getStaffDutyStatus(doc);
    return !duty.hasDuty;
  };

  // Update current time every minute for the NOW indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isToday = selectedDateStr === format(currentTime, 'yyyy-MM-dd');

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, apt: any) => {
    e.dataTransfer.setData('text/plain', apt.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Logic 1: Sắp xếp cuộc hẹn và nhóm chúng theo giờ bắt đầu chính xác
  const timelineRows = React.useMemo(() => {
    const sortedApts = [...appointments].sort((a, b) => 
      new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime()
    );

    // Group by exact start time
    const grouped: Record<string, { start: string; end: string; startMs: number; endMs: number; apts: any[] }> = {};
    
    sortedApts.forEach(apt => {
      const startDate = new Date(apt.ngay_gio_bat_dau);
      const startStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      
      const endDate = new Date(apt.ngay_gio_ket_thuc);
      const endStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      
      if (!grouped[startStr]) {
        grouped[startStr] = {
          start: startStr,
          end: endStr,
          startMs,
          endMs,
          apts: []
        };
      }
      grouped[startStr].apts.push(apt);
      
      // Update max end time for parallel appointments
      if (endMs > grouped[startStr].endMs) {
        grouped[startStr].end = endStr;
        grouped[startStr].endMs = endMs;
      }
    });

    const groupedKeys = Object.keys(grouped).sort();
    
    const rows: Array<{
      type: 'appointment' | 'gap';
      id: string;
      startTimeStr: string;
      endTimeStr: string;
      durationMins?: number;
      appointments?: any[];
    }> = [];

    // Clinic standard hours (08:00 - 20:00)
    const baseDate = selectedDateStr ? new Date(selectedDateStr + 'T00:00:00') : new Date();
    const dayStartMs = new Date(baseDate).setHours(8, 0, 0, 0);
    const dayEndMs = new Date(baseDate).setHours(20, 0, 0, 0);

    let lastEndMs = dayStartMs;

    groupedKeys.forEach(startStr => {
      const group = grouped[startStr];
      
      // Check for gap before this group
      if (group.startMs > lastEndMs) {
        const gapDuration = Math.round((group.startMs - lastEndMs) / 60000);
        if (gapDuration >= 5) {
          const gapStart = new Date(lastEndMs);
          const gapEnd = new Date(group.startMs);
          rows.push({
            type: 'gap',
            id: `gap-${lastEndMs}-${group.startMs}`,
            startTimeStr: `${String(gapStart.getHours()).padStart(2, '0')}:${String(gapStart.getMinutes()).padStart(2, '0')}`,
            endTimeStr: `${String(gapEnd.getHours()).padStart(2, '0')}:${String(gapEnd.getMinutes()).padStart(2, '0')}`,
            durationMins: gapDuration
          });
        }
      }

      // Add appointment group row
      rows.push({
        type: 'appointment',
        id: `group-${startStr}`,
        startTimeStr: group.start,
        endTimeStr: group.end,
        appointments: group.apts
      });

      if (group.endMs > lastEndMs) {
        lastEndMs = group.endMs;
      }
    });

    // Check for gap at the end of the day
    if (dayEndMs > lastEndMs) {
      const gapDuration = Math.round((dayEndMs - lastEndMs) / 60000);
      if (gapDuration >= 5) {
        const gapStart = new Date(lastEndMs);
        const gapEnd = new Date(dayEndMs);
        rows.push({
          type: 'gap',
          id: `gap-${lastEndMs}-${dayEndMs}`,
          startTimeStr: `${String(gapStart.getHours()).padStart(2, '0')}:${String(gapStart.getMinutes()).padStart(2, '0')}`,
          endTimeStr: `${String(gapEnd.getHours()).padStart(2, '0')}:${String(gapEnd.getMinutes()).padStart(2, '0')}`,
          durationMins: gapDuration
        });
      }
    }

    return rows;
  }, [appointments, selectedDateStr]);

  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-zinc-800 overflow-hidden transition-all duration-300">
      <table className="w-full border-collapse text-left relative table-fixed">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-150/60 dark:border-zinc-800 select-none">
            <th className="w-28 p-4 text-center border-r border-slate-100 dark:border-zinc-800">Thời gian</th>
            <th className="p-4">
              <div className="flex justify-between items-center w-full">
                <span>Danh sách phân bổ lịch trình</span>
                {canCreateAppointment && (
                  <button
                    type="button"
                    onClick={() => onOpenWalkInModal && onOpenWalkInModal('08:00')}
                    className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 transition-all hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 active:scale-95 cursor-pointer shadow-xs uppercase tracking-wider"
                  >
                    <Plus size={11} className="stroke-[3]" /> Thêm ca hẹn
                  </button>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 relative">
          {timelineRows.length > 0 ? (
            timelineRows.map((row) => {
              const isGap = row.type === 'gap';

              // NOW Indicator Calculation for this row
              let isCurrentTimeInRow = false;
              let offsetPercent = 0;
              
              if (isToday && selectedDateStr) {
                const nowH = currentTime.getHours();
                const nowM = currentTime.getMinutes();
                const nowMins = nowH * 60 + nowM;

                const [startH, startM] = row.startTimeStr.split(':').map(Number);
                const [endH, endM] = row.endTimeStr.split(':').map(Number);
                
                const rowStartMins = startH * 60 + startM;
                const rowEndMins = endH * 60 + endM;

                if (nowMins >= rowStartMins && nowMins < rowEndMins) {
                  isCurrentTimeInRow = true;
                  offsetPercent = ((nowMins - rowStartMins) / (rowEndMins - rowStartMins)) * 100;
                }
              }

              return (
                <tr 
                  key={row.id} 
                  className={`relative group/row ${isGap ? 'bg-slate-50/30 dark:bg-zinc-900/60' : 'hover:bg-slate-50/20 dark:hover:bg-zinc-800/40 transition-colors'}`}
                >
                  {/* Trục thời gian bên trái */}
                  <td className="p-4 text-center border-r border-slate-100 dark:border-zinc-800 font-mono text-xs font-black text-slate-500 dark:text-zinc-400 bg-slate-50/10 dark:bg-zinc-900/80 select-none w-28 align-middle">
                    {/* NOW Indicator Line overlay */}
                    {isCurrentTimeInRow && (
                      <div 
                        className="absolute left-0 right-0 h-[1.5px] bg-rose-500 pointer-events-none z-30 flex items-center justify-start" 
                        style={{ top: `${offsetPercent}%` }}
                      >
                        <span className="bg-rose-500 text-white font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)] tracking-wider -translate-y-1/2 ml-2 select-none animate-pulse">
                          NOW
                        </span>
                        <div className="w-full h-[1.5px] bg-gradient-to-r from-rose-500 via-rose-500/80 to-transparent shadow-[0_0_6px_rgba(239,68,68,0.2)]"></div>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-black text-slate-800 dark:text-zinc-200">
                        {isGap ? <Coffee size={11} className="text-amber-500" /> : <Clock size={11} className="text-emerald-500" />}
                        <span>{row.startTimeStr}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-zinc-400 font-semibold">
                        đến {row.endTimeStr}
                      </div>
                    </div>
                  </td>

                  {/* Nội dung danh sách / khoảng trống */}
                  <td className="p-3.5 align-middle">
                    {isGap ? (
                      <div 
                        onClick={() => onOpenWalkInModal && onOpenWalkInModal(row.startTimeStr)}
                        className="group/gap flex items-center justify-between py-3 px-4 border border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-slate-50/60 dark:hover:bg-zinc-800/50 bg-slate-50/20 dark:bg-zinc-900/40 rounded-2xl cursor-pointer transition-all duration-300 select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600 group-hover/gap:bg-emerald-500 transition-colors" />
                          <span className="text-xs font-semibold text-slate-400 dark:text-zinc-400 group-hover/gap:text-slate-600 dark:group-hover/gap:text-zinc-200">
                            Trống lịch <span className="font-extrabold text-slate-600 dark:text-zinc-300 group-hover/gap:text-emerald-600 dark:group-hover/gap:text-emerald-400">{row.durationMins} phút</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                        {row.appointments?.map(apt => {
                          const assignedDoc = staffList.find(s => String(s.id) === String(apt.bac_si_id));
                          const isDocUnavailable = assignedDoc ? getIsDoctorUnavailable(apt, assignedDoc) : false;
                          return (
                            <AppointmentCard 
                              key={apt.id} 
                              apt={apt} 
                              statusConfig={statusConfig} 
                              onClick={() => handleOpenDetailModal(apt)}
                              onDragStart={handleDragStart}
                              viewMode={viewMode}
                              assignedDoc={assignedDoc}
                              isDocUnavailable={isDocUnavailable}
                            />
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={2} className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-semibold italic select-none">
                Không có dữ liệu lịch hẹn nào cho ngày hôm nay.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// CountdownTimer (đếm ngược han_xac_nhan) và CheckinTimingBadge (đếm "còn/quá X giờ" tới
// ngay_gio_bat_dau) đã bị gỡ: cả hai đều là tàn dư của mô hình đặt giờ chính xác + xác nhận OTP.
// Từ khi chuyển sang đặt theo BUỔI (A1) và bỏ hẳn bước xác nhận OTP (C1, A10), ngay_gio_bat_dau
// chỉ còn là mốc NOMINAL của buổi (vd 7h30) chứ không phải giờ hẹn thật — đếm ngược/báo "quá giờ"
// dựa vào mốc đó sẽ luôn sai (báo trễ hàng trăm phút cho khách đã check-in bình thường).

// Subcomponent: Appointment Card
function AppointmentCard({
  apt,
  statusConfig,
  onClick,
  onDragStart,
  viewMode = 'admin',
  assignedDoc,
  isDocUnavailable = false
}: {
  apt: any;
  statusConfig: any;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, apt: any) => void;
  onUpdateAppointment?: (appointmentId: string, updatedFields: any) => Promise<void>;
  viewMode?: 'admin' | 'doctor';
  assignedDoc?: any;
  isDocUnavailable?: boolean;
}) {
  const rawStatus = statusConfig[apt.trang_thai] || statusConfig.da_xac_nhan;
  const hasStaff = !!apt.bac_si_id || !!apt.chuyen_gia_id;
  const status = rawStatus;
  const isUnassigned = !hasStaff;
  const isCheckedIn = apt.trang_thai === 'da_checkin';

  const isInstallmentWarning =
    apt.loai_lich?.toUpperCase() === 'DIEU_TRI' &&
    apt.hinh_thuc_thanh_toan_goi === 'tra_gop' &&
    apt.trang_thai_hoa_don_goi !== 'da_thanh_toan' &&
    !['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(apt.trang_thai) &&
    Number(apt.so_tien_da_tra_goi) < Number(apt.tong_tien_phai_tra_goi) &&
    Number(apt.so_thu_tu_buoi) >= getInstallmentCutoffSession(Number(apt.tong_so_buoi_goi || 10));

  const showPaymentDueBadge = viewMode === 'admin' && apt.trang_thai === 'hoan_thanh' && isPaymentDue(apt);

  return (
    <div
      id={`appointment-card-${apt.id}`}
      draggable={viewMode !== 'doctor'}
      onDragStart={(e) => onDragStart(e, apt)}
      onClick={onClick}
      className={`p-3.5 bg-white dark:bg-zinc-900 border ${viewMode === 'doctor' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} transition-all duration-300 rounded-[18px] relative flex flex-col justify-between min-h-[110px] group/card hover:-translate-y-0.5 hover:shadow-lg select-none ${
        ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(apt.trang_thai)
          ? 'opacity-85 border-slate-200 bg-slate-50/50 dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer'
          : isCheckedIn
              ? 'border-teal-400 dark:border-teal-700 ring-2 ring-[#0D9488]/10 dark:ring-[#0D9488]/20 bg-[#0D9488]/5 dark:bg-teal-950/30'
              : isInstallmentWarning
                ? 'border-amber-500 ring-2 ring-amber-500/10 dark:ring-amber-500/20 bg-amber-50/10 dark:bg-amber-950/30'
                : (isUnassigned || isDocUnavailable)
                  ? 'border-rose-500 ring-2 ring-rose-500/10 dark:ring-rose-500/20 bg-rose-50/10 dark:bg-rose-950/30 animate-pulse'
                  : 'border-slate-100 dark:border-zinc-800 hover:border-[#14B8A6]/30'
      }`}
    >
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[9px] font-black text-slate-400 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-700">
            {apt.ma_lich_dat}
          </span>
          <div className="flex items-center gap-1.5">
            {isInstallmentWarning && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white animate-pulse flex items-center gap-0.5 shadow-sm">
                ⚠️ Nợ Đợt 2
              </span>
            )}
            {isCheckedIn && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
              </span>
            )}
            {apt.trang_thai === 'dang_kham' && (
              <span className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 p-1 rounded-full border border-emerald-200 ring-2 ring-emerald-500/15 animate-pulse">
                <Stethoscope size={10} className="stroke-[2.5]" />
              </span>
            )}
            {showPaymentDueBadge && (
              <span
                title="Đã hoàn thành, chưa thanh toán"
                className="flex items-center justify-center size-4 rounded-full bg-amber-500 text-white text-[9.5px] font-black shadow-sm animate-pulse shrink-0"
              >
                $
              </span>
            )}
            <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="text-xs font-black text-slate-800 dark:text-zinc-100 line-clamp-1 group-hover/card:text-[#0D9488] transition-colors duration-200">
          {apt.ten_khach_hang}
        </div>
        
        <div className="text-[9.5px] text-slate-500 dark:text-zinc-400 line-clamp-1 font-bold mt-0.5">
          {apt.ten_dich_vu}
        </div>

        {isInstallmentWarning && (
          <div className="mt-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-[8.5px] font-bold px-2 py-0.8 rounded-lg flex items-center gap-1 leading-normal select-none">
            <span>⚠️ Hôm nay hạn đóng Đợt 2</span>
          </div>
        )}
        
        {/* Lý do hủy/không đến nếu có */}
        {['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(apt.trang_thai) && (apt.ly_do_huy || apt.ghi_chu_noi_bo) && (
          <div className="mt-1 text-[8.5px] italic text-rose-500 dark:text-rose-400 font-bold line-clamp-1">
            Lý do: {apt.ly_do_huy || apt.ghi_chu_noi_bo}
          </div>
        )}
        
        {/* Doctor/KTV badge inside the card if assigned or locked */}
        {assignedDoc && !isDocUnavailable ? (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-black text-[#0D9488] dark:text-teal-400 bg-[#0D9488]/5 dark:bg-teal-950/20 px-2 py-0.5 rounded border border-[#0D9488]/15 dark:border-teal-900/20 select-none">
            <span className="size-1 bg-[#0D9488] rounded-full" />
            <span>{apt.loai_lich === 'dich_vu_don' || apt.loai_lich === 'dieu_tri' ? 'KTV.' : 'BS.'} {assignedDoc.ho_ten}</span>
          </div>
        ) : !['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(apt.trang_thai) ? (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-200/20 select-none">
            <span className="size-1 bg-rose-500 rounded-full animate-pulse" />
            <span>Chờ gán {apt.loai_lich === 'dich_vu_don' || apt.loai_lich === 'dieu_tri' ? 'kỹ thuật viên' : 'bác sĩ'}</span>
          </div>
        ) : null}
      </div>

      {/* Floating Detailed Hover Info Tooltip Panel */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 dark:bg-zinc-900 text-white text-[10px] p-3 rounded-xl shadow-xl w-60 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-800 dark:border-zinc-800">
        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0.5 h-0.5 border-t-[6px] border-t-slate-900 border-x-[6px] border-x-transparent" />
        <p className="font-black text-xs text-white border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
          <span>Chi tiết ca hẹn</span>
          <span className="text-[9px] font-mono text-[#14B8A6]">{apt.ma_lich_dat}</span>
        </p>
        <p className="font-bold text-[11px] mb-1">📞 SDT: <span className="text-slate-300">{apt.so_dien_thoai}</span></p>
        <p className="font-bold text-[11px] mb-1">🩺 Dịch vụ: <span className="text-slate-300">{apt.ten_dich_vu}</span></p>
        {apt.ly_do_kham && (
          <p className="text-[10px] text-slate-400 italic mt-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/20 line-clamp-2">
            "{apt.ly_do_kham}"
          </p>
        )}
        {isInstallmentWarning && (
          <p className="font-bold text-[10px] text-amber-400 mt-1.5 bg-amber-950/40 p-1.5 rounded-lg border border-amber-900/35 leading-relaxed">
            ⚠️ Hạn đóng tiền Đợt 2 (Buổi {apt.so_thu_tu_buoi}/{apt.tong_so_buoi_goi}). Cần hoàn tất thanh toán trước khi đặt buổi tiếp theo.
          </p>
        )}
      </div>
 
      {/* Footer Area - Static layout, no translation or hover-collapse */}
      <div className="mt-2.5 pt-2 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between gap-1 select-none">
        {apt.ten_phong && !['da_huy', 'khong_den'].includes(apt.trang_thai) ? (
          <div className="flex items-center gap-1 text-[9px] text-[#0d766e] dark:text-emerald-450 font-black bg-[#0D9488]/5 dark:bg-emerald-955/20 px-2 py-0.5 rounded border border-[#0D9488]/15 dark:border-teal-900/20">
            <MapPin size={9} className="text-[#0D9488]" />
            <span>{apt.ten_phong}</span>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
