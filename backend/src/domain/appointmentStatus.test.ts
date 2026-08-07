import { describe, expect, it } from 'vitest';
import { checkReceptionistTransition, getReceptionistAllowedTargets, isReceptionistLockedStatus } from './appointmentStatus';

describe('getReceptionistAllowedTargets', () => {
  it('đã xác nhận -> Check-in, Không đến, Hủy', () => {
    expect(getReceptionistAllowedTargets('da_xac_nhan', true)).toEqual(['da_checkin', 'khong_den', 'da_huy']);
  });

  it('đã check-in -> không còn target nào', () => {
    expect(getReceptionistAllowedTargets('da_checkin', true)).toEqual([]);
  });
});

describe('isReceptionistLockedStatus', () => {
  it('khóa khi đang tiến hành/chờ tái lượng giá/đã hoàn thành', () => {
    expect(isReceptionistLockedStatus('da_checkin')).toBe(true);
    expect(isReceptionistLockedStatus('dang_kham')).toBe(true);
    expect(isReceptionistLockedStatus('cho_tai_luong_gia')).toBe(true);
    expect(isReceptionistLockedStatus('hoan_thanh')).toBe(true);
  });

  it('khóa khi đã hủy/không đến (kể cả biến thể phạt)', () => {
    expect(isReceptionistLockedStatus('da_huy')).toBe(true);
    expect(isReceptionistLockedStatus('da_huy_phat')).toBe(true);
    expect(isReceptionistLockedStatus('khong_den')).toBe(true);
    expect(isReceptionistLockedStatus('khach_khong_den_phat')).toBe(true);
  });

  it('không khóa khi đã xác nhận', () => {
    expect(isReceptionistLockedStatus('da_xac_nhan')).toBe(false);
  });
});

describe('checkReceptionistTransition', () => {
  it('cho phép giữ nguyên trạng thái hiện tại (chỉ sửa ghi chú/nhân sự)', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_xac_nhan', true)).toEqual({ allowed: true });
  });

  it('đã check-in -> khóa toàn bộ, không đổi được gì kể cả hủy', () => {
    const result = checkReceptionistTransition('da_checkin', 'da_huy', true);
    expect(result.allowed).toBe(false);
  });

  it('đã hủy -> khóa toàn bộ, không đổi lại được', () => {
    const result = checkReceptionistTransition('da_huy', 'da_xac_nhan', true);
    expect(result.allowed).toBe(false);
  });

  it('không bao giờ cho lễ tân đặt trực tiếp đang khám/hoàn thành', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'dang_kham', true).allowed).toBe(false);
    expect(checkReceptionistTransition('da_xac_nhan', 'hoan_thanh', true).allowed).toBe(false);
  });

  it('đã xác nhận -> check-in hợp lệ, không còn gác cửa theo giờ hẹn (mô hình buổi)', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_checkin', true)).toEqual({ allowed: true });
  });

  it('đã xác nhận -> đánh dấu không đến hợp lệ, không còn gác cửa theo giờ hẹn (mô hình buổi)', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'khong_den', true)).toEqual({ allowed: true });
  });
});
