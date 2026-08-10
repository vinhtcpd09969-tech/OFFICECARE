import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, DoorOpen, Check, AlertCircle, Sun, Sunrise, Palmtree, ChevronDown, Sparkles } from 'lucide-react';
import { Schedule, Staff, Room } from '../types';
import { useScheduleForm } from '../hooks/useScheduleForm';
import { getAvatarInitials } from '../constants';

interface ScheduleFormModalProps {
  isOpen: boolean;
  staff: Staff[];
  rooms: Room[];
  schedules: Schedule[];
  editingSchedule: Schedule | null;
  prefilledStaffId: string | null;
  prefilledDate: string | null;
  selectedShiftType: 'morning' | 'afternoon' | 'tam_nghi';
  setSelectedShiftType: (type: 'morning' | 'afternoon' | 'tam_nghi') => void;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteSchedule: () => void;
}

export function ScheduleFormModal({
  isOpen,
  staff,
  rooms,
  schedules,
  editingSchedule,
  prefilledStaffId,
  prefilledDate,
  selectedShiftType,
  setSelectedShiftType,
  onClose,
  onSuccess,
  onDeleteSchedule
}: ScheduleFormModalProps) {
  const {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    isDoctor,
    isTechnician,
    availableRoomsForRole,
    disabledShiftsForSelected,
    handleShiftTypeChange,
    fillFormForCreation,
    fillFormForEditing,
    onSubmit
  } = useScheduleForm({
    staff,
    rooms,
    schedules,
    editingSchedule,
    setSelectedShiftType,
    onSuccess
  });

  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);

  // Pre-fill form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsRoomDropdownOpen(false);
    if (editingSchedule) {
      fillFormForEditing(editingSchedule);
    } else if (prefilledStaffId) {
      fillFormForCreation(prefilledStaffId, prefilledDate || undefined);
    }
  }, [isOpen, editingSchedule, prefilledStaffId, prefilledDate, fillFormForEditing, fillFormForCreation]);

  const selectedDate = watch('ngay');
  const watchedPhongId = watch('phong_id');
  const todayDateStr = React.useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);
  const isPastDate = !!(selectedDate && selectedDate < todayDateStr);

  const currentUserId = watch('nguoi_dung_id');
  const selectedStaff = staff.find(s => s.id === currentUserId);
  const selectedStaffName = selectedStaff?.ho_ten || '';
  const selectedStaffRole = selectedStaff?.vai_tro || '';

  const selectedRoomObj = availableRoomsForRole.find(r => String(r.id) === String(watchedPhongId));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#0D9488] to-teal-700 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="size-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {editingSchedule ? 'Chỉnh Sửa Ca Trực' : 'Phân Công Ca Trực'}
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">Lập lịch trực y khoa OfficeCare</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar">
          
          {/* Staff Banner Card */}
          <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/50 dark:from-teal-950/60 dark:to-emerald-950/40 border border-teal-100 dark:border-teal-900/60 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-teal-700/20">
                {getAvatarInitials(selectedStaffName)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{selectedStaffName}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D9488] dark:text-teal-300">
                  <Sparkles size={11} /> {selectedStaffRole}
                </span>
              </div>
            </div>
            <input type="hidden" {...register('nguoi_dung_id')} />
          </div>

          {/* Current Schedule Summary if editing */}
          {editingSchedule && (
            <div className="bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 rounded-2xl p-3.5 space-y-1.5 select-none">
              <span className="text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest block">Thông tin ca trực hiện tại</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-zinc-400 font-bold block mb-0.5">KHUNG GIỜ:</span>
                  <p className="font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-1">
                    <Clock size={12} className="text-[#0D9488] dark:text-teal-400" />
                    {editingSchedule.gio_bat_dau?.slice(0, 5)} - {editingSchedule.gio_ket_thuc?.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-400 font-bold block mb-0.5">PHÒNG GÁN:</span>
                  <p className="font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-1">
                    <DoorOpen size={12} className="text-[#0D9488] dark:text-teal-400" />
                    {editingSchedule.ma_phong ? editingSchedule.ma_phong : 'Chưa gán phòng'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Ngày Trực *
            </label>
            <div className="relative">
              <input 
                type="date" 
                disabled={isPastDate}
                {...register('ngay')} 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] outline-none text-sm font-bold text-slate-800 dark:text-zinc-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
              />
            </div>
            {errors.ngay && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.ngay.message}</p>}
          </div>

          {/* Shift Selection (Visual Interactive Radio Cards) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Ca Trực Thiết Lập *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Ca sáng */}
              <button
                type="button"
                disabled={isPastDate || disabledShiftsForSelected.morning}
                onClick={() => handleShiftTypeChange('morning')}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 relative cursor-pointer ${
                  selectedShiftType === 'morning'
                    ? 'bg-teal-50/80 dark:bg-teal-950/60 border-[#0D9488] text-[#0D9488] dark:text-teal-300 shadow-sm ring-2 ring-[#0D9488]/20 font-black'
                    : 'bg-slate-50/60 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700 font-bold'
                } ${disabledShiftsForSelected.morning ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-zinc-800' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Sunrise size={14} className={selectedShiftType === 'morning' ? 'text-[#0D9488] dark:text-teal-300' : 'text-amber-500'} /> Ca Sáng
                  </span>
                  {selectedShiftType === 'morning' && (
                    <div className="size-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block">
                  {selectedStaffRole === 'Lễ tân' ? '07:00 - 12:00' : '07:00 - 16:00'}
                </span>
                {disabledShiftsForSelected.morning && (
                  <span className="text-[9px] font-black text-rose-500 uppercase mt-1 block">Đã có ca</span>
                )}
              </button>

              {/* Ca chiều */}
              <button
                type="button"
                disabled={isPastDate || disabledShiftsForSelected.afternoon}
                onClick={() => handleShiftTypeChange('afternoon')}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 relative cursor-pointer ${
                  selectedShiftType === 'afternoon'
                    ? 'bg-teal-50/80 dark:bg-teal-950/60 border-[#0D9488] text-[#0D9488] dark:text-teal-300 shadow-sm ring-2 ring-[#0D9488]/20 font-black'
                    : 'bg-slate-50/60 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700 font-bold'
                } ${disabledShiftsForSelected.afternoon ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-zinc-800' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Sun size={14} className={selectedShiftType === 'afternoon' ? 'text-[#0D9488] dark:text-teal-300' : 'text-amber-500'} /> Ca Chiều
                  </span>
                  {selectedShiftType === 'afternoon' && (
                    <div className="size-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold block">
                  {selectedStaffRole === 'Lễ tân' ? '12:00 - 20:00' : '11:00 - 20:00'}
                </span>
                {disabledShiftsForSelected.afternoon && (
                  <span className="text-[9px] font-black text-rose-500 uppercase mt-1 block">Đã có ca</span>
                )}
              </button>

              {/* Tạm nghỉ */}
              <button
                type="button"
                disabled={isPastDate}
                onClick={() => handleShiftTypeChange('tam_nghi')}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 relative cursor-pointer ${
                  selectedShiftType === 'tam_nghi'
                    ? 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm ring-2 ring-amber-400/20 font-black'
                    : 'bg-slate-50/60 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700 font-bold'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Palmtree size={14} className="text-amber-600" /> Tạm Nghỉ
                  </span>
                  {selectedShiftType === 'tam_nghi' && (
                    <div className="size-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-amber-700/80 font-semibold block">
                  Nghỉ phép / Ca nghỉ
                </span>
              </button>

            </div>
          </div>

          {/* Room Choice Custom Styled Dropdown Panel */}
          {watch('trang_thai') === 'hoat_dong' && (isDoctor || isTechnician) && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                {isDoctor ? 'Phòng Lượng Giá' : 'Phòng Trị Liệu'} *
              </label>

              {/* Custom Selector Trigger Button */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isPastDate}
                  onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
                  className={`w-full px-4 py-3 bg-slate-50/80 border rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${
                    errors.phong_id 
                      ? 'border-rose-300 ring-2 ring-rose-100' 
                      : (watchedPhongId ? 'border-[#0D9488] bg-teal-50/20 ring-2 ring-[#0D9488]/10' : 'border-slate-200 hover:border-slate-300')
                  } ${isPastDate ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DoorOpen size={18} className={watchedPhongId ? 'text-[#0D9488]' : 'text-slate-400'} />
                    {selectedRoomObj ? (
                      <div className="truncate">
                        <span className="text-xs font-black text-slate-900 mr-2">
                          {selectedRoomObj.ten_phong}
                        </span>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md border border-teal-200/60">
                          {selectedRoomObj.ma_phong}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2 font-semibold">
                          ({selectedRoomObj.occupancy || 0}/{selectedRoomObj.suc_chua || 1} ca)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        {isDoctor ? '-- Chọn phòng lượng giá --' : '-- Chọn phòng trị liệu --'}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isRoomDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options Custom Popup Menu */}
                {isRoomDropdownOpen && !isPastDate && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-30 p-2 space-y-1 max-h-56 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                    {availableRoomsForRole.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-semibold">
                        Không có phòng khả dụng cho vai trò này
                      </div>
                    ) : (
                      availableRoomsForRole.map(r => {
                        const isSelected = String(r.id) === String(watchedPhongId);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={r.isFull}
                            onClick={() => {
                              setValue('phong_id', String(r.id), { shouldValidate: true });
                              setIsRoomDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left text-xs transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 text-[#0D9488] font-black border border-teal-200/80'
                                : 'hover:bg-slate-50 text-slate-700 font-bold'
                            } ${r.isFull ? 'opacity-50 bg-slate-50/60 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <DoorOpen size={15} className={isSelected ? 'text-[#0D9488]' : 'text-slate-400'} />
                              <div className="truncate">
                                <span className="font-extrabold text-slate-900 mr-1.5">{r.ten_phong}</span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {r.ma_phong}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                r.isFull
                                  ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              }`}>
                                {r.occupancy || 0}/{r.suc_chua || 1} {r.isFull ? '• Hết chỗ' : '• Trống'}
                              </span>
                              {isSelected && <Check size={14} className="text-[#0D9488]" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Hidden field registered for react-hook-form */}
              <input type="hidden" {...register('phong_id')} />
              {errors.phong_id && (
                <p className="text-rose-500 text-xs mt-1.5 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.phong_id.message}
                </p>
              )}
            </div>
          )}

          {/* Hidden fields */}
          <input type="hidden" {...register('gio_bat_dau')} />
          <input type="hidden" {...register('gio_ket_thuc')} />
          <input type="hidden" {...register('trang_thai')} />

          {/* Past Date Warning Alert */}
          {isPastDate && (
            <div className="text-xs text-amber-800 font-extrabold bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-2 select-none">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>Ca trực ở thời điểm quá khứ chỉ cho phép xem thông tin.</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-3">
            {editingSchedule && !isPastDate ? (
              <button 
                type="button" 
                onClick={onDeleteSchedule} 
                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
              >
                Xóa Ca Trực
              </button>
            ) : <div />}
            
            <div className="flex gap-2.5 ml-auto">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
              >
                {isPastDate ? 'Đóng' : 'Hủy Bỏ'}
              </button>
              {!isPastDate && (
                <button 
                  type="submit" 
                  className="px-6 py-2.5 text-white bg-[#0D9488] hover:bg-teal-700 rounded-xl font-extrabold text-xs transition-all shadow-md shadow-teal-700/20 cursor-pointer active:scale-98"
                >
                  {editingSchedule ? 'Cập Nhật Ca' : 'Lưu Phân Công'}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ScheduleFormModal;
