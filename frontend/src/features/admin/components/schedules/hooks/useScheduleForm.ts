import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';
import { scheduleSchema, ScheduleFormValues, Schedule, Staff, Room } from '../types';
import { formatLocalDate } from '../constants';
import { createSchedule, updateSchedule } from '../../../../../api/admin.api';
import toast from 'react-hot-toast';

interface UseScheduleFormProps {
  staff: Staff[];
  rooms: Room[];
  schedules: Schedule[];
  editingSchedule: Schedule | null;
  selectedShiftType: 'morning' | 'afternoon' | 'tam_nghi';
  setSelectedShiftType: (type: 'morning' | 'afternoon' | 'tam_nghi') => void;
  onSuccess: () => void;
}

export function useScheduleForm({
  staff,
  rooms,
  schedules,
  editingSchedule,
  selectedShiftType,
  setSelectedShiftType,
  onSuccess
}: UseScheduleFormProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { trang_thai: 'hoat_dong', gio_bat_dau: '07:00', gio_ket_thuc: '15:30', phong_id: '', giuong_so: '' }
  });

  const watchedNguoiDungId = watch('nguoi_dung_id');
  const watchedNgay = watch('ngay');
  const watchedGioBatDau = watch('gio_bat_dau');

  const selectedStaffObj = useMemo(() => {
    return staff.find(s => s.id === watchedNguoiDungId);
  }, [staff, watchedNguoiDungId]);

  const isDoctor = selectedStaffObj?.vai_tro === 'Bác sĩ';

  const availableRoomsForRole = useMemo(() => {
    if (!watchedNguoiDungId) return [];
    
    if (isDoctor) {
      const clinicRooms = rooms.filter((r: Room) => r.loai_phong === 'kham_benh');
      if (!watchedNgay || !watchedGioBatDau) return clinicRooms;
      
      const currentHour = parseInt(watchedGioBatDau.split(':')[0]) || 0;
      const isCurrentMorning = currentHour < 11;
      
      const occupiedRoomIds = new Set<string>();
      schedules.forEach(s => {
        if (
          s.ngay === watchedNgay && 
          s.trang_thai === 'hoat_dong' && 
          (!editingSchedule || s.id !== editingSchedule.id) &&
          s.phong_id
        ) {
          const schedStaff = staff.find(st => st.id === s.nguoi_dung_id);
          if (schedStaff?.vai_tro === 'Bác sĩ') {
            const sHour = parseInt(s.gio_bat_dau.split(':')[0]) || 0;
            const isSMorning = sHour < 11;
            
            if (isCurrentMorning === isSMorning) {
              occupiedRoomIds.add(s.phong_id.toString());
            }
          }
        }
      });
      
      return clinicRooms.filter((r: Room) => !occupiedRoomIds.has(r.id.toString()));
    }
    
    return [];
  }, [rooms, isDoctor, watchedNgay, watchedGioBatDau, schedules, editingSchedule, watchedNguoiDungId, staff]);

  const handleShiftTypeChange = useCallback((type: 'morning' | 'afternoon' | 'tam_nghi') => {
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
  }, [staff, setValue, watch, setSelectedShiftType]);

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

  const getFirstAvailableShiftForDoctor = useCallback((userId: string, dateStr: string) => {
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
  }, [staff, schedules, editingSchedule]);

  // Adjust selected shift if conflicting doctor shift is auto-detected
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
  }, [watchedNgay, watchedNguoiDungId, disabledShiftsForSelected, selectedShiftType, staff, handleShiftTypeChange]);

  const fillFormForCreation = useCallback((userId: string, dateStr?: string) => {
    reset();
    setValue('nguoi_dung_id', userId);
    const targetDate = dateStr || formatLocalDate(new Date());
    setValue('ngay', targetDate);
    setValue('phong_id', '');
    setValue('giuong_so', '');
    
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
  }, [staff, reset, setValue, getFirstAvailableShiftForDoctor, setSelectedShiftType]);

  const fillFormForEditing = useCallback((sched: Schedule) => {
    reset();
    setValue('nguoi_dung_id', sched.nguoi_dung_id);
    setValue('ngay', sched.ngay);
    setValue('gio_bat_dau', sched.gio_bat_dau.slice(0, 5));
    setValue('gio_ket_thuc', sched.gio_ket_thuc.slice(0, 5));
    setValue('trang_thai', sched.trang_thai as any);
    setValue('phong_id', sched.phong_id ? sched.phong_id.toString() : '');
    setValue('giuong_so', sched.giuong_so ? Number(sched.giuong_so) : '');

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
  }, [reset, setValue, setSelectedShiftType]);

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
      const selectedStaffObj = staff.find(s => s.id === data.nguoi_dung_id);
      const isDoctorNow = selectedStaffObj?.vai_tro === 'Bác sĩ';
      
      const submitData = {
        ...data,
        phong_id: isDoctorNow && data.trang_thai === 'hoat_dong' ? (data.phong_id ? Number(data.phong_id) : null) : null,
        giuong_so: null
      };

      if (editingSchedule) {
        await updateSchedule(String(editingSchedule.id), submitData);
        toast.success('Cập nhật ca trực thành công!');
      } else {
        await createSchedule(submitData);
        toast.success('Tạo ca trực thành công!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    isDoctor,
    availableRoomsForRole,
    disabledShiftsForSelected,
    handleShiftTypeChange,
    fillFormForCreation,
    fillFormForEditing,
    onSubmit
  };
}
