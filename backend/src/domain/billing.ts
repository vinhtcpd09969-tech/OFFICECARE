import { HinhThucThanhToanGoi, LoaiGoi, NoShowAction, PaymentInstallment } from './types';

/** Ngưỡng giá gói (đồng) để được miễn phí khám lâm sàng khi trả_thẳng/trả_góp. */
export const EXAM_WAIVER_THRESHOLD = 1_000_000;

/** Số ngày kể từ ngày khám mà một chỉ định gói (chi_dinh_buoi) còn được phép kích hoạt/thanh toán. */
export const PACKAGE_ACTIVATION_WINDOW_DAYS = 14;

/** % giảm giá mặc định theo hình thức thanh toán, dùng khi chưa có số tiền giảm thực tế để tính động. */
export const DEFAULT_DISCOUNT_PERCENT: Record<'tra_thang' | 'tra_gop', number> = {
  tra_thang: 10,
  tra_gop: 5,
};

/** % đặt cọc Đợt 1 bắt buộc khi trả góp. */
export const TRA_GOP_DEPOSIT_PERCENT = 50;

/**
 * % phạt mặc định khi hủy gói giữa chừng — dùng làm biên an toàn khi tính buổi phải đóng Đợt 2,
 * để cọc còn lại luôn đủ trang trải phạt (không phụ thuộc `phiPhatPercent` thực tế lúc hủy, vốn
 * do người dùng nhập tại `calculatePackageCancellationRefund`).
 */
export const DEFAULT_CANCELLATION_PENALTY_PERCENT = 10;

/**
 * Giá gốc của gói (không bao gồm phí khám) dùng làm cơ sở tính chiết khấu/hoàn tiền.
 * Thay thế cho `admin.repository.ts:1147`.
 */
export function resolvePackageBasePrice(
  tongTienGoc: number,
  chiPhiKham: number,
  hasPaidSeparateExam: boolean
): number {
  return hasPaidSeparateExam ? tongTienGoc : tongTienGoc - chiPhiKham;
}

/**
 * Khách có được miễn phí khám lâm sàng khi trả_thẳng/trả_góp không.
 * Thay thế cho `admin.repository.ts:1150` và `receptionist.service.ts:358,603,688`.
 * Quy tắc: chỉ theo ngưỡng giá gói, không quan tâm loại gói.
 */
export function isExamWaived(hinhThuc: HinhThucThanhToanGoi, giaGocGoi: number): boolean {
  return giaGocGoi >= EXAM_WAIVER_THRESHOLD && (hinhThuc === 'tra_thang' || hinhThuc === 'tra_gop');
}

/**
 * Số tiền tối thiểu phải trả trước khi đặt/thực hiện buổi thứ `sessionNum`.
 * Thay thế cho `appointment.repository.ts:1615-1637` (bản đúng) và 2 bản "cứng 50%" sai
 * ở `appointment.repository.ts:374-389` và `receptionist.controller.ts:306-317`.
 *
 * `grossBeforeExamDeduction` (tùy chọn) = giá gói sau giảm hình thức/voucher nhưng TRƯỚC khi trừ
 * phí khám đã đóng riêng (= tong_tien_goc - so_tien_giam_phuong_thuc - so_tien_giam_voucher).
 * Khi bỏ qua, mặc định bằng `packageTotal` (coi như không có khấu trừ khám — giữ đúng hành vi cũ).
 * Cần tham số này vì Đợt 1 của trả góp bị trừ thẳng phí khám đã đóng riêng
 * (xem `receptionist.service.ts:calculateBilling`, `so_tien_dot_1 = packageDot1 - giam_tru_kham_truoc_do`),
 * trong khi `packageTotal` (= hoa_don.tong_tien_phai_tra) đã là số NET sau khấu trừ đó — nếu lấy
 * thẳng packageTotal/2 làm mốc Đợt 1 sẽ đòi hỏi nhiều hơn số tiền Đợt 1 thực tế đã thu đúng.
 */
export function getMinPaymentRequired(
  hinhThuc: HinhThucThanhToanGoi,
  packageTotal: number,
  totalSessions: number,
  sessionNum: number,
  grossBeforeExamDeduction: number = packageTotal
): number {
  if (hinhThuc === 'tra_thang') {
    return packageTotal;
  }
  if (hinhThuc === 'tra_gop') {
    // Buổi bắt đầu bắt đóng Đợt 2 được tính theo biên độ an toàn: cọc 50% phải luôn còn dư ít
    // nhất bằng % phạt hủy gói sau khi trừ chi phí các buổi đã làm trên cọc — không phụ thuộc
    // cố định vào một nửa tổng số buổi (gói càng nhiều buổi thì buổi bắt đóng càng phải sớm hơn).
    const cutoff = Math.floor(
      (totalSessions * (TRA_GOP_DEPOSIT_PERCENT - DEFAULT_CANCELLATION_PENALTY_PERCENT)) / 100
    ) + 1;
    if (sessionNum >= cutoff) {
      return packageTotal;
    }
    const examDeductionInDot1 = Math.max(0, grossBeforeExamDeduction - packageTotal);
    return Math.max(0, Math.round(grossBeforeExamDeduction / 2) - examDeductionInDot1);
  }
  if (hinhThuc === 'tung_buoi') {
    const sessionPrice = Math.round(packageTotal / totalSessions);
    // Kẹp trần ở packageTotal: khi packageTotal không chia hết cho totalSessions và làm tròn LÊN,
    // totalSessions*sessionPrice có thể vượt packageTotal — nếu không kẹp, ngưỡng "đã trả đủ buổi
    // cuối" sẽ cao hơn số tiền thật khách cần đóng (100% = packageTotal), khiến badge "đã thanh
    // toán" không bao giờ lên dù hóa đơn đã đúng trạng thái da_thanh_toan.
    return Math.min(packageTotal, (sessionNum - 1) * sessionPrice);
  }
  return 0;
}

