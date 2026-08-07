/**
 * Quy tắc chuyển trạng thái lịch hẹn (cuoc_hen) dành riêng cho Lễ tân — Admin/Bác sĩ/Quản lý
 * không bị giới hạn bởi file này. Thay thế cho các khối `if` rời rạc trước đây ở
 * `receptionist.service.ts` — nay dùng chung cho CẢ route `/receptionist/...` lẫn
 * `/admin/appointments/:id/status` khi actor là Lễ tân (xem `appointment.repository.ts`).
 *
 * A10 (06/08/2026): bỏ hẳn khái niệm "chưa xác nhận"/"chờ xác nhận" — mọi lịch vào thẳng
 * `da_xac_nhan` lúc tạo (Phase 1). Mirror 1:1 với frontend
 * `components/appointments/DetailModal/receptionistStatusRules.ts` — sửa bên nào nhớ sửa bên kia.
 */

const IN_PROGRESS_LOCKED_STATUSES = ['da_checkin', 'check_in', 'dang_kham', 'cho_tai_luong_gia', 'hoan_thanh'];
const CANCELLED_STATUSES = ['da_huy', 'da_huy_phat'];
const NO_SHOW_STATUSES = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'];
export const TERMINAL_STATUSES = [...CANCELLED_STATUSES, ...NO_SHOW_STATUSES];

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
 * `hasAssignedStaff` không còn ảnh hưởng gì (chỉ giữ tham số để không phá chữ ký hàm ở nơi gọi) —
 * mọi lịch vào thẳng `da_xac_nhan`, không còn nhánh "đã gán nhân sự hay chưa" như bản cũ.
 */
export function getReceptionistAllowedTargets(currentStatus: string, _hasAssignedStaff: boolean): string[] {
  if (currentStatus === 'da_xac_nhan') {
    return ['da_checkin', 'khong_den', 'da_huy'];
  }
  return [];
}

/**
 * Kiểm tra 1 lần chuyển trạng thái cụ thể có hợp lệ với Lễ tân không. Hàm thuần (không throw,
 * không DB) — nơi gọi tự quyết định cách báo lỗi (throw 403 ở service/repository, toast ở FE).
 *
 * Không còn nhận `ngayGioBatDau` (A10, 06/08/2026) — mốc này giờ chỉ là biên nominal của buổi
 * (7h30/12h00...), không còn là giờ hẹn thật của riêng khách đó, nên không thể dùng để tính cửa
 * sổ "check-in sớm tối đa X phút"/"không đến sau Y phút" như mô hình đặt giờ cũ (mọi lịch trong
 * cùng buổi sẽ mở/khóa y hệt nhau nếu còn tính theo mốc này — vô nghĩa). Việc tự động đánh dấu
 * "không đến" cuối buổi thuộc về B10 (quét tự động, chưa cài đặt); hàm này chỉ còn quyết định
 * *loại* chuyển trạng thái nào Lễ tân được làm, không còn gác cửa theo thời điểm.
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

  return { allowed: false, reason: 'Lễ tân không có quyền chuyển lịch hẹn sang trạng thái này.' };
}
