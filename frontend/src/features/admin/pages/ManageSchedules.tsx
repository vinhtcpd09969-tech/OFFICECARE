import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSchedules, createSchedule, getStaff, updateSchedule, deleteSchedule } from '../../../api/admin.api';
import { User, Calendar as CalendarIcon, PieChart, AlertTriangle, Plus, X, CheckCircle2 } from 'lucide-react';

const scheduleSchema = z.object({
  nguoi_dung_id: z.string().min(1, 'Vui lòng chọn nhân sự'),
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)'),
  gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  trang_thai: z.enum(['hoat_dong', 'tam_nghi'])
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const DOW_KEYS = ['thu_2', 'thu_3', 'thu_4', 'thu_5', 'thu_6', 'thu_7', 'chu_nhat'];

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWeekDates = (selectedWeek: 'current' | 'next') => {
  const dates = [];
  const current = new Date();
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);
  
  if (selectedWeek === 'next') {
    monday.setDate(monday.getDate() + 7);
  }
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push({
      key: DOW_KEYS[i],
      label: DOW_KEYS[i] === 'chu_nhat' ? 'CN' : `T${i + 2}`,
      dateStr: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      isToday: d.toDateString() === new Date().toDateString(),
      fullDateStr: formatLocalDate(d)
    });
  }
  return dates;
};

