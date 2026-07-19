/**
 * Quy tắc chuyển trạng thái lịch hẹn dành riêng cho Lễ tân trên UI — mirror 1:1 với
 * `backend/src/domain/appointmentStatus.ts` (2 phía không dùng chung runtime nên phải trùng
 * lặp thủ công; sửa bên nào nhớ sửa bên kia).
 */
import { UNCONFIRMED_STATUSES, CHECKED_IN_STATUSES, CANCELLED_STATUSES, NO_SHOW_STATUSES } from '../../../../../utils/appointmentKpi';

const IN_PROGRESS_LOCKED_STATUSES = [...CHECKED_IN_STATUSES, 'dang_kham', 'hoan_thanh'];
const TERMINAL_STATUSES = [...CANCELLED_STATUSES, ...NO_SHOW_STATUSES];

export interface ReceptionistStatusOption {
  value: string;
  label: string;
}

/** Nhân sự đã được gán cho lịch hẹn chưa (khách tự chọn lúc đặt online, hoặc Quản lý gán tay).
 * Dùng chung giữa dropdown trạng thái (file này) và `StaffRoomAllocation.tsx` để không lệch nhau. */
export function hasAssignedStaff(apt: { bac_si_id?: unknown; chuyen_gia_id?: unknown } | null | undefined): boolean {
  return !!apt?.bac_si_id || !!apt?.chuyen_gia_id;
}

/**
 * Trạng thái mà Lễ tân không còn thao tác gì được nữa (khóa toàn bộ form: dropdown, ghi chú
 * nội bộ, nhân sự/phòng, nút Lưu cập nhật) — chỉ còn xem, hoặc (khi `hoan_thanh`) đi tới luồng
 * thanh toán riêng (không đổi, xem `DetailFooter.tsx`).
 */
export function isReceptionistLockedStatus(currentStatus: string): boolean {
  return IN_PROGRESS_LOCKED_STATUSES.includes(currentStatus) || TERMINAL_STATUSES.includes(currentStatus);
}

/**
 * Danh sách hành động Lễ tân được chọn từ `currentStatus` hiện tại, kèm nhãn hiển thị.
 * Giai đoạn "chưa xác nhận" luôn chỉ có 2 lựa chọn Xác nhận/Hủy — nút "Xác nhận" trỏ tới giá trị
 * khác nhau tùy nhân sự đã gán hay chưa (đã gán -> da_xac_nhan; chưa -> cho_xac_nhan, tức "lễ
 * tân đã xác nhận phần của mình, đẩy bóng qua Quản lý phân bổ nhân sự").
 */
export function getReceptionistActionOptions(
  currentStatus: string,
  hasAssignedStaff: boolean
): ReceptionistStatusOption[] {
  if (UNCONFIRMED_STATUSES.includes(currentStatus)) {
    const options: ReceptionistStatusOption[] = [];
    const confirmTarget = hasAssignedStaff ? 'da_xac_nhan' : 'cho_xac_nhan';
    // Nếu lịch đã ở đúng trạng thái confirmTarget rồi (vd: đã ở cho_xac_nhan, vẫn chưa gán bác sĩ)
    // thì "Xác nhận" là hành động rỗng — không đổi gì, chỉ gây hiểu lầm là bấm xong có tác dụng.
    // Phải gán nhân sự/phòng thật (form riêng bên dưới) mới có gì để chuyển tiếp.
    if (confirmTarget !== currentStatus) {
      options.push({ value: confirmTarget, label: 'Xác nhận' });
    }
    options.push({ value: 'da_huy', label: 'Hủy' });
    return options;
  }
  if (currentStatus === 'da_xac_nhan') {
    return [
      { value: 'da_checkin', label: 'Check-in' },
      { value: 'khong_den', label: 'Không đến' },
      { value: 'da_huy', label: 'Hủy' },
    ];
  }
  return [];
}

/** Chỉ các giá trị target (không kèm nhãn) — dùng để validate `handleSubmit`. */
export function getReceptionistAllowedTargets(currentStatus: string, hasAssignedStaff: boolean): string[] {
  return getReceptionistActionOptions(currentStatus, hasAssignedStaff).map((opt) => opt.value);
}
