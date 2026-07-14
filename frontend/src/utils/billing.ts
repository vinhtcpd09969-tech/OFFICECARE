/**
 * Bản sao phía frontend của các quy tắc thanh toán gói — PHẢI khớp đúng
 * `backend/src/domain/billing.ts` (nguồn sự thật) và `docs/BUSINESS_RULES.md` mục 3.
 * Chỉ dùng để hiển thị/khóa nút trên UI; backend vẫn luôn kiểm tra lại khi tạo lịch hẹn.
 */

export const TRA_GOP_DEPOSIT_PERCENT = 50;
export const DEFAULT_CANCELLATION_PENALTY_PERCENT = 10;

/**
 * Buổi đầu tiên BẮT BUỘC phải đóng xong Đợt 2 mới được đặt/thực hiện (gói trả góp).
 * Biên độ an toàn: cọc 50% phải còn dư ít nhất bằng mức phạt hủy gói (10%) sau khi
 * trừ tiền công các buổi đã làm — nên không phải floor(N/2).
 * Gói 8 buổi -> 4. Gói 10 -> 5. Gói 12 -> 5. Gói 16 -> 7.
 */
export function getInstallmentCutoffSession(totalSessions: number): number {
  return (
    Math.floor(
      (Number(totalSessions || 0) * (TRA_GOP_DEPOSIT_PERCENT - DEFAULT_CANCELLATION_PENALTY_PERCENT)) / 100
    ) + 1
  );
}

/**
 * Giá gói sau giảm hình thức/voucher nhưng TRƯỚC khi trừ phí khám đã đóng riêng.
 * Cần cho `getMinPaymentRequired` vì phí khám đã đóng riêng được khấu trừ thẳng vào Đợt 1.
 */
export function resolveGrossBeforeExamDeduction(invoiceLike: {
  tong_tien_goc?: number | string | null;
  ti_le_giam_gia_goi?: number | string | null;
  so_tien_giam_voucher?: number | string | null;
}): number {
  const goc = Number(invoiceLike?.tong_tien_goc || 0);
  const giamHinhThuc = Math.round((goc * Number(invoiceLike?.ti_le_giam_gia_goi || 0)) / 100);
  const giamVoucher = Number(invoiceLike?.so_tien_giam_voucher || 0);
  return goc - giamHinhThuc - giamVoucher;
}

/**
 * Số tiền tối thiểu khách phải đóng trước khi đặt/thực hiện buổi thứ `sessionNum`.
 * `grossBeforeExamDeduction` bỏ trống -> coi như không có khấu trừ phí khám.
 */
export function getMinPaymentRequired(
  hinhThuc: string,
  packageTotal: number,
  totalSessions: number,
  sessionNum: number,
  grossBeforeExamDeduction: number = packageTotal
): number {
  if (hinhThuc === 'tra_thang') {
    return packageTotal;
  }
  if (hinhThuc === 'tra_gop') {
    if (sessionNum >= getInstallmentCutoffSession(totalSessions)) {
      return packageTotal;
    }
    const examDeductionInDot1 = Math.max(0, grossBeforeExamDeduction - packageTotal);
    return Math.max(0, Math.round(grossBeforeExamDeduction / 2) - examDeductionInDot1);
  }
  if (hinhThuc === 'tung_buoi') {
    const sessionPrice = Math.round(packageTotal / totalSessions);
    return (sessionNum - 1) * sessionPrice;
  }
  return 0;
}

/**
 * Khách đã đóng đủ tiền để được đặt/thực hiện buổi thứ `sessionNum` chưa.
 * `plan` là bất kỳ object nào mang thông tin hóa đơn gói (lịch hẹn, phác đồ, hóa đơn...).
 */
export function isSessionPaymentSatisfied(
  plan: {
    loai_goi?: string | null;
    hinh_thuc_thanh_toan_goi?: string | null;
    tong_tien_phai_tra?: number | string | null;
    so_tien_da_tra?: number | string | null;
    tong_so_buoi?: number | string | null;
    tong_tien_goc?: number | string | null;
    ti_le_giam_gia_goi?: number | string | null;
    so_tien_giam_voucher?: number | string | null;
  },
  sessionNum: number
): boolean {
  // Gói lẻ (LE) không bị chặn đặt lịch trước thanh toán — thu tiền sau khi làm xong.
  if (plan?.loai_goi === 'LE') return true;

  const minRequired = getMinPaymentRequired(
    plan?.hinh_thuc_thanh_toan_goi || 'tra_thang',
    Number(plan?.tong_tien_phai_tra || 0),
    Number(plan?.tong_so_buoi || 10),
    sessionNum,
    resolveGrossBeforeExamDeduction(plan)
  );
  return Number(plan?.so_tien_da_tra || 0) >= minRequired;
}