const getAvatarInitials = (name: string) => {
  if (!name) return 'NV';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function ManageSchedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedWeek, setSelectedWeek] = useState<'current'|'next'>('current');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<'morning' | 'afternoon' | 'tam_nghi'>('morning');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { trang_thai: 'hoat_dong', gio_bat_dau: '07:00', gio_ket_thuc: '15:30' }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, staffRes] = await Promise.all([ getSchedules(), getStaff() ]);
      setSchedules(schedRes.data);
      setStaff(staffRes.data.filter((s: any) => ['Kỹ thuật viên', 'Bác sĩ', 'Lễ tân'].includes(s.vai_tro)));
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleShiftTypeChange = (type: 'morning' | 'afternoon' | 'tam_nghi') => {
    setSelectedShiftType(type);
    const currentUserId = watch('nguoi_dung_id');
    const selectedStaff = staff.find(s => s.id === currentUserId);
    const role = selectedStaff?.vai_tro || 'Bác sĩ';

    if (type === 'morning') {
      setValue('gio_bat_dau', '07:00');
      setValue('gio_ket_thuc', role === 'Lễ tân' ? '12:00' : '16:00');
      setValue('trang_thai', 'hoat_dong');
    } else if (type === 'afternoon') {
      setValue('gio_bat_dau', role === 'Lễ tân' ? '12:00' : '11:00');
      setValue('gio_ket_thuc', '20:00');
      setValue('trang_thai', 'hoat_dong');
    } else if (type === 'tam_nghi') {
      setValue('gio_bat_dau', '00:00');
      setValue('gio_ket_thuc', '00:00');
      setValue('trang_thai', 'tam_nghi');
    }
  };

  const watchedNgay = watch('ngay');
  const watchedNguoiDungId = watch('nguoi_dung_id');

  const disabledShiftsForSelected = useMemo(() => {
    if (!watchedNguoiDungId || !watchedNgay) {
      return { morning: false, afternoon: false };
    }

    const selectedStaff = staff.find(s => s.id === watchedNguoiDungId);
    if (!selectedStaff || selectedStaff.vai_tro !== 'Bác sĩ') {
      return { morning: false, afternoon: false };
    }

    let morningTaken = false;
    let afternoonTaken = false;

    schedules.forEach(s => {
      if (s.ngay === watchedNgay && s.vai_tro === 'Bác sĩ' && s.trang_thai === 'hoat_dong') {
        if (editingSchedule && s.id === editingSchedule.id) {
          return;
        }
        if (s.nguoi_dung_id === watchedNguoiDungId) {
          return;
        }

        const hour = parseInt(s.gio_bat_dau.split(':')[0]);
        if (hour >= 11) {
          afternoonTaken = true;
        } else {
          morningTaken = true;
        }
      }
    });

    return { morning: morningTaken, afternoon: afternoonTaken };
  }, [watchedNguoiDungId, watchedNgay, staff, schedules, editingSchedule]);

  const getFirstAvailableShiftForDoctor = (userId: string, dateStr: string) => {
    const selectedStaff = staff.find(s => s.id === userId);
    if (!selectedStaff || selectedStaff.vai_tro !== 'Bác sĩ') {
      return 'morning';
    }

    let morningTaken = false;
    let afternoonTaken = false;

    schedules.forEach(s => {
      if (s.ngay === dateStr && s.vai_tro === 'Bác sĩ' && s.trang_thai === 'hoat_dong') {
        if (editingSchedule && s.id === editingSchedule.id) {
          return;
        }
        if (s.nguoi_dung_id === userId) {
          return;
        }
        const hour = parseInt(s.gio_bat_dau.split(':')[0]);
        if (hour >= 11) {
          afternoonTaken = true;
        } else {
          morningTaken = true;
        }
      }
    });

    if (!morningTaken) return 'morning';
    if (!afternoonTaken) return 'afternoon';
    return 'tam_nghi';
  };

  useEffect(() => {
    if (!watchedNguoiDungId || !watchedNgay) return;
    const selectedStaff = staff.find(s => s.id === watchedNguoiDungId);
    if (!selectedStaff || selectedStaff.vai_tro !== 'Bác sĩ') return;

    const { morning, afternoon } = disabledShiftsForSelected;

    if (selectedShiftType === 'morning' && morning) {
      if (!afternoon) {
        handleShiftTypeChange('afternoon');
      } else {
        handleShiftTypeChange('tam_nghi');
      }
    } else if (selectedShiftType === 'afternoon' && afternoon) {
      if (!morning) {
        handleShiftTypeChange('morning');
      } else {
        handleShiftTypeChange('tam_nghi');
      }
    }
  }, [watchedNgay, watchedNguoiDungId, disabledShiftsForSelected, selectedShiftType]);

  // Open modal pre-filled
  const handleOpenModal = (userId: string, dateStr?: string) => {
    setEditingSchedule(null);
    reset();
    setValue('nguoi_dung_id', userId);
    const targetDate = dateStr || formatLocalDate(new Date());
    setValue('ngay', targetDate);
    
    const selectedStaff = staff.find(s => s.id === userId);
    const role = selectedStaff?.vai_tro || 'Bác sĩ';
    
    let initialShift: 'morning' | 'afternoon' | 'tam_nghi' = 'morning';
    if (role === 'Bác sĩ') {
      initialShift = getFirstAvailableShiftForDoctor(userId, targetDate);
    }
    
    setSelectedShiftType(initialShift);
    if (initialShift === 'morning') {
      setValue('gio_bat_dau', '07:00');
      setValue('gio_ket_thuc', role === 'Lễ tân' ? '12:00' : '16:00');
      setValue('trang_thai', 'hoat_dong');
    } else if (initialShift === 'afternoon') {
      setValue('gio_bat_dau', role === 'Lễ tân' ? '12:00' : '11:00');
      setValue('gio_ket_thuc', '20:00');
      setValue('trang_thai', 'hoat_dong');
    } else {
      setValue('gio_bat_dau', '00:00');
      setValue('gio_ket_thuc', '00:00');
      setValue('trang_thai', 'tam_nghi');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sched: any) => {
    setEditingSchedule(sched);
    reset();
    setValue('nguoi_dung_id', sched.nguoi_dung_id);
    setValue('ngay', sched.ngay);
    setValue('gio_bat_dau', sched.gio_bat_dau.slice(0, 5));
    setValue('gio_ket_thuc', sched.gio_ket_thuc.slice(0, 5));
    setValue('trang_thai', sched.trang_thai as any);

    if (sched.trang_thai === 'tam_nghi') {
      setSelectedShiftType('tam_nghi');
    } else {
      const hour = parseInt(sched.gio_bat_dau.split(':')[0]);
      if (hour >= 11) {
        setSelectedShiftType('afternoon');
      } else {
        setSelectedShiftType('morning');
      }
    }
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async () => {
    if (!editingSchedule) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa ca trực này?')) {
      try {
        await deleteSchedule(editingSchedule.id);
        setIsModalOpen(false);
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  const onSubmit = async (data: ScheduleFormValues) => {
    // Validate doctor duplicate shifts
    const selectedStaff = staff.find(s => s.id === data.nguoi_dung_id);
    if (selectedStaff && selectedStaff.vai_tro === 'Bác sĩ') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const targetShiftType = data.trang_thai === 'tam_nghi' ? 'tam_nghi' : (hour >= 11 ? 'afternoon' : 'morning');
      
      if (targetShiftType !== 'tam_nghi') {
        const conflict = schedules.find(s => {
          const isSameDay = s.ngay === data.ngay;
          const isNotSelf = editingSchedule ? s.id !== editingSchedule.id : true;
          const isDoctor = s.vai_tro === 'Bác sĩ';
          
          if (isSameDay && isNotSelf && isDoctor && s.trang_thai !== 'tam_nghi') {
            const sHour = parseInt(s.gio_bat_dau.split(':')[0]);
            const sShiftType = sHour >= 11 ? 'afternoon' : 'morning';
            return sShiftType === targetShiftType;
          }
          return false;
        });

        if (conflict) {
          alert(`Không thể phân công: Bác sĩ ${conflict.ten_nhan_vien} đã trực ca này vào ngày ${data.ngay} rồi! Mỗi ca trực chỉ được phân công tối đa 1 bác sĩ.`);
          return;
        }
      }
    }

    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await createSchedule(data);
      }
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const weekDates = useMemo(() => getWeekDates(selectedWeek), [selectedWeek]);

  // Derived state calculations
  const { groupedStaff, conflicts, stats } = useMemo(() => {
    // 1. Filter staff
    let filtered = staff;
    if (roleFilter !== 'all') {
      filtered = staff.filter(s => s.vai_tro === roleFilter);
    }

    // 2. Group by role
    const grouped: Record<string, any[]> = { 'Bác sĩ': [], 'Lễ tân': [], 'Kỹ thuật viên': [] };
    filtered.forEach(s => {
      if (grouped[s.vai_tro]) grouped[s.vai_tro].push(s);
    });

    // 3. Detect conflicts
    const conflictList: any[] = [];
    const staffSchedules: Record<string, any[]> = {};
    schedules.forEach(s => {
      const key = `${s.nguoi_dung_id}-${s.ngay}`;
      if (!staffSchedules[key]) staffSchedules[key] = [];
      staffSchedules[key].push(s);
    });

    Object.values(staffSchedules).forEach(list => {
      if (list.length > 1) {
        const sorted = [...list].sort((a, b) => a.gio_bat_dau.localeCompare(b.gio_bat_dau));
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].gio_ket_thuc > sorted[i + 1].gio_bat_dau) {
            const conflictDowLabel = weekDates.find(d => d.fullDateStr === sorted[i].ngay)?.label || sorted[i].ngay;
            conflictList.push({
              id: sorted[i].nguoi_dung_id,
              name: sorted[i].ten_nhan_vien,
              dowLabel: conflictDowLabel,
              dateStr: sorted[i].ngay,
              time1: `${sorted[i].gio_bat_dau.slice(0,5)}`,
              time2: `${sorted[i+1].gio_bat_dau.slice(0,5)}`
            });
            break; // just register one conflict per staff/day
          }
        }
      }
    });

    // 4. Calculate Stats
    const todayStr = weekDates.find(d => d.isToday)?.fullDateStr;
    const activeToday = todayStr ? new Set(schedules.filter(s => s.ngay === todayStr && s.trang_thai === 'hoat_dong').map(s => s.nguoi_dung_id)).size : 0;
    
    // To only count coverage for the currently viewed week's schedules
    const currentWeekDates = weekDates.map(d => d.fullDateStr);
    const visibleSchedules = schedules.filter(s => currentWeekDates.includes(s.ngay));

    const expectedShifts = staff.length * 6;
    const currentActiveShifts = visibleSchedules.filter(s => s.trang_thai === 'hoat_dong').length;
    const coverage = expectedShifts > 0 ? Math.min(100, Math.round((currentActiveShifts / expectedShifts) * 100)) : 0;
    const emptyShifts = Math.max(0, expectedShifts - currentActiveShifts);

    return { 
      groupedStaff: grouped, 
      conflicts: conflictList,
      stats: { activeToday, emptyShifts, coverage }
    };
  }, [staff, schedules, roleFilter, weekDates]);

  const weeklyStatsByStaff = useMemo(() => {
    const currentWeekDates = weekDates.map(d => d.fullDateStr);
    const weeklySchedules = schedules.filter(s => currentWeekDates.includes(s.ngay));

    const statsMap: Record<string, { name: string; role: string; morning: number; afternoon: number; off: number }> = {};

    staff.forEach(s => {
      statsMap[s.id] = {
        name: s.ho_ten,
        role: s.vai_tro,
        morning: 0,
        afternoon: 0,
        off: 7
      };
    });

    weeklySchedules.forEach(s => {
      if (!statsMap[s.nguoi_dung_id]) return;
      if (s.trang_thai === 'hoat_dong') {
        const hour = parseInt(s.gio_bat_dau.split(':')[0]);
        if (hour >= 11) {
          statsMap[s.nguoi_dung_id].afternoon++;
        } else {
          statsMap[s.nguoi_dung_id].morning++;
        }
      }
    });

    // Post-process off days: Off = 7 - (S + C)
    Object.values(statsMap).forEach(st => {
      st.off = 7 - (st.morning + st.afternoon);
    });

    const groupedStats: Record<string, any[]> = { 'Bác sĩ': [], 'Lễ tân': [], 'Kỹ thuật viên': [] };
    Object.values(statsMap).forEach(st => {
      if (groupedStats[st.role]) {
        groupedStats[st.role].push(st);
      }
    });

    return groupedStats;
  }, [staff, schedules, weekDates]);

  // Helper to render shift badge
  const renderShiftBadge = (sched: any) => {
    const isConflict = conflicts.some(c => c.id === sched.nguoi_dung_id && c.dowLabel === (weekDates.find(d => d.fullDateStr === sched.ngay)?.label || sched.ngay));
    
    let label = 'Sáng'; let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-pointer hover:border-emerald-400';
    if (sched.trang_thai === 'tam_nghi') {
      label = 'Nghỉ phép'; colorClass = 'bg-red-50 text-red-600 border-red-200 cursor-pointer hover:border-red-400';
    } else {
      const hour = parseInt(sched.gio_bat_dau.split(':')[0]);
      if (hour >= 11 && hour < 16) {
        label = 'Chiều'; colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200 cursor-pointer hover:border-cyan-400';
      } else if (hour >= 16) {
        label = 'Tối'; colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer hover:border-indigo-400';
      }
    }

    if (isConflict && sched.trang_thai !== 'tam_nghi') {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300 border-dashed cursor-pointer hover:border-rose-450';
      label = `Trùng ca ${label}`;
    }

    return (
      <div 
        key={sched.id} 
        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(sched); }}
        className={`text-[11px] font-semibold border px-1.5 py-1 rounded-md text-center mb-1 shadow-sm transition-all ${colorClass}`}
      >
        <div className="uppercase tracking-wider">{label}</div>
        {sched.trang_thai !== 'tam_nghi' && (
          <div className="opacity-80 mt-0.5">({sched.gio_bat_dau.slice(0,5)}-{sched.gio_ket_thuc.slice(0,5)})</div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Filters & Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <button onClick={() => setSelectedWeek('current')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedWeek === 'current' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Tuần này</button>
          <button onClick={() => setSelectedWeek('next')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedWeek === 'next' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Tuần tới</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5 text-gray-700 outline-none focus:border-teal-500 shadow-sm">
            <option value="all">Tất cả vai trò</option>
            <option value="Bác sĩ">Bác sĩ</option>
            <option value="Lễ tân">Lễ tân</option>
            <option value="Kỹ thuật viên">Kỹ thuật viên</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <User size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nhân sự trong ngày</p>
            <h3 className="text-3xl font-heading font-bold text-gray-800">{stats.activeToday}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <CalendarIcon size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ca trống cần lắp</p>
            <h3 className="text-3xl font-heading font-bold text-gray-800">{stats.emptyShifts}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <PieChart size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tỷ lệ phủ kín</p>
            <h3 className="text-3xl font-heading font-bold text-gray-800">{stats.coverage}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left: Schedule Grid */}
        <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider w-1/4 border-b border-r border-gray-100">Nhân viên</th>
                  {weekDates.map(d => (
                    <th key={d.key} className={`p-3 text-center border-b border-gray-100 min-w-[100px] ${d.isToday ? 'bg-teal-50/30' : ''}`}>
                      <div className={`font-bold text-sm ${d.isToday ? 'text-teal-700' : 'text-gray-800'}`}>{d.label}</div>
                      <div className={`text-xs mt-1 ${d.isToday ? 'text-teal-600' : 'text-gray-500'}`}>{d.dateStr}</div>
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
                      <tr className="bg-gray-50">
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
                                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0 shadow-sm border border-white">
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
                              return (
                                <td key={dow.key} className={`p-2 border-r border-gray-100 align-top transition-colors ${dow.isToday ? 'bg-teal-50/10' : 'bg-white'} group-hover:bg-gray-50/50`}>
                                  {cellSchedules.length > 0 ? (
                                    cellSchedules.map(renderShiftBadge)
                                  ) : (
                                    <div 
                                      onClick={() => handleOpenModal(staff.id, dow.fullDateStr)}
                                      className="h-full min-h-[40px] rounded-lg border border-transparent hover:border-gray-300 hover:bg-gray-50 border-dashed flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 text-gray-400 hover:text-teal-600"
                                    >
                                      <Plus size={16} />
                                    </div>
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

        {/* Right: Conflict & Weekly Stats Sidebar */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-6">
          {/* Conflict Sidebar */}
          <div className="bg-rose-50/40 rounded-[24px] p-6 border border-rose-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="text-rose-600" size={20} />
              <h3 className="font-heading font-bold text-lg text-rose-900">Xung đột lịch trình</h3>
            </div>
            
            {conflicts.length > 0 ? (
              <div className="space-y-4">
                {conflicts.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-rose-100 relative group transition-all hover:shadow-md">
                    <p className="text-sm font-medium text-gray-800 mb-1 leading-relaxed">
                      <span className="font-bold">{c.name}</span> đang được phân công trùng giờ vào <span className="font-bold">{c.dowLabel}</span>.
                    </p>
                    <p className="text-xs text-rose-600 font-bold mb-3 bg-rose-50 w-fit px-2 py-0.5 rounded-md">({c.time1} - {c.time2})</p>
                    <button onClick={() => handleOpenModal(c.id, c.dateStr)} className="text-xs font-bold text-rose-600 hover:text-rose-800 underline transition-colors">
                      Xem chi tiết & Chỉnh sửa
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-bold text-emerald-800">Không có xung đột nào.</p>
                <p className="text-xs text-emerald-600/70 mt-1 font-medium">Lịch trình đang được tối ưu.</p>
              </div>
            )}
          </div>

          {/* Weekly Stats Panel */}
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-left">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="text-teal-600" size={20} />
              <h3 className="font-heading font-bold text-lg text-gray-800">Thống kê ca tuần</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-4">
              Số ca làm việc thực tế trong tuần đang xem.
            </p>
            
            <div className="space-y-4">
              {['Bác sĩ', 'Lễ tân', 'Kỹ thuật viên'].map(role => {
                const roleStats = weeklyStatsByStaff[role];
                if (!roleStats || roleStats.length === 0) return null;
                return (
                  <div key={role} className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">{role}</h4>
                    <div className="space-y-2">
                      {roleStats.map(st => (
                        <div key={st.name} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700 truncate max-w-[130px]">{st.name}</span>
                          <div className="flex gap-1.5 shrink-0">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold" title="Ca sáng">
                              S: {st.morning}
                            </span>
                            <span className="bg-cyan-50 text-cyan-700 border border-cyan-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold" title="Ca chiều">
                              C: {st.afternoon}
                            </span>
                            <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold" title="Nghỉ">
                              N: {st.off}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingSchedule ? 'Chỉnh sửa ca trực' : 'Phân công ca trực'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1.5 shadow-sm border border-gray-100 transition-colors hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nhân sự</label>
                  <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      {getAvatarInitials(staff.find(s => s.id === watch('nguoi_dung_id'))?.ho_ten || '')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{staff.find(s => s.id === watch('nguoi_dung_id'))?.ho_ten}</p>
                      <p className="text-xs text-teal-600 font-medium">{staff.find(s => s.id === watch('nguoi_dung_id'))?.vai_tro}</p>
                    </div>
                  </div>
                  <input type="hidden" {...register('nguoi_dung_id')} />
                  {errors.nguoi_dung_id && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.nguoi_dung_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày trực *</label>
                  <input type="date" {...register('ngay')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-medium text-gray-800 transition-all" />
                  {errors.ngay && <p className="text-rose-500 text-xs mt-1.5 font-bold">{errors.ngay.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Ca trực thiết lập *</label>
                  <select 
                    value={selectedShiftType} 
                    onChange={e => handleShiftTypeChange(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 text-gray-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-bold transition-all"
                  >
                    {!disabledShiftsForSelected.morning && (
                      <option value="morning">
                        🌅 Ca Sáng ({staff.find(s => s.id === watchedNguoiDungId)?.vai_tro === 'Lễ tân' ? '07:00 - 12:00' : '07:00 - 16:00'})
                      </option>
                    )}
                    {!disabledShiftsForSelected.afternoon && (
                      <option value="afternoon">
                        ☀️ Ca Chiều ({staff.find(s => s.id === watchedNguoiDungId)?.vai_tro === 'Lễ tân' ? '12:00 - 20:00' : '11:00 - 20:00'})
                      </option>
                    )}
                    <option value="tam_nghi">🌴 Nghỉ phép / Tạm nghỉ</option>
                  </select>
                </div>
                
                {/* Các input ẩn để lưu giờ gửi lên backend */}
                <input type="hidden" {...register('gio_bat_dau')} />
                <input type="hidden" {...register('gio_ket_thuc')} />
                <input type="hidden" {...register('trang_thai')} />
              </div>

              <div className="mt-8 flex justify-between items-center">
                {editingSchedule ? (
                  <button 
                    type="button" 
                    onClick={handleDeleteSchedule} 
                    className="px-4 py-2.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    Xóa ca trực
                  </button>
                ) : <div />}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-teal-600/20">
                    {editingSchedule ? 'Cập nhật' : 'Lưu phân công'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
