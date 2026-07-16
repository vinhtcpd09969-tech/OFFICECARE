/**
 * Quy tắc chuyển trạng thái lịch hẹn (cuoc_hen) dành riêng cho Lễ tân — Admin/Bác sĩ/Quản lý
 * không bị giới hạn bởi file này. Thay thế cho các khối `if` rời rạc trước đây ở
 * `receptionist.service.ts` — nay dùng chung cho CẢ route `/receptionist/...` lẫn
 * `/admin/appointments/:id/status` khi actor là Lễ tân (xem `appointment.repository.ts`).
 */

const UNCONFIRMED_STATUSES = ['chua_xac_nhan', 'cho_xac_nhan'];
const IN_PROGRESS_LOCKED_STATUSES = ['da_checkin', 'check_in', 'dang_kham', 'hoan_thanh'];
const CANCELLED_STATUSES = ['da_huy', 'da_huy_phat'];
const NO_SHOW_STATUSES = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'];
const TERMINAL_STATUSES = [...CANCELLED_STATUSES, ...NO_SHOW_STATUSES];

export interface ReceptionistTransitionCheck {
  allowed: boolean;
  reason?: string;
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
  hasAssignedStaff: boolean
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
    return { allowed: true };
  }

  if (UNCONFIRMED_STATUSES.includes(currentStatus) && targetStatus === 'da_checkin') {
    return { allowed: false, reason: 'Lễ tân không có quyền đưa trạng thái lịch về check-in.' };
  }

  return { allowed: false, reason: 'Lễ tân không có quyền chuyển lịch hẹn sang trạng thái này.' };
}
