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
    // Kẹp trần ở packageTotal — xem giải thích ở backend/src/domain/billing.ts (bản gốc).
    return Math.min(packageTotal, (sessionNum - 1) * sessionPrice);
  }
  return 0;
}

/**
 * Số tiền CẦN THU THÊM cho buổi thứ `sessionNum` của gói trả từng buổi (tung_buoi) — PHẢI khớp
 * đúng `backend/src/domain/billing.ts:getTungBuoiSessionDue` (nguồn sự thật). Tự sửa sai số làm
 * tròn qua từng buổi, buổi CUỐI luôn đòi đúng phần còn thiếu để tổng thu khớp chính xác
 * `packageTotal`. Dùng số này để hiển thị VÀ để lễ tân thu tiền — backend ghi sổ theo cùng công
 * thức nên không được tự chế công thức khác ở đây (từng gây hóa đơn treo do lệch làm tròn).
 */
export function getTungBuoiSessionDue(
  packageTotal: number,
  totalSessions: number,
  sessionNum: number,
  alreadyPaid: number
): number {
  const sessionPrice = totalSessions > 0 ? Math.round(packageTotal / totalSessions) : packageTotal;
  const cumulativeRequired = sessionNum >= totalSessions ? packageTotal : sessionNum * sessionPrice;
  return Math.max(0, cumulativeRequired - alreadyPaid);
}

/** Trạng thái phác đồ coi như đã chấm dứt vĩnh viễn — không đặt lịch, không thu thêm tiền. */
const CANCELLED_PLAN_STATUSES = ['huy', 'da_huy'];

/**
 * Gói đã bị hủy (kèm hoàn tiền) hay chưa.
 * Nhận diện qua CẢ hai nguồn: trạng thái phác đồ và trạng thái hóa đơn — vì hóa đơn hoàn tiền
 * làm `so_tien_da_tra` tụt xuống dưới mức tối thiểu, khiến `isSessionPaymentSatisfied` hiểu nhầm
 * là "khách còn thiếu tiền" và mời thanh toán tiếp một gói đã chấm dứt.
 */
export function isPlanCancelled(plan: {
  trang_thai?: string | null;
  hoa_don_trang_thai?: string | null;
  trang_thai_hoa_don_goi?: string | null;
} | null | undefined): boolean {
  if (!plan) return false;
  if (CANCELLED_PLAN_STATUSES.includes(String(plan.trang_thai || ''))) return true;
  const invoiceStatus = String(plan.hoa_don_trang_thai || plan.trang_thai_hoa_don_goi || '');
  return invoiceStatus === 'da_hoan_tien';
}

/**
 * Khách đã đóng đủ tiền để được đặt/thực hiện buổi thứ `sessionNum` chưa.
 * `plan` là bất kỳ object nào mang thông tin hóa đơn gói (lịch hẹn, phác đồ, hóa đơn...).
 * Gói đã hủy KHÔNG bao giờ "thiếu tiền" — nó đơn giản là không còn được đặt lịch nữa
 * (dùng `isPlanCancelled` để chặn, đừng dùng hàm này).
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
    trang_thai?: string | null;
    hoa_don_trang_thai?: string | null;
    trang_thai_hoa_don_goi?: string | null;
  },
  sessionNum: number
): boolean {
  // Gói lẻ (LE) không bị chặn đặt lịch trước thanh toán — thu tiền sau khi làm xong.
  if (plan?.loai_goi === 'LE') return true;

  // Gói đã hủy/hoàn tiền: không còn khoản nào để đòi, tránh hiện nút "Thanh toán Đợt 2" ma.
  if (isPlanCancelled(plan)) return true;

  const minRequired = getMinPaymentRequired(
    plan?.hinh_thuc_thanh_toan_goi || 'tra_thang',
    Number(plan?.tong_tien_phai_tra || 0),
    Number(plan?.tong_so_buoi || 10),
    sessionNum,
    resolveGrossBeforeExamDeduction(plan)
  );
  return Number(plan?.so_tien_da_tra || 0) >= minRequired;
}

/**
 * Lịch hẹn/buổi này còn cần thu tiền hay không — chỉ xét phần TOÁN HỌC thanh toán, không xét
 * trạng thái lịch hẹn (`trang_thai`) như hoàn thành/đang khám. Nguồn logic đối chiếu với
 * `pendingPaymentAppointments` (frontend/src/features/receptionist/pages/ReceptionistAppointments/
 * index.tsx) — nếu sửa 1 trong 2 nơi, cân nhắc sửa nơi kia để tránh 2 danh sách "cần thanh toán"
 * lệch nhau.
 */
