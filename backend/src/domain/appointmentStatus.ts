/**
 * Quy tắc chuyển trạng thái lịch hẹn (cuoc_hen) dành riêng cho Lễ tân — Admin/Bác sĩ/Quản lý
 * không bị giới hạn bởi file này. Thay thế cho các khối `if` rời rạc trước đây ở
 * `receptionist.service.ts` — nay dùng chung cho CẢ route `/receptionist/...` lẫn
 * `/admin/appointments/:id/status` khi actor là Lễ tân (xem `appointment.repository.ts`).
 */

const UNCONFIRMED_STATUSES = ['chua_xac_nhan', 'cho_xac_nhan'];
const CHECKIN_EARLY_WINDOW_MS = 30 * 60 * 1000;
const NO_SHOW_GRACE_WINDOW_MS = 15 * 60 * 1000;
const IN_PROGRESS_LOCKED_STATUSES = ['da_checkin', 'check_in', 'dang_kham', 'hoan_thanh'];
const CANCELLED_STATUSES = ['da_huy', 'da_huy_phat'];
const NO_SHOW_STATUSES = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'];
const TERMINAL_STATUSES = [...CANCELLED_STATUSES, ...NO_SHOW_STATUSES];

export interface ReceptionistTransitionCheck {
  allowed: boolean;
  reason?: string;
}

function formatVnDateTime(date: Date): string {
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  return `${timeStr} ngày ${dateStr}`;
}

/**
 * Trạng thái mà Lễ tân không còn được thao tác gì nữa trên lịch hẹn (khóa toàn bộ form:
 * dropdown, ghi chú nội bộ, nhân sự/phòng, nút Lưu cập nhật) — chỉ còn xem, hoặc (khi
 * `hoan_thanh`) đi tới luồng thanh toán riêng.
 */
export function isReceptionistLockedStatus(currentStatus: string): boolean {
  return IN_PROGRESS_LOCKED_STATUSES.includes(currentStatus) || TERMINAL_STATUSES.includes(currentStatus);
}

/**
 * Danh sách trạng thái Lễ tân được phép chuyển tới từ `currentStatus` hiện tại.
 * Không cộng dồn qua các nhóm — mỗi trạng thái hiện tại chỉ có đúng 1 tập target hợp lệ.
 */
export function getReceptionistAllowedTargets(currentStatus: string, hasAssignedStaff: boolean): string[] {
  if (UNCONFIRMED_STATUSES.includes(currentStatus)) {
    return hasAssignedStaff ? ['da_xac_nhan', 'da_huy'] : ['cho_xac_nhan', 'da_huy'];
  }
  if (currentStatus === 'da_xac_nhan') {
    return ['da_checkin', 'khong_den', 'da_huy'];
  }
  return [];
}

/**
 * Kiểm tra 1 lần chuyển trạng thái cụ thể có hợp lệ với Lễ tân không. Hàm thuần (không throw,
 * không DB) — nơi gọi tự quyết định cách báo lỗi (throw 403 ở service/repository, toast ở FE).
 */
export function checkReceptionistTransition(
  currentStatus: string,
  targetStatus: string,
  hasAssignedStaff: boolean,
  ngayGioBatDau?: string | Date | null
): ReceptionistTransitionCheck {
  if (targetStatus === currentStatus) {
    return { allowed: true };
  }

  if (targetStatus === 'dang_kham') {
    return { allowed: false, reason: 'Lễ tân không có quyền đưa trạng thái lịch về đang khám.' };
  }
  if (targetStatus === 'hoan_thanh') {
    return { allowed: false, reason: 'Lễ tân không có quyền đưa trạng thái lịch về hoàn thành.' };
  }

  if (isReceptionistLockedStatus(currentStatus)) {
    return {
      allowed: false,
      reason: 'Không thể thay đổi trạng thái của ca hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.',
    };
  }

  const allowedTargets = getReceptionistAllowedTargets(currentStatus, hasAssignedStaff);
  if (allowedTargets.includes(targetStatus)) {
    // Check-in được phép sớm tối đa 30 phút trước giờ hẹn (khách đến sớm, lễ tân chủ động check-in
    // ngay thay vì bắt chờ tới đúng giờ) — chặn check-in "hộ" 1 lịch còn quá xa trong tương lai (dữ
    // liệu test tùm lum từng lọt qua vì trước đây không đối chiếu giờ hệ thống thực tế).
    // Chỉ áp cho Lễ tân qua đúng hàm này; Admin vẫn override được như trước (không gọi qua đây).
    if (targetStatus === 'da_checkin' && ngayGioBatDau) {
      const startMs = new Date(ngayGioBatDau).getTime();
      if (startMs - Date.now() > CHECKIN_EARLY_WINDOW_MS) {
        const unlockAt = new Date(startMs - CHECKIN_EARLY_WINDOW_MS);
        return { allowed: false, reason: `Chưa tới giờ hẹn — lịch này sẽ mở khóa check-in vào lúc ${formatVnDateTime(unlockAt)}.` };
      }
    }

    // "Không đến" là kết luận SAU khi giờ hẹn đã trôi qua — không thể biết trước giờ hẹn. Chừa thêm
    // 15 phút đệm sau giờ hẹn (không chặn ngay tại giờ hẹn) vì trạng thái này khóa cứng, không sửa
    // lại được (xem isReceptionistLockedStatus) — tránh lễ tân lỡ tay chốt nhầm khách chỉ đang tới
    // trễ vài phút.
    if (targetStatus === 'khong_den' && ngayGioBatDau) {
      const unlockMs = new Date(ngayGioBatDau).getTime() + NO_SHOW_GRACE_WINDOW_MS;
      if (Date.now() < unlockMs) {
        return { allowed: false, reason: `Chưa đủ điều kiện đánh dấu không đến — lịch này sẽ mở khóa vào lúc ${formatVnDateTime(new Date(unlockMs))} (15 phút sau giờ hẹn).` };
      }
    }
    return { allowed: true };
  }

  if (UNCONFIRMED_STATUSES.includes(currentStatus) && targetStatus === 'da_checkin') {
    return { allowed: false, reason: 'Lễ tân không có quyền đưa trạng thái lịch về check-in.' };
  }

  return { allowed: false, reason: 'Lễ tân không có quyền chuyển lịch hẹn sang trạng thái này.' };
}
