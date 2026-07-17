import { resolveImageUrl } from '../../../../../utils/imageUrl';

interface StaffRoomAllocationProps {
  selectedAppointment: any;
  resolvedRoomName: string;
  resolvedRoom: any;
  targetRole: string;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  isReceptionist: boolean;
  isLocked?: boolean;
  staffList: any[];
  schedulesList: any[];
  aptDateStr: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  occupiedStaffIds: any[];
  appointments?: any[];
}

export function StaffRoomAllocation({
  selectedAppointment,
  resolvedRoomName,
  resolvedRoom,
  targetRole,
  assignStaffId,
  setAssignStaffId,
  assignStatus: _assignStatus,
  isReceptionist: _isReceptionist,
  isLocked = false,
  staffList,
  schedulesList,
  aptDateStr,
  aptStartHourStr,
  aptEndHourStr,
  occupiedStaffIds,
  appointments = []
}: StaffRoomAllocationProps) {
  const hasAssignedStaff = !!selectedAppointment?.bac_si_id || !!selectedAppointment?.chuyen_gia_id;
  // Lịch còn "chưa xác nhận" nghĩa là CHƯA có tín hiệu xác thực nào (khách chưa OTP, Lễ tân chưa
  // gọi) — khớp đúng quy tắc đối xứng ở appointment.service.ts::confirmOTPAppointment (targetStatus
  // = nhan_su_id ? da_xac_nhan : cho_xac_nhan). Nếu cho phép phân bổ nhân sự ngay từ lúc này, chỉ
  // riêng thao tác gán nhân sự (không kèm xác thực gì) có thể vô tình đẩy lịch lên "Đã xác nhận"
  // trong khi khách chưa hề xác nhận sẽ đến. Khóa hẳn cho tới khi trạng thái rời khỏi chua_xac_nhan.
  const isUnverified = selectedAppointment?.trang_thai === 'chua_xac_nhan';
  const isEditable = !isUnverified && !(_isReceptionist && (hasAssignedStaff || isLocked));

  if (!_isReceptionist && isUnverified && !hasAssignedStaff) {
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
          Điều phối lâm sàng
        </h4>
        <div className="py-6 px-4 text-center text-xs font-bold text-slate-450 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl select-none leading-relaxed">
          🔒 Chờ khách xác thực OTP hoặc Lễ tân liên hệ xác nhận trước khi phân bổ nhân sự.
        </div>
      </div>
    );
  }

  // Lễ tân không có quyền chọn nhân sự — khi ca chưa được Quản lý phân bổ, ẩn hẳn phần
  // nhân sự + phòng thay vì hiển thị dạng thẻ chọn được. Khi đã có nhân sự (dù khách tự
  // chọn lúc đặt online hay Quản lý gán tay), phần dưới vẫn hiển thị nhưng chỉ đọc (isEditable=false).
  if (_isReceptionist && !hasAssignedStaff) {
    return (
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
          Điều phối lâm sàng
        </h4>
        <div className="py-6 text-center text-xs font-bold text-slate-450 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl select-none">
          🕓 Nhân sự &amp; phòng sẽ hiển thị sau khi Quản lý phân bổ
        </div>
      </div>
    );
  }

  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '' };
    }

    const staffSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(staff.id) && 
      s.ngay === aptDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay' };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày' };
    }

    const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

    const isCovered = dutyStart <= aptStartHourStr && dutyEnd >= aptEndHourStr;
    if (!isCovered) {
      return { hasDuty: false, label: `Trực ca ${dutyStart}-${dutyEnd}` };
    }

    return { hasDuty: true, label: `Trực ca ${dutyStart}-${dutyEnd}` };
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return 'NV';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filter staff according to user business logic
  const displayedStaff = staffList
    .filter(s => s.vai_tro === targetRole)
    .filter(staff => {
      const assignedId = selectedAppointment.bac_si_id || selectedAppointment.chuyen_gia_id;
      const isCurrentlyAssigned = assignedId && String(staff.id) === String(assignedId);
      
      // Check if they have an active schedule today (i.e. they are working, not vacation/absent)
      const staffSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(staff.id) && 
        s.ngay === aptDateStr
      );
      const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
      const isOnShift = activeSchedule !== undefined;

      // Always show currently assigned staff
      if (isCurrentlyAssigned) return true;

      // Hide if they are not working today ( nghỉ / không trực )
      if (!isOnShift) return false;

      // Admin/Receptionist sees everyone who is on duty today
      return true;
    });

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
        Điều phối lâm sàng
      </h4>

      {/* 1. NHÂN SỰ PHỤ TRÁCH */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {targetRole === 'Bác sĩ' ? 'Bác sĩ phụ trách' : 'Kỹ thuật viên phụ trách'}
          </label>
          {isEditable && assignStaffId && (
            <button 
              type="button" 
              onClick={() => setAssignStaffId('')} 
              className="text-[10px] text-rose-500 font-extrabold hover:underline"
            >
              Hủy phân công
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {displayedStaff.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs font-bold text-slate-450 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl select-none">
              📭 Không có nhân sự trực khả dụng
            </div>
          ) : (
            displayedStaff.map(staff => {
              const staffId = staff.id;
              const duty = getStaffDutyStatus(staff);
              const isAvailable = duty.hasDuty && !occupiedStaffIds.includes(staffId);
              const isSelected = String(assignStaffId) === String(staffId);

              // Calculate occupied count for this staff on the target date
              const staffAptsCount = appointments.filter(apt => {
                const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
                let aptDStr = '';
                try {
                  const d = new Date(apt.ngay_gio_bat_dau);
                  aptDStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } catch (e) {}
                return String(assignedId) === String(staffId) &&
                  aptDStr === aptDateStr &&
                  apt.trang_thai !== 'da_huy' &&
                  apt.trang_thai !== 'khong_den' &&
                  apt.trang_thai !== 'giu_cho';
              }).length;

              return (
                <div
                  key={staff.id}
                  onClick={() => isEditable && isAvailable && setAssignStaffId(String(staffId))}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 select-none ${
                    !isEditable
                      ? isSelected
                        ? 'bg-emerald-50/30 dark:bg-emerald-955/10 border-emerald-500/80 dark:border-emerald-600/80 text-emerald-800 dark:text-emerald-355 cursor-default'
                        : 'bg-slate-50/50 dark:bg-zinc-800/10 border-slate-100 dark:border-zinc-800/30 opacity-40 cursor-not-allowed'
                      : !isAvailable
                        ? 'bg-slate-50 dark:bg-zinc-800/20 border-slate-100 dark:border-zinc-800/50 opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-emerald-50/50 dark:bg-emerald-955/15 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-355 ring-2 ring-emerald-500/10 cursor-pointer'
                          : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  {staff.anh_dai_dien ? (
                    <img
                      src={resolveImageUrl(staff.anh_dai_dien)}
                      alt={staff.ho_ten}
                      className={`w-8 h-8 rounded-full object-cover shrink-0 border-2 ${
                        isSelected && isAvailable
                          ? 'border-emerald-600'
                          : 'border-slate-200 dark:border-zinc-750'
                      }`}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border ${
                      isSelected && isAvailable
                        ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-450 border-slate-200 dark:border-zinc-750'
                    }`}>
                      {getAvatarInitials(staff.ho_ten)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                      <span>{staff.ho_ten}</span>
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.2 rounded font-extrabold">{staffAptsCount} ca</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        !isAvailable
                          ? 'bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455'
                          : 'bg-emerald-100 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450'
                      }`}>
                        {isAvailable ? 'Sẵn sàng' : 'Không khả dụng'}
                      </span>
                      {duty.label && (
                        <span className="text-[9px] text-slate-400 dark:text-zinc-555 font-bold truncate">
                          {duty.label.replace('Trực ca ', '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. PHÒNG THỰC HIỆN */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {selectedAppointment.loai_lich === 'kham_moi' ? 'Phòng khám lâm sàng' : 'Phòng trị liệu'}
          </label>
        </div>
        <div className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-855 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-150 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-800 dark:text-zinc-100">{resolvedRoomName}</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-555 uppercase tracking-wider font-extrabold">
              {resolvedRoom 
                ? (selectedAppointment.loai_lich === 'kham_moi' ? 'Tự động phân theo ca trực Bác sĩ' : 'Tự động phân theo ca trực KTV')
                : 'Chưa phân phòng'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
