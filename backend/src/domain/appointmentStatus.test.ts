import { describe, expect, it } from 'vitest';
import { checkReceptionistTransition, getReceptionistAllowedTargets, isReceptionistLockedStatus } from './appointmentStatus';

describe('getReceptionistAllowedTargets', () => {
  it('chưa xác nhận, chưa có nhân sự -> chỉ Chờ gán nhân sự hoặc Hủy', () => {
    expect(getReceptionistAllowedTargets('chua_xac_nhan', false)).toEqual(['cho_xac_nhan', 'da_huy']);
  });

  it('chờ gán nhân sự, đã có nhân sự -> chỉ Đã xác nhận hoặc Hủy', () => {
    expect(getReceptionistAllowedTargets('cho_xac_nhan', true)).toEqual(['da_xac_nhan', 'da_huy']);
  });

  it('đã xác nhận -> Check-in, Không đến, Hủy', () => {
    expect(getReceptionistAllowedTargets('da_xac_nhan', true)).toEqual(['da_checkin', 'khong_den', 'da_huy']);
  });

  it('đã check-in -> không còn target nào', () => {
    expect(getReceptionistAllowedTargets('da_checkin', true)).toEqual([]);
  });
});

describe('isReceptionistLockedStatus', () => {
  it('khóa khi đang tiến hành/đã hoàn thành', () => {
    expect(isReceptionistLockedStatus('da_checkin')).toBe(true);
    expect(isReceptionistLockedStatus('dang_kham')).toBe(true);
    expect(isReceptionistLockedStatus('hoan_thanh')).toBe(true);
  });

  it('khóa khi đã hủy/không đến (kể cả biến thể phạt)', () => {
    expect(isReceptionistLockedStatus('da_huy')).toBe(true);
    expect(isReceptionistLockedStatus('da_huy_phat')).toBe(true);
    expect(isReceptionistLockedStatus('khong_den')).toBe(true);
    expect(isReceptionistLockedStatus('khach_khong_den_phat')).toBe(true);
  });

  it('không khóa khi chưa xác nhận/đã xác nhận', () => {
    expect(isReceptionistLockedStatus('chua_xac_nhan')).toBe(false);
    expect(isReceptionistLockedStatus('cho_xac_nhan')).toBe(false);
    expect(isReceptionistLockedStatus('da_xac_nhan')).toBe(false);
  });
});

describe('checkReceptionistTransition', () => {
  it('cho phép giữ nguyên trạng thái hiện tại (chỉ sửa ghi chú/nhân sự)', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_xac_nhan', true)).toEqual({ allowed: true });
  });

  it('chưa có nhân sự -> không được xác nhận hoàn tất thẳng (da_xac_nhan)', () => {
    const result = checkReceptionistTransition('chua_xac_nhan', 'da_xac_nhan', false);
    expect(result.allowed).toBe(false);
  });

  it('đã có nhân sự -> không được lùi về chờ gán nhân sự', () => {
    const result = checkReceptionistTransition('chua_xac_nhan', 'cho_xac_nhan', true);
    expect(result.allowed).toBe(false);
  });

  it('đã xác nhận -> không được quay lại chưa xác nhận', () => {
    const result = checkReceptionistTransition('da_xac_nhan', 'chua_xac_nhan', true);
    expect(result.allowed).toBe(false);
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

  it('đã xác nhận -> check-in hợp lệ', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_checkin', true)).toEqual({ allowed: true });
  });

  it('lịch hẹn ở tương lai -> không cho check-in trước giờ hẹn', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = checkReceptionistTransition('da_xac_nhan', 'da_checkin', true, future);
    expect(result.allowed).toBe(false);
  });

  it('đã tới/qua giờ hẹn -> check-in hợp lệ', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(checkReceptionistTransition('da_xac_nhan', 'da_checkin', true, past)).toEqual({ allowed: true });
  });

  it('không truyền ngay_gio_bat_dau -> vẫn cho check-in như hành vi cũ (không phá vỡ caller cũ)', () => {
    expect(checkReceptionistTransition('da_xac_nhan', 'da_checkin', true)).toEqual({ allowed: true });
  });
});