/**
 * Số tiền CẦN THU THÊM cho buổi thứ `sessionNum` của gói trả từng buổi (tung_buoi), tính từ số
 * đã đóng thực tế thay vì áp thẳng đơn giá/buổi tĩnh — tự sửa sai số làm tròn qua từng buổi, buổi
 * CUỐI luôn đòi đúng phần còn thiếu để tổng thu khớp chính xác `packageTotal`, không dư không thiếu.
 * Nguồn duy nhất cho cả hiển thị (frontend) lẫn ghi sổ thanh toán (backend) — 2 nơi PHẢI dùng chung
 * hàm này, nếu không sẽ lệch số tiền yêu cầu giữa 2 phía (xem lịch sử: 2 công thức tách rời từng
 * gây hóa đơn treo vĩnh viễn ở vài đồng do làm tròn khác nhau).
 * `packageTotal` = hoa_don.tong_tien_thanh_toan (đã net hóa giảm giá/voucher).
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

/**
 * % giảm giá hóa đơn: tính động từ số tiền giảm thực tế, fallback về hằng số mặc định
 * nếu chưa xác định được giá gốc. Thay thế cho `receptionist.repository.ts:680-689,892-901`.
 * TODO Phase 2: đọc fallback từ bảng cấu hình ưu đãi (`admin.schema.ts` paymentPromotionSchema)
 * thay vì hard-code DEFAULT_DISCOUNT_PERCENT.
 */
export function calculateDiscountPercent(
  basePrice: number,
  totalDiscountAmount: number,
  hinhThuc: HinhThucThanhToanGoi
): number {
  if (basePrice > 0) {
    return Math.round((totalDiscountAmount * 100) / basePrice);
  }
  if (hinhThuc === 'tra_thang') return DEFAULT_DISCOUNT_PERCENT.tra_thang;
  if (hinhThuc === 'tra_gop') return DEFAULT_DISCOUNT_PERCENT.tra_gop;
  return 0;
}

export interface PackageCancellationRefundInput {
  tongTienGoc: number;
  soTienDaDong: number;
  tiLeGiam: number;
  soBuoiDung: number;
  tongSoBuoi: number;
  chiPhiKham: number;
  hasExam: boolean;
  hasPaidSeparateExam: boolean;
  phiPhatPercent: number;
}

export interface PackageCancellationRefundResult {
  giaGocGoi: number;
  giaThanhToanGoi: number;
  chiPhiBuoiDung: number;
  phiPhatThucTe: number;
  examFeeToCharge: number;
  soTienHoanTra: number;
  keptRevenuePackage: number;
}

/**
 * Tính toán hoàn tiền khi hủy gói giữa chừng.
 * Thay thế cho `admin.repository.ts:1146-1190` (`handlePackageRefund`).
 * Phí phạt tính trên `giaThanhToanGoi` (giá gói đã chốt theo hình thức thanh toán) —
 * cố định theo hợp đồng, KHÔNG đổi theo `soTienDaDong` (tiến độ thanh toán thực tế) và
 * KHÔNG đổi theo cách xử lý phí khám (`hasPaidSeparateExam`). Hai khách cùng gói/hình
 * thức phải chịu cùng 1 mức phạt tuyệt đối — bất kể một người mới đóng đợt 1 hay đã
 * đóng đủ, và bất kể phí khám của họ được xử lý theo cách nào. Phí khám luôn là một
 * khoản tách biệt hoàn toàn, xử lý riêng qua `examFeeToCharge`, không được phép làm
 * lệch gốc tính phạt.
 */
export function calculatePackageCancellationRefund(
  input: PackageCancellationRefundInput
): PackageCancellationRefundResult {
  const {
    tongTienGoc,
    soTienDaDong,
    tiLeGiam,
    soBuoiDung,
    tongSoBuoi,
    chiPhiKham,
    hasExam,
    hasPaidSeparateExam,
    phiPhatPercent,
  } = input;

  const giaGocGoi = tongTienGoc;
  const giamGiaGoi = Math.round((giaGocGoi * tiLeGiam) / 100);
  const giaThanhToanGoi = giaGocGoi - giamGiaGoi;

  const chiPhiBuoiDung = Math.round((giaThanhToanGoi * soBuoiDung) / tongSoBuoi);
  const phiPhatThucTe = Math.round((giaThanhToanGoi * phiPhatPercent) / 100);

  const examFeeToCharge = hasExam && !hasPaidSeparateExam ? chiPhiKham : 0;

  const tongKhauTru = examFeeToCharge + chiPhiBuoiDung + phiPhatThucTe;
  const soTienHoanTra = Math.max(0, soTienDaDong - tongKhauTru);
  const keptRevenuePackage = soTienDaDong - soTienHoanTra - examFeeToCharge;

  return {
    giaGocGoi,
    giaThanhToanGoi,
    chiPhiBuoiDung,
    phiPhatThucTe,
    examFeeToCharge,
    soTienHoanTra,
    keptRevenuePackage,
  };
}

