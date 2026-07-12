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
 */
export function getMinPaymentRequired(
  hinhThuc: HinhThucThanhToanGoi,
  packageTotal: number,
  totalSessions: number,
  sessionNum: number
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
    return Math.round(packageTotal / 2);
  }
  if (hinhThuc === 'tung_buoi') {
    const sessionPrice = Math.round(packageTotal / totalSessions);
    return (sessionNum - 1) * sessionPrice;
  }
  return 0;
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
  shouldDeductReputation: boolean;
}

/**
 * Quyết định trạng thái cuối cùng + có trừ điểm uy tín không khi khách hủy/không đến.
 * Thay thế cho `receptionist.repository.ts:106-155`, `appointment.repository.ts` (2 bản
 * gần như giống hệt của `updateAppointmentStatus` và hàm hủy lịch khác).
 * Quy tắc: gói trả_thẳng/trả_góp được ân xá lần vi phạm đầu (không trừ điểm); từ lần 2
 * chuyển trạng thái "_phat". Gói trả_từng_buổi hoặc không thuộc gói luôn trừ 10 điểm uy tín.
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
        shouldDeductReputation: false,
      };
    }
    return {
      finalStatus: isCancelAction ? 'da_huy' : 'khong_den',
      shouldDeductReputation: false,
    };
  }

  return {
    finalStatus: isCancelAction ? 'da_huy' : 'khong_den',
    shouldDeductReputation: true,
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
