import { describe, expect, it } from 'vitest';
import {
  calculateDiscountPercent,
  calculatePackageCancellationRefund,
  describePaymentTransaction,
  getMinPaymentRequired,
  isExamWaived,
  resolveNoShowOutcome,
  resolvePackageBasePrice,
} from './billing';

describe('isExamWaived', () => {
  it('gói LIEU_TRINH 3.2 triệu, trả thẳng -> miễn phí khám', () => {
    expect(isExamWaived('tra_thang', 3_200_000)).toBe(true);
  });

  it('gói LIEU_TRINH 3.2 triệu, trả góp -> miễn phí khám', () => {
    expect(isExamWaived('tra_gop', 3_200_000)).toBe(true);
  });

  it('gói LE 300k -> không miễn phí khám dù hình thức nào', () => {
    expect(isExamWaived('tra_thang', 300_000)).toBe(false);
    expect(isExamWaived('tra_gop', 300_000)).toBe(false);
  });

  it('trả từng buổi -> không bao giờ miễn phí khám dù giá cao', () => {
    expect(isExamWaived('tung_buoi', 5_000_000)).toBe(false);
  });

  it('đúng ngưỡng 1.000.000đ vẫn được miễn (>=)', () => {
    expect(isExamWaived('tra_thang', 1_000_000)).toBe(true);
    expect(isExamWaived('tra_thang', 999_999)).toBe(false);
  });
});

describe('getMinPaymentRequired', () => {
  it('gói 10 buổi trả góp -> cutoff đúng buổi 5', () => {
    const packageTotal = 5_130_000;
    expect(getMinPaymentRequired('tra_gop', packageTotal, 10, 4)).toBe(Math.round(packageTotal / 2));
    expect(getMinPaymentRequired('tra_gop', packageTotal, 10, 5)).toBe(packageTotal);
  });

  it('gói 8 buổi trả góp -> cutoff đúng buổi 4', () => {
    const packageTotal = 4_000_000;
    expect(getMinPaymentRequired('tra_gop', packageTotal, 8, 3)).toBe(Math.round(packageTotal / 2));
    expect(getMinPaymentRequired('tra_gop', packageTotal, 8, 4)).toBe(packageTotal);
  });

  it('gói 12 buổi trả góp -> cutoff đúng buổi 5 (biên độ an toàn, sớm hơn floor(N/2)=6)', () => {
    const packageTotal = 6_000_000;
    expect(getMinPaymentRequired('tra_gop', packageTotal, 12, 4)).toBe(Math.round(packageTotal / 2));
    expect(getMinPaymentRequired('tra_gop', packageTotal, 12, 5)).toBe(packageTotal);
  });

  it('gói 15 buổi trả góp -> cutoff đúng buổi 7 (trùng floor(N/2) ở trường hợp này)', () => {
    const packageTotal = 7_500_000;
    expect(getMinPaymentRequired('tra_gop', packageTotal, 15, 6)).toBe(Math.round(packageTotal / 2));
    expect(getMinPaymentRequired('tra_gop', packageTotal, 15, 7)).toBe(packageTotal);
  });

  it('gói 16 buổi trả góp -> cutoff đúng buổi 7 (biên độ an toàn, sớm hơn floor(N/2)=8)', () => {
    const packageTotal = 8_000_000;
    expect(getMinPaymentRequired('tra_gop', packageTotal, 16, 6)).toBe(Math.round(packageTotal / 2));
    expect(getMinPaymentRequired('tra_gop', packageTotal, 16, 7)).toBe(packageTotal);
  });

  it('trả thẳng -> luôn yêu cầu 100% bất kể buổi thứ mấy', () => {
    expect(getMinPaymentRequired('tra_thang', 5_000_000, 10, 1)).toBe(5_000_000);
    expect(getMinPaymentRequired('tra_thang', 5_000_000, 10, 9)).toBe(5_000_000);
  });

  it('trả từng buổi -> lũy kế theo số buổi đã dùng', () => {
    const packageTotal = 1_000_000;
    const sessionPrice = Math.round(packageTotal / 10);
    expect(getMinPaymentRequired('tung_buoi', packageTotal, 10, 1)).toBe(0);
    expect(getMinPaymentRequired('tung_buoi', packageTotal, 10, 4)).toBe(3 * sessionPrice);
  });

  it('trả góp có khấu trừ phí khám đã đóng riêng trong Đợt 1 -> mốc Đợt 1 phải trừ đúng phần đó (không phải nửa tổng net)', () => {
    // Ca thật: gói 8 buổi, giá gốc 3.600.000đ, giảm hình thức trả góp 5% -> gross sau giảm 3.420.000đ.
    // Phí khám 150.000đ đã đóng riêng trước đó -> khấu trừ thẳng vào Đợt 1 -> tong_tien_phai_tra (net) = 3.270.000đ.
    // Đợt 1 đúng phải thu = round(3.420.000/2) - 150.000 = 1.560.000đ, KHÔNG phải round(3.270.000/2) = 1.635.000đ.
    const grossBeforeExamDeduction = 3_420_000;
    const packageTotal = 3_270_000; // tong_tien_phai_tra (net, đã trừ phí khám)
    const minRequired = getMinPaymentRequired('tra_gop', packageTotal, 8, 1, grossBeforeExamDeduction);
    expect(minRequired).toBe(1_560_000);
    expect(1_560_000).toBeGreaterThanOrEqual(minRequired); // số tiền khách đã đóng thực tế không còn bị chặn nhầm
  });

  it('không truyền grossBeforeExamDeduction -> hành vi giữ nguyên như trước (không có khấu trừ)', () => {
    const packageTotal = 4_000_000;
    expect(getMinPaymentRequired('tra_gop', packageTotal, 8, 3)).toBe(Math.round(packageTotal / 2));
  });
});