export interface NoShowOutcome {
  finalStatus: string;
  reputationPenalty: number;
}

/**
 * Quyết định trạng thái cuối cùng và số điểm uy tín bị phạt khi khách hủy/không đến.
 * Quy tắc:
 * - Gói trả thẳng/trả góp: vi phạm lần đầu được ân xá (phạt = 0). Từ lần thứ 2 phạt 10đ (hủy) hoặc 20đ (không đến).
 * - Các gói khác/buổi lẻ: không có ân xá, phạt 10đ (hủy) hoặc 20đ (không đến) ngay từ đầu.
 */
export function resolveNoShowOutcome(
  action: NoShowAction,
  hinhThuc: HinhThucThanhToanGoi | null,
  previousMisses: number,
  isPackageSession: boolean
): NoShowOutcome {
  const isCancelAction = action === 'da_huy';

  if (isPackageSession && (hinhThuc === 'tra_thang' || hinhThuc === 'tra_gop')) {
    if (previousMisses > 0) {
      return {
        finalStatus: isCancelAction ? 'da_huy_phat' : 'khach_khong_den_phat',
        reputationPenalty: isCancelAction ? 10 : 20,
      };
    }
    return {
      finalStatus: isCancelAction ? 'da_huy' : 'khong_den',
      reputationPenalty: 0,
    };
  }

  return {
    finalStatus: isCancelAction ? 'da_huy' : 'khong_den',
    reputationPenalty: isCancelAction ? 10 : 20,
  };
}

export interface PaymentTransactionDetail {
  v: 1;
  loai_hoa_don: LoaiGoi | null;
  hinh_thuc_thanh_toan_goi: HinhThucThanhToanGoi | null;
  dot: PaymentInstallment;
  so_buoi_thu_tu: number | null;
  ty_le_phan_tram: number;
  dien_giai: string;
}

/**
 * Mô tả có cấu trúc cho 1 giao dịch THANH_TOAN, ghi tại thời điểm phát sinh giao dịch
 * (biết chính xác đang là đợt/buổi nào lúc đó). Thay thế khối đoán theo vị trí mảng
 * ở `InvoiceDetailModal.tsx:462-481` (frontend).
 */
export function describePaymentTransaction(input: {
  loaiHoaDon: LoaiGoi | null;
  hinhThuc: HinhThucThanhToanGoi | null;
  dot: PaymentInstallment;
  soBuoiThuTu?: number | null;
  tongSoBuoi?: number | null;
}): PaymentTransactionDetail {
  const { loaiHoaDon, hinhThuc, dot, soBuoiThuTu = null, tongSoBuoi = null } = input;

  let dienGiai: string;
  let tyLePhanTram: number;

  switch (dot) {
    case 'dot_1':
      dienGiai = 'Đóng tiền Đợt 1 (Tạm ứng 50% gói)';
      tyLePhanTram = 50;
      break;
    case 'dot_2':
      dienGiai = 'Thanh toán Đợt 2 (Hoàn tất 50% còn lại)';
      tyLePhanTram = 50;
      break;
    case 'buoi_le':
      dienGiai = soBuoiThuTu ? `Thanh toán cho buổi trị liệu số ${soBuoiThuTu}` : 'Thanh toán cho 1 buổi trị liệu';
      tyLePhanTram = tongSoBuoi ? Math.round(100 / tongSoBuoi) : 0;
      break;
    case 'phi_kham':
      dienGiai = 'Thanh toán phí khám lâm sàng liên kết';
      tyLePhanTram = 0;
      break;
    case 'con_lai':
      dienGiai = 'Thanh toán nốt số tiền còn lại';
      tyLePhanTram = 0;
      break;
    case 'tron_goi':
    default:
      if (loaiHoaDon === 'LIEU_TRINH' && hinhThuc === 'tra_gop') {
        dienGiai = 'Đóng đủ 100% ngay từ đầu (đăng ký trả góp nhưng thanh toán một lần)';
      } else {
        dienGiai = loaiHoaDon === 'LIEU_TRINH' ? 'Thanh toán trọn gói 100%' : 'Thanh toán trực tiếp';
      }
      tyLePhanTram = 100;
      break;
  }

  return {
    v: 1,
    loai_hoa_don: loaiHoaDon,
    hinh_thuc_thanh_toan_goi: hinhThuc,
    dot,
    so_buoi_thu_tu: soBuoiThuTu,
    ty_le_phan_tram: tyLePhanTram,
    dien_giai: dienGiai,
  };
}
