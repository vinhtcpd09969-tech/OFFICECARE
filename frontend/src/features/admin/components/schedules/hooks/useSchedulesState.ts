import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSchedules, getStaff, getRooms, deleteSchedule } from '../../../../../api/admin.api';
import { getWeekDates } from '../constants';
import { Schedule, Staff, Room } from '../types';
import toast from 'react-hot-toast';

export function useSchedulesState() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'next' | 'after_next'>('current');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [schedRes, staffRes, roomsRes] = await Promise.all([
        getSchedules(),
        getStaff(),
        getRooms()
      ]);
      setSchedules(schedRes.data || []);
      setStaff((staffRes.data || []).filter((s: any) => ['Kỹ thuật viên', 'Bác sĩ', 'Lễ tân'].includes(s.vai_tro)));
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error('Error fetching schedules data:', error);
      toast.error('Không thể tải dữ liệu lịch trực');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weekDates = useMemo(() => getWeekDates(selectedWeek), [selectedWeek]);

  // Derived state calculations: groupedStaff, conflicts, stats
  const { groupedStaff, conflicts, stats } = useMemo(() => {
    // 1. Filter staff by role
    let filtered = staff;
    if (roleFilter !== 'all') {
      filtered = staff.filter(s => s.vai_tro === roleFilter);
    }

    // 2. Group by role
    const grouped: Record<string, Staff[]> = { 'Bác sĩ': [], 'Lễ tân': [], 'Kỹ thuật viên': [] };
    filtered.forEach(s => {
      if (grouped[s.vai_tro]) grouped[s.vai_tro].push(s);
    });

    // 3. Detect conflicts
    const conflictList: any[] = [];
    const staffSchedules: Record<string, Schedule[]> = {};
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
              time1: sorted[i].gio_bat_dau.slice(0, 5),
              time2: sorted[i + 1].gio_bat_dau.slice(0, 5)
            });
            break; // just register one conflict per staff/day
          }
        }
      }
    });

    // 4. Calculate Stats
    const todayStr = weekDates.find(d => d.isToday)?.fullDateStr;
    const activeToday = todayStr 
      ? new Set(schedules.filter(s => s.ngay === todayStr && s.trang_thai === 'hoat_dong').map(s => s.nguoi_dung_id)).size 
      : 0;
    
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

  const handleDeleteScheduleById = useCallback(async (id: string | number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ca trực này?')) {
      try {
        await deleteSchedule(String(id));
        toast.success('Xóa ca trực thành công!');
        await fetchData();
        return true;
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
        return false;
      }
    }
    return false;
  }, [fetchData]);

  return {
    schedules,
    staff,
    rooms,
    loading,
    selectedWeek,
    setSelectedWeek,
    roleFilter,
    setRoleFilter,
    weekDates,
    groupedStaff,
    conflicts,
    stats,
    weeklyStatsByStaff,
    handleDeleteScheduleById,
    fetchData
  };
}