describe('calculateDiscountPercent', () => {
  it('tính động từ số tiền giảm thực tế khi có basePrice', () => {
    expect(calculateDiscountPercent(1_000_000, 100_000, 'tra_thang')).toBe(10);
    expect(calculateDiscountPercent(1_000_000, 50_000, 'tra_gop')).toBe(5);
  });

  it('fallback về hằng số mặc định khi basePrice = 0', () => {
    expect(calculateDiscountPercent(0, 0, 'tra_thang')).toBe(10);
    expect(calculateDiscountPercent(0, 0, 'tra_gop')).toBe(5);
    expect(calculateDiscountPercent(0, 0, 'tung_buoi')).toBe(0);
  });
});

describe('resolvePackageBasePrice', () => {
  it('trừ phí khám nếu chưa thanh toán khám riêng', () => {
    expect(resolvePackageBasePrice(5_130_000, 200_000, false)).toBe(4_930_000);
  });

  it('không trừ phí khám nếu đã thanh toán khám riêng', () => {
    expect(resolvePackageBasePrice(5_130_000, 200_000, true)).toBe(5_130_000);
  });
});

describe('calculatePackageCancellationRefund', () => {
  it('gói 5.130.000đ, mới đóng 2.565.000đ, phạt 10% trên giá gói đã chốt (không phải tiền đã đóng)', () => {
    const result = calculatePackageCancellationRefund({
      tongTienGoc: 5_130_000,
      soTienDaDong: 2_565_000,
      tiLeGiam: 0,
      soBuoiDung: 0,
      tongSoBuoi: 10,
      chiPhiKham: 0,
      hasExam: false,
      hasPaidSeparateExam: false,
      phiPhatPercent: 10,
    });

    expect(result.phiPhatThucTe).toBe(513_000);
    expect(result.soTienHoanTra).toBe(2_565_000 - 513_000);
  });

  it('2 khách cùng gói/hình thức, đóng khác nhau -> phạt tuyệt đối phải bằng nhau', () => {
    const daDongDu = calculatePackageCancellationRefund({
      tongTienGoc: 3_200_000,
      soTienDaDong: 2_890_000,
      tiLeGiam: 5,
      soBuoiDung: 0,
      tongSoBuoi: 8,
      chiPhiKham: 150_000,
      hasExam: true,
      hasPaidSeparateExam: true,
      phiPhatPercent: 10,
    });
    const moiDongDot1 = calculatePackageCancellationRefund({
      tongTienGoc: 3_200_000,
      soTienDaDong: 1_520_000,
      tiLeGiam: 5,
      soBuoiDung: 0,
      tongSoBuoi: 8,
      chiPhiKham: 150_000,
      hasExam: true,
      hasPaidSeparateExam: true,
      phiPhatPercent: 10,
    });

    expect(daDongDu.phiPhatThucTe).toBe(304_000);
    expect(moiDongDot1.phiPhatThucTe).toBe(304_000);
    expect(daDongDu.phiPhatThucTe).toBe(moiDongDot1.phiPhatThucTe);
  });

  it('phạt phải bằng nhau dù phí khám được xử lý khác nhau (đã đóng riêng vs miễn phí/chưa đóng)', () => {
    const daDongRieng = calculatePackageCancellationRefund({
      tongTienGoc: 3_200_000,
      soTienDaDong: 2_880_000,
      tiLeGiam: 10,
      soBuoiDung: 0,
      tongSoBuoi: 8,
      chiPhiKham: 150_000,
      hasExam: true,
      hasPaidSeparateExam: true,
      phiPhatPercent: 10,
    });
    const mienPhiChuaDong = calculatePackageCancellationRefund({
      tongTienGoc: 3_200_000,
      soTienDaDong: 2_880_000,
      tiLeGiam: 10,
      soBuoiDung: 0,
      tongSoBuoi: 8,
      chiPhiKham: 150_000,
      hasExam: true,
      hasPaidSeparateExam: false,
      phiPhatPercent: 10,
    });

    expect(daDongRieng.phiPhatThucTe).toBe(288_000);
    expect(mienPhiChuaDong.phiPhatThucTe).toBe(288_000);
    // Tiền khám chỉ khác nhau ở examFeeToCharge, không được phép làm lệch gốc tính phạt.
    expect(daDongRieng.examFeeToCharge).toBe(0);
    expect(mienPhiChuaDong.examFeeToCharge).toBe(150_000);
  });

  it('trừ đúng 1 lần phí khám nếu chưa thanh toán khám riêng', () => {
    const result = calculatePackageCancellationRefund({
      tongTienGoc: 5_000_000,
      soTienDaDong: 5_000_000,
      tiLeGiam: 0,
      soBuoiDung: 0,
      tongSoBuoi: 10,
      chiPhiKham: 200_000,
      hasExam: true,
      hasPaidSeparateExam: false,
      phiPhatPercent: 10,
    });

    expect(result.examFeeToCharge).toBe(200_000);
  });

  it('không trừ phí khám nếu đã thanh toán khám riêng (tránh trừ 2 lần)', () => {
    const result = calculatePackageCancellationRefund({
      tongTienGoc: 5_000_000,
      soTienDaDong: 5_000_000,
      tiLeGiam: 0,
      soBuoiDung: 0,
      tongSoBuoi: 10,
      chiPhiKham: 200_000,
      hasExam: true,
      hasPaidSeparateExam: true,
      phiPhatPercent: 10,
    });

    expect(result.examFeeToCharge).toBe(0);
  });
});

