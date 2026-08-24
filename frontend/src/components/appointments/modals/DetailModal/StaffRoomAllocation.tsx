import { Users } from 'lucide-react';
import { resolveImageUrl } from '../../../../utils/imageUrl';

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
  /** B15 — chỉ true khi ca CHƯA bắt đầu (đã xác nhận/đã check-in) hoặc ĐANG THỰC HIỆN. Admin/Quản
   * lý không được đổi nhân sự ngoài 2 trạng thái này (hoàn thành/đã hủy/không đến/chờ tái lượng giá). */
  isReassignAllowed: boolean;
  buoi: 'sang' | 'chieu';
  /** null = chưa tải xong (bỏ qua kiểm tra ngân sách tạm thời, tránh chớp nhầm "không đủ"). */
  staffBudget: Record<string, { conLai: number; soKhachSongSong: number }> | null;
  serviceDurationMinutes: number;
  staffList: any[];
  schedulesList: any[];
  aptDateStr: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
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
  isReassignAllowed,
  buoi,
  staffBudget,
  serviceDurationMinutes,
  staffList,
  schedulesList,
  aptDateStr,
  aptStartHourStr,
  aptEndHourStr,
  appointments = [],
  onUnassignStaff: _onUnassignStaff
}: StaffRoomAllocationProps & { onUnassignStaff?: () => void }) {
  const hasAssignedStaff = !!selectedAppointment?.bac_si_id || !!selectedAppointment?.chuyen_gia_id || !!selectedAppointment?.nhan_su_id;
  const isEditable = isReassignAllowed && !(_isReceptionist && (hasAssignedStaff || isLocked));

  // Lễ tân không có quyền chọn nhân sự — khi ca chưa được Quản lý phân bổ, ẩn hẳn phần
  // nhân sự + phòng thay vì hiển thị dạng thẻ chọn được. Khi đã có nhân sự (dù khách tự
  // chọn lúc đặt online hay Quản lý gán tay), phần dưới vẫn hiển thị nhưng chỉ đọc (isEditable=false).
  if (_isReceptionist && !hasAssignedStaff) {
    return (
      <div className="space-y-3 font-jakarta">
        <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-1.5">
          Điều phối lâm sàng
        </h4>
        <div className="py-6 text-center text-xs font-bold text-slate-450 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl select-none">
          🕓 Ca thuộc Hàng chờ chung (Bất kỳ nhân sự rảnh nào cũng có thể nhận ca)
        </div>
      </div>
    );
  }

  // aptStartHourStr/aptEndHourStr là mốc buổi danh nghĩa (vd 07:30-12:00) — chỉ cần GIAO NHAU với
  // ca trực, không bắt ca trực phủ trọn buổi: nhân sự trực 07:00-16:00 vẫn hợp lệ cho buổi chiều
  // (12:00-20:00), chỉ là phủ MỘT PHẦN, cần cảnh báo rõ chứ không loại hẳn (giống cảnh báo đã có
  // ở form đặt lịch tại quầy — WalkInBookingModal.tsx).
  const getStaffDutyStatus = (staff: any) => {
    if (!schedulesList || schedulesList.length === 0) {
      return { hasDuty: true, label: '', isPartial: false };
    }

    const staffSchedules = schedulesList.filter(s =>
      String(s.nguoi_dung_id) === String(staff.id) &&
      s.ngay === aptDateStr
    );

    if (staffSchedules.length === 0) {
      return { hasDuty: false, label: 'Không trực hôm nay', isPartial: false };
    }

    const activeSchedule = staffSchedules.find(s => s.trang_thai === 'hoat_dong');
    if (!activeSchedule) {
      return { hasDuty: false, label: 'Nghỉ phép cả ngày', isPartial: false };
    }

    const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
    const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

    // Nhân sự đã TAN CA THẬT (giờ hiện tại đã qua giờ kết thúc ca trực) khi ngày đang xét là HÔM
    // NAY — họ không còn ở phòng khám nữa nên phải khóa hẳn, không chỉ cảnh báo phủ một phần. Cùng
    // lỗi đã sửa ở WalkInBookingModal.tsx (nơi TẠO lịch mới) — đây là nơi ĐỔI nhân sự cho lịch đã
    // có, dùng chung nguyên tắc.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (aptDateStr === todayStr) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const [endH, endM] = dutyEnd.split(':').map(Number);
      if (nowMinutes >= endH * 60 + endM) {
        return { hasDuty: false, label: `Đã tan ca (${dutyStart}-${dutyEnd}) — không còn tại phòng khám`, isPartial: false };
      }
    }

    const overlaps = dutyStart < aptEndHourStr && dutyEnd > aptStartHourStr;
    if (!overlaps) {
      return { hasDuty: false, label: `ca trực ${dutyStart}-${dutyEnd} không trùng buổi này`, isPartial: false };
    }

    const isPartial = dutyStart > aptStartHourStr || dutyEnd < aptEndHourStr;
    return { hasDuty: true, label: `Trực ${dutyStart}-${dutyEnd}`, isPartial, dutyEnd };
  };

  // B15 — số ca ĐANG THỰC HIỆN (dang_kham) của nhân sự này, đúng buổi/ngày đang xét — đối chiếu với
  // soKhachSongSong (Lớp 3 — giới hạn bàn song song), tách biệt với ngân sách phút (Lớp 1).
  const getDangKhamCount = (staffId: any) => {
    return appointments.filter((apt) => {
      if (String(apt.id) === String(selectedAppointment.id)) return false;
      if (apt.trang_thai !== 'dang_kham') return false;
      if (apt.buoi !== buoi) return false;
      const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
      if (String(assignedId) !== String(staffId)) return false;
      try {
        const d = new Date(apt.ngay_gio_bat_dau);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dStr === aptDateStr;
      } catch (e) {
        return false;
      }
    }).length;
  };

  const getAvatarInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'NV';
    const clean = name.trim();
    if (!clean) return 'NV';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || '';
      const last = parts[parts.length - 1]?.[0] || '';
      return (first + last).toUpperCase() || 'NV';
    }
    return clean.slice(0, 2).toUpperCase() || 'NV';
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

  const isCurrentCaActiveOrDone = ['dang_kham', 'hoan_thanh'].includes(selectedAppointment.trang_thai);

  return (
    <div className="space-y-4 font-jakarta">
      {/* 1. NHÂN SỰ PHỤ TRÁCH */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {targetRole === 'Bác sĩ' ? 'Chuyên viên phụ trách' : 'Kỹ thuật viên phụ trách'}
          </label>
          {isEditable && assignStaffId && !isCurrentCaActiveOrDone && ['da_xac_nhan', 'da_checkin'].includes(selectedAppointment.trang_thai) && (
            <button
              type="button"
              onClick={() => setAssignStaffId('')}
              className="text-[10px] text-rose-500 font-extrabold hover:underline cursor-pointer"
            >
              Hủy gán (Chuyển về Hàng chờ chung)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {/* Card: Bất kỳ (Hàng chờ chung) - Chỉ hiện khi ca ở trạng thái Chờ (da_xac_nhan / da_checkin) */}
          {isEditable && !isCurrentCaActiveOrDone && ['da_xac_nhan', 'da_checkin'].includes(selectedAppointment.trang_thai) && (
            <div
              onClick={() => setAssignStaffId('')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                !assignStaffId
                  ? 'bg-emerald-50 dark:bg-emerald-955/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div className={`size-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
                !assignStaffId ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
              }`}>
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black truncate">Bất kỳ (Hàng chờ chung)</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-400 truncate">
                  Không gán đích danh · Nhân sự rảnh tự nhận
                </p>
              </div>
            </div>
          )}

          {displayedStaff.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs font-bold text-slate-450 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl select-none">
              📭 Không có nhân sự trực khả dụng
            </div>
          ) : (
            displayedStaff.map(staff => {
              const staffId = staff.id;
              const duty = getStaffDutyStatus(staff);
              const isSelected = String(assignStaffId) === String(staffId);

              // B15 — Lớp 3 (bàn song song): số ca đang thực hiện ngay bây giờ so với cấu hình
              // song song của nhân sự đó (mặc định 1 nếu chưa tải xong ngân sách).
              const budgetInfo = staffBudget ? staffBudget[String(staffId)] : null;
              const soKhachSongSong = budgetInfo?.soKhachSongSong ?? 1;
              const dangKhamCount = getDangKhamCount(staffId);
              const isParallelFull = dangKhamCount >= soKhachSongSong;

              // Lớp 1 (ngân sách phút): bỏ qua kiểm tra khi staffBudget còn null (đang tải) để
              // tránh chớp nhầm "không đủ" trước khi có dữ liệu thật.
              const hasEnoughBudget = !staffBudget || !budgetInfo || budgetInfo.conLai >= serviceDurationMinutes;

              const isAvailable = duty.hasDuty && !isParallelFull && hasEnoughBudget;

              let blockReason: string | null = null;
              if (!duty.hasDuty) {
                blockReason = duty.label || 'không trực buổi này';
              } else if (isParallelFull) {
                blockReason = `đang thực hiện đủ ${dangKhamCount}/${soKhachSongSong} ca song song`;
              } else if (!hasEnoughBudget && budgetInfo) {
                blockReason = `chỉ còn ${budgetInfo.conLai} phút, ca này cần ${serviceDurationMinutes} phút`;
              }

              // Calculate occupied count for this staff on the target date
              const staffAptsCount = appointments.filter(apt => {
                const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
                let aptDStr = '';
                try {
                  const d = new Date(apt.ngay_gio_bat_dau);
                  aptDStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } catch (e) { }
                return String(assignedId) === String(staffId) &&
                  aptDStr === aptDateStr &&
                  apt.trang_thai !== 'da_huy' &&
                  apt.trang_thai !== 'khong_den';
              }).length;

              const isClickable = isEditable && !isCurrentCaActiveOrDone && isAvailable;

              return (
                <div
                  key={staff.id}
                  onClick={() => isClickable && setAssignStaffId(String(staffId))}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 select-none ${
                    isCurrentCaActiveOrDone
                      ? isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-955/40 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 shadow-md ring-2 ring-emerald-500/20 cursor-default font-extrabold'
                        : 'bg-slate-50/60 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/60 opacity-40 cursor-not-allowed select-none'
                      : !isEditable
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
                      className={`w-8 h-8 rounded-full object-cover shrink-0 border-2 ${isSelected && isAvailable
                          ? 'border-emerald-600'
                          : 'border-slate-200 dark:border-zinc-750'
                        }`}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border ${isSelected && isAvailable
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
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${!isAvailable
                          ? 'bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455'
                          : 'bg-emerald-100 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450'
                        }`}>
                        {isAvailable ? 'Sẵn sàng' : 'Không khả dụng'}
                      </span>
                      {isAvailable && duty.label && (
                        duty.isPartial ? (
                          <span className="text-[9px] text-amber-600 dark:text-amber-450 font-black truncate">
                            ⚠️ {duty.label} — chỉ nhận khách đến trước {duty.dutyEnd}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 dark:text-zinc-555 font-bold truncate">
                            {duty.label}
                          </span>
                        )
                      )}
                    </div>
                    {/* B15 — ghi chú lý do CỤ THỂ ngay dưới nhân sự khi không phân bổ được, thay vì
                        chỉ có badge "Không khả dụng" trơ trọi không nói được vì sao. */}
                    {!isAvailable && blockReason && (
                      <p className="text-[9px] text-rose-600 dark:text-rose-450 font-bold mt-1 leading-snug">
                        ❌ Không thể phân bổ vì {blockReason}
                      </p>
                    )}
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
            {selectedAppointment.loai_lich === 'kham_moi' ? 'Phòng lượng giá chức năng' : 'Phòng trị liệu'}
          </label>
        </div>
        <div className="w-full px-4 py-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-855 rounded-xl text-sm font-bold text-slate-800 dark:text-zinc-150 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-800 dark:text-zinc-100">{resolvedRoomName}</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-555 uppercase tracking-wider font-extrabold">
              {resolvedRoom
                ? (selectedAppointment.loai_lich === 'kham_moi' ? 'Tự động phân theo ca trực Chuyên viên PHCN' : 'Tự động phân theo ca trực KTV')
                : 'Chưa phân phòng'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