export function isPaymentDue(apt: {
  trang_thai_thanh_toan?: string | null;
  trang_thai_hoa_don_goi?: string | null;
  loai_lich?: string | null;
  loai_goi?: string | null;
  hinh_thuc_thanh_toan_goi?: string | null;
  so_thu_tu_buoi?: number | string | null;
  tong_so_buoi_goi?: number | string | null;
  so_tien_da_tra_goi?: number | string | null;
  tong_tien_phai_tra_goi?: number | string | null;
  tong_tien_goc_goi?: number | string | null;
}): boolean {
  if (apt.trang_thai_thanh_toan === 'da_thanh_toan' || apt.trang_thai_hoa_don_goi === 'da_thanh_toan') {
    return false;
  }

  const isRetailOrExam = ['kham_moi', 'KHAM', 'dich_vu_don', 'DICH_VU_LE'].includes(apt.loai_lich || '') || apt.loai_goi === 'LE';
  const hinhThuc = apt.hinh_thuc_thanh_toan_goi;

  if (isRetailOrExam) {
    if (!hinhThuc) {
      // Hóa đơn khám/dịch vụ lẻ thật sự, không có gói nào đi kèm.
      return apt.trang_thai_thanh_toan !== 'da_thanh_toan';
    }
    // Ca khám này dẫn tới đăng ký gói (chỉ định gói từ khám) — hóa đơn liên kết là hóa đơn GÓI.
    // Chỉ coi phí khám đã xong nghĩa vụ nếu THỰC SỰ được miễn đúng điều kiện isExamWaived():
    // trả thẳng/trả góp VÀ giá gói gốc >= 1.000.000đ (docs/BUSINESS_RULES.md mục 5). Nếu không đủ
    // điều kiện miễn (vd từng buổi, hoặc gói < 1tr) thì tiền khám đã gộp thẳng vào công nợ gói —
    // KHÔNG trả `false` mù quáng, mà rơi xuống tính công nợ gói như buổi điều trị bình thường, vì
    // đây có thể là cuoc_hen DUY NHẤT mang theo hóa đơn gói khi khách chưa đặt buổi điều trị nào.
    const giaGocGoi = Number(apt.tong_tien_goc_goi || 0);
    const isWaived = (hinhThuc === 'tra_thang' || hinhThuc === 'tra_gop') && giaGocGoi >= 1_000_000;
    if (isWaived) return false;
  }

  const soThuTu = Number(apt.so_thu_tu_buoi || 1);
  const tongSoBuoi = Number(apt.tong_so_buoi_goi || 10);
  const daTra = Number(apt.so_tien_da_tra_goi || 0);
  const phaiTra = Number(apt.tong_tien_phai_tra_goi || 0);

  if (hinhThuc === 'tung_buoi') {
    return getTungBuoiSessionDue(phaiTra, tongSoBuoi, soThuTu, daTra) > 0;
  }

  if (hinhThuc === 'tra_gop') {
    // Đợt 2 phải đóng XONG trước khi bắt đầu buổi thứ H (BUSINESS_RULES.md mục 3) — nên xét theo
    // buổi TIẾP THEO (so_thu_tu_buoi + 1), không phải buổi vừa xong: ngay khi vừa hoàn thành buổi
    // liền trước mốc H thì Đợt 2 đã cần đóng rồi, không đợi có buổi thứ H thật mới báo (buổi đó
    // thường còn chưa được đặt được, vì backend chặn đặt buổi H khi chưa đóng Đợt 2).
    const nextSessionNum = soThuTu + 1;
    if (nextSessionNum >= getInstallmentCutoffSession(tongSoBuoi)) {
      return daTra < phaiTra;
    }
    return daTra === 0;
  }

  if (hinhThuc === 'tra_thang' || !hinhThuc) {
    return daTra < phaiTra;
  }

  return false;
}

/**
 * Danh sách "ca cần thanh toán" hiển thị cho lễ tân (mascot ở AdminLayout.tsx, PendingPaymentPanel)
 * — khác `isPaymentDue()` ở chỗ hàm này gồm luôn điều kiện trạng thái lịch hẹn: khám/dịch vụ lẻ,
 * từng buổi, và trả góp (đợt 2) chỉ tính từ lúc đã check-in trở đi — "sau khi làm xong buổi đó"
 * (chưa điểm danh thì chưa có gì để báo, dù buổi tiếp theo có chạm mốc đóng đợt 2 hay không).
 */
export function isAwaitingPaymentForList(apt: Parameters<typeof isPaymentDue>[0] & {
  trang_thai?: string | null;
}): boolean {
  if (['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat', 'giu_cho', 'chua_xac_nhan'].includes(apt.trang_thai || '')) return false;

  const isRetailOrExam = ['kham_moi', 'KHAM', 'dich_vu_don', 'DICH_VU_LE'].includes(apt.loai_lich || '') || apt.loai_goi === 'LE';
  const isSessionStarted = ['da_checkin', 'cho_kham', 'dang_kham', 'hoan_thanh'].includes(apt.trang_thai || '');
  const isTraGop = !isRetailOrExam && apt.hinh_thuc_thanh_toan_goi === 'tra_gop';

  if ((isRetailOrExam || apt.hinh_thuc_thanh_toan_goi === 'tung_buoi' || isTraGop) && !isSessionStarted) {
    return false;
  }

  return isPaymentDue(apt);
}