describe('resolveNoShowOutcome', () => {
  // --- HỦY (da_huy): luôn trừ 10đ, không phân biệt nhóm, không mất buổi ---
  it('Nhóm A (KHAM/LE, không phải gói) hủy -> trừ 10đ', () => {
    expect(resolveNoShowOutcome('da_huy', null, false)).toEqual({ finalStatus: 'da_huy', reputationPenalty: 10 });
  });

  it('Nhóm A (LIEU_TRINH trả từng buổi) hủy -> trừ 10đ', () => {
    expect(resolveNoShowOutcome('da_huy', 'tung_buoi', true)).toEqual({ finalStatus: 'da_huy', reputationPenalty: 10 });
  });

  it('Nhóm B (trả thẳng) hủy -> trừ 10đ y hệt Nhóm A (không phạt kép, không escalate)', () => {
    expect(resolveNoShowOutcome('da_huy', 'tra_thang', true)).toEqual({ finalStatus: 'da_huy', reputationPenalty: 10 });
  });

  it('Nhóm B (trả góp) hủy -> trừ 10đ', () => {
    expect(resolveNoShowOutcome('da_huy', 'tra_gop', true)).toEqual({ finalStatus: 'da_huy', reputationPenalty: 10 });
  });

  // --- KHÔNG ĐẾN (khong_den): Nhóm A trừ 20đ, Nhóm B trừ 0đ ---
  it('Nhóm A (KHAM/LE) không đến -> trừ 20đ', () => {
    expect(resolveNoShowOutcome('khong_den', null, false)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 20 });
  });

  it('Nhóm A (trả từng buổi) không đến -> trừ 20đ (không mất buổi)', () => {
    expect(resolveNoShowOutcome('khong_den', 'tung_buoi', true)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 20 });
  });

  it('Nhóm B (trả thẳng) không đến -> KHÔNG trừ điểm (đã mất buổi/tiền, tránh phạt kép)', () => {
    expect(resolveNoShowOutcome('khong_den', 'tra_thang', true)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 0 });
  });

  it('Nhóm B (trả góp) không đến -> KHÔNG trừ điểm', () => {
    expect(resolveNoShowOutcome('khong_den', 'tra_gop', true)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 0 });
  });

  it('alias khach_khong_den xử lý y hệt khong_den, chuẩn hóa output về "khong_den"', () => {
    expect(resolveNoShowOutcome('khach_khong_den', 'tra_gop', true)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 0 });
    expect(resolveNoShowOutcome('khach_khong_den', 'tung_buoi', true)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 20 });
  });

  it('isPackageSession=true nhưng hinhThuc=null (chưa tìm thấy hóa đơn) -> fallback về Nhóm A (an toàn, không miễn phạt nhầm)', () => {
    expect(resolveNoShowOutcome('khong_den', null, true)).toEqual({ finalStatus: 'khong_den', reputationPenalty: 20 });
    expect(resolveNoShowOutcome('da_huy', null, true)).toEqual({ finalStatus: 'da_huy', reputationPenalty: 10 });
  });
});

describe('describePaymentTransaction', () => {
  it('KHAM/LE trả trực tiếp -> không gọi là "trọn gói"', () => {
    const result = describePaymentTransaction({ loaiHoaDon: 'KHAM', hinhThuc: null, dot: 'tron_goi' });
    expect(result.dien_giai).toBe('Thanh toán trực tiếp');
    expect(result.ty_le_phan_tram).toBe(100);
  });

  it('LIEU_TRINH trả thẳng -> "trọn gói 100%"', () => {
    const result = describePaymentTransaction({ loaiHoaDon: 'LIEU_TRINH', hinhThuc: 'tra_thang', dot: 'tron_goi' });
    expect(result.dien_giai).toBe('Thanh toán trọn gói 100%');
  });

  it('LIEU_TRINH trả góp nhưng đóng đủ 1 lần -> nhãn không mâu thuẫn với badge "Trả góp"', () => {
    const result = describePaymentTransaction({ loaiHoaDon: 'LIEU_TRINH', hinhThuc: 'tra_gop', dot: 'tron_goi' });
    expect(result.dien_giai).not.toBe('Thanh toán trọn gói 100%');
    expect(result.dien_giai).toContain('trả góp');
    expect(result.ty_le_phan_tram).toBe(100);
  });

  it('trả góp đợt 1 và đợt 2 -> đúng nhãn, không phụ thuộc vị trí mảng', () => {
    const dot1 = describePaymentTransaction({ loaiHoaDon: 'LIEU_TRINH', hinhThuc: 'tra_gop', dot: 'dot_1' });
    const dot2 = describePaymentTransaction({ loaiHoaDon: 'LIEU_TRINH', hinhThuc: 'tra_gop', dot: 'dot_2' });
    expect(dot1.dien_giai).toContain('Đợt 1');
    expect(dot2.dien_giai).toContain('Đợt 2');
    expect(dot1.ty_le_phan_tram).toBe(50);
    expect(dot2.ty_le_phan_tram).toBe(50);
  });

  it('trả từng buổi -> ghi đúng số thứ tự buổi và % theo tổng số buổi', () => {
    const result = describePaymentTransaction({
      loaiHoaDon: 'LIEU_TRINH',
      hinhThuc: 'tung_buoi',
      dot: 'buoi_le',
      soBuoiThuTu: 3,
      tongSoBuoi: 10,
    });
    expect(result.dien_giai).toBe('Thanh toán cho buổi trị liệu số 3');
    expect(result.ty_le_phan_tram).toBe(10);
    expect(result.so_buoi_thu_tu).toBe(3);
  });
});
