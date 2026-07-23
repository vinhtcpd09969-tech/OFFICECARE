import { Pool, PoolClient } from 'pg';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { getMinPaymentRequired, resolveNoShowOutcome, PACKAGE_ACTIVATION_WINDOW_DAYS } from '../domain/billing';
import { checkReceptionistTransition, isReceptionistLockedStatus } from '../domain/appointmentStatus';
import { HinhThucThanhToanGoi, NoShowAction } from '../domain/types';

/**
 * Chặn check-in buổi tới ngưỡng của gói trả góp khi chưa đóng đủ Đợt 2. Dùng chung cho cả
 * route `/receptionist/appointments/:id/status` (`receptionist.service.ts` import từ đây) lẫn
 * `/admin/appointments/:id/status` (khi actor là Lễ tân, ngay bên dưới trong file này), để không
 * route nào bỏ lọt gate tài chính này. Throw Error `.statusCode = 400` nếu chưa đủ điều kiện,
 * không làm gì nếu không áp dụng (không phải buổi trị liệu trả góp).
 */
export async function assertTraGopDot2PaidBeforeCheckin(db: Pool | PoolClient, cuocHenId: string): Promise<void> {
  const apptRes = await db.query(
    'SELECT phac_do_dieu_tri_id, so_thu_tu_buoi, loai FROM cuoc_hen WHERE id = $1',
    [cuocHenId]
  );
  if (apptRes.rows.length === 0) return;
  const { phac_do_dieu_tri_id, so_thu_tu_buoi, loai } = apptRes.rows[0];
  if (!(loai === 'DIEU_TRI' && phac_do_dieu_tri_id && so_thu_tu_buoi)) return;

  // Dùng đúng công thức khóa ở domain/billing.ts — trước đây chốt bằng Math.floor(N/2) và so
  // sánh `===`, vừa lệch mốc chặn của khâu đặt lịch (gói 12 buổi: check-in chặn buổi 6 trong
  // khi đặt lịch chặn buổi 5), vừa bỏ lọt các buổi sau đó, vừa chặn nhầm gói trả từng buổi
  // (hóa đơn từng buổi luôn còn nợ nên bị coi là "chưa đóng đủ").
  const pdRes = await db.query(
    `SELECT pd.tong_so_buoi, hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra,
            hd.tong_tien_goc, hd.ti_le_giam_gia_goi
     FROM phac_do_dieu_tri pd
     LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
     WHERE pd.id = $1`,
    [phac_do_dieu_tri_id]
  );
  const row = pdRes.rows[0];
  if (!row || row.hinh_thuc_thanh_toan_goi !== 'tra_gop') return;

  const tongSoBuoi = Number(row.tong_so_buoi || 10);
  const packageTotal = Number(row.tong_tien_phai_tra || 0);
  const daTra = Number(row.so_tien_da_tra || 0);

  // Giá gói sau giảm nhưng TRƯỚC khấu trừ phí khám đã đóng riêng (xem getMinPaymentRequired).
  // ti_le_giam_gia_goi đã là % GỘP của (ưu đãi hình thức thanh toán + voucher) — xem
  // calculateDiscountPercent ở receptionist.repository.ts — nên KHÔNG được trừ thêm
  // so_tien_giam_voucher lần nữa, kẻo trừ giảm giá voucher 2 lần.
  const tongTienGoc = Number(row.tong_tien_goc || 0);
  const tiLeGiam = Number(row.ti_le_giam_gia_goi || 0);
  const grossBeforeExamDeduction = tongTienGoc > 0
    ? tongTienGoc - Math.round((tongTienGoc * tiLeGiam) / 100)
    : packageTotal;

  const minRequired = getMinPaymentRequired(
    row.hinh_thuc_thanh_toan_goi as HinhThucThanhToanGoi,
    packageTotal,
    tongSoBuoi,
    Number(so_thu_tu_buoi),
    grossBeforeExamDeduction
  );

  if (daTra < minRequired) {
    const conThieu = minRequired - daTra;
    const err = new Error(
      `Khách hàng bắt buộc phải đóng nốt Đợt 2 (còn thiếu ${conThieu.toLocaleString('vi-VN')}đ) trước khi check-in Buổi ${so_thu_tu_buoi}.`
    ) as any;
    err.statusCode = 400;
    throw err;
  }
}

function calculateConfirmationDeadline(now: Date, appointmentStart: Date): Date {
  const durationMs = 30 * 60 * 1000;

  // Get local hour in Vietnam (UTC+7)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    hour12: false
  });
  const localHour = parseInt(formatter.format(now), 10);
  let baseDeadline: Date;

  if (localHour >= 20 || localHour < 8) {
    // Nighttime: next opening is 08:00 (tomorrow if now is >=20:00, or today if now is <08:00)
    let openingDate = now;
    if (localHour >= 20) {
      openingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    const openingTime = new Date(getVnDateString(openingDate, 8, 0, 0));
    baseDeadline = new Date(openingTime.getTime() + durationMs);
  } else {
    // Daytime: standard + 30 min, carry over overflow after 20:00 to next day 08:00
    const standardDeadline = new Date(now.getTime() + durationMs);
    const closingTime = new Date(getVnDateString(now, 20, 0, 0));

    if (standardDeadline.getTime() > closingTime.getTime()) {
      const overflowMs = standardDeadline.getTime() - closingTime.getTime();
      const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextOpeningTime = new Date(getVnDateString(nextDay, 8, 0, 0));
      baseDeadline = new Date(nextOpeningTime.getTime() + overflowMs);
    } else {
      baseDeadline = standardDeadline;
    }
  }

  return baseDeadline < appointmentStart ? baseDeadline : appointmentStart;
}

function getVnDateString(date: Date, hour: number, minute: number, second: number): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;

  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const s = String(second).padStart(2, '0');
  return `${year}-${month}-${day}T${h}:${m}:${s}+07:00`;
}

class AppointmentRepository {
  async getAllAppointments(userRole?: number) {
    let whereClause = '';

    const query = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ch.trang_thai, 
        CASE 
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.ho_ten AS ten_khach_hang, 
        COALESCE(ch.so_dien_thoai, kh.so_dien_thoai) AS so_dien_thoai,
        kh.id as khach_hang_id,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ch.nhan_su_id as bac_si_id,
        ch.nhan_su_id AS ky_thuat_vien_id,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        nk.chan_doan,
        nk.chong_chi_dinh,
        ch.so_thu_tu_buoi,
        ch.phac_do_dieu_tri_id as phac_do_dieu_tri_id,
        ch.phac_do_dieu_tri_id as goi_dich_vu_id,
        COALESCE(hd.trang_thai, 'chua_thanh_toan') AS trang_thai_thanh_toan,
        hd.trang_thai as trang_thai_hoa_don_goi,
        hd.so_tien_da_tra as so_tien_da_tra_goi,
        hd.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi,
        hd.id as hoa_don_goi_id,
        hd.tong_tien_goc as tong_tien_goc_goi,
        hd.ti_le_giam_gia_goi as ti_le_giam_gia_goi,
        hd.so_tien_giam_voucher as so_tien_giam_voucher_goi,
        pd.tong_so_buoi as tong_so_buoi_goi,
        pd.goi_dich_vu_id as pd_goi_dich_vu_id,
        COALESCE(g.loai_goi, gpd.loai_goi) as loai_goi,
        COALESCE(
          (
            SELECT created_at 
            FROM otp_codes 
            WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
            ORDER BY created_at DESC 
            LIMIT 1
          ), 
          ch.ngay_gio_bat_dau
        ) as thoi_gian_tao,
        ch.ghi_chu_khach_hang AS ly_do_kham,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.ly_do_huy as ly_do_huy
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT
          id, trang_thai, so_tien_da_tra, tong_tien_phai_tra, hinh_thuc_thanh_toan_goi,
          tong_tien_goc, ti_le_giam_gia_goi, so_tien_giam_voucher
        FROM hoa_don
        WHERE
          (ch.phac_do_dieu_tri_id IS NOT NULL AND phac_do_dieu_tri_id = ch.phac_do_dieu_tri_id)
          OR
          (ch.phac_do_dieu_tri_id IS NULL AND cuoc_hen_id = ch.id)
        ORDER BY phac_do_dieu_tri_id ASC NULLS FIRST
        LIMIT 1
      ) hd ON TRUE
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
          AND lt.gio_ket_thuc > (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
        LIMIT 1
      ) shift_room ON TRUE
      ${whereClause}
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query);

    // Fetch active holds that have not expired yet
    const holdQuery = `
      SELECT 
        t.id,
        'HOLD-' || UPPER(SUBSTRING(t.id::text FROM 1 FOR 6)) as ma_lich_dat,
        t.ngay_gio_bat_dau as ngay_gio_bat_dau,
        t.ngay_gio_ket_thuc as ngay_gio_ket_thuc,
        'giu_cho' as trang_thai,
        CASE 
          WHEN UPPER(g.loai_goi) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          ELSE 'dieu_tri'
        END as loai_lich,
        COALESCE(kh.ho_ten, 'Khách giữ chỗ') as ten_khach_hang,
        t.so_dien_thoai as so_dien_thoai,
        t.khach_hang_id as khach_hang_id,
        g.ten_goi as ten_dich_vu,
        nd.ho_ten as ten_ky_thuat_vien,
        t.nhan_su_id as bac_si_id,
        t.nhan_su_id as ky_thuat_vien_id,
        null as phong_id,
        null as ten_phong,
        null as chan_doan,
        null as chong_chi_dinh,
        null as so_thu_tu_buoi,
        null as phac_do_dieu_tri_id,
        t.goi_dich_vu_id as goi_dich_vu_id,
        'chua_thanh_toan' as trang_thai_thanh_toan,
        null as trang_thai_hoa_don_goi,
        null as so_tien_da_tra_goi,
        null as tong_tien_phai_tra_goi,
        null as hinh_thuc_thanh_toan_goi,
        null as hoa_don_goi_id,
        null as tong_tien_goc_goi,
        null as ti_le_giam_gia_goi,
        null as so_tien_giam_voucher_goi,
        null as tong_so_buoi_goi,
        null as pd_goi_dich_vu_id,
        t.thoi_gian_tao as thoi_gian_tao,
        'Giữ chỗ đang điền thông tin' as ly_do_kham,
        null as ghi_chu_noi_bo,
        null as ly_do_huy
      FROM tam_giu_cho t
      LEFT JOIN khach_hang kh ON t.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON t.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd ON t.nhan_su_id = nd.id
      WHERE t.thoi_gian_het_han > NOW()
    `;
    try {
      const holdRes = await pool.query(holdQuery);
      return [...rows, ...holdRes.rows];
    } catch (err) {
      console.error('Error fetching tam_giu_cho rows:', err);
      return rows;
    }
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, email, goi_dich_vu_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, loai_lich, dang_ky_goi_id, phong_id } = data;
    let phac_do_dieu_tri_id = data.phac_do_dieu_tri_id;
    let so_thu_tu_buoi = data.so_thu_tu_buoi;
    const bac_si_id = data.bac_si_id || data.chuyen_gia_id || data.ky_thuat_vien_id;
    const finalGoiId = goi_dich_vu_id || data.dich_vu_id;

    // Kiểm tra chặn đặt lịch tiếp theo khi buổi trước đó chưa hoàn thành
    if (phac_do_dieu_tri_id) {
      const activeApptRes = await pool.query(
        `SELECT id, so_thu_tu_buoi, trang_thai 
         FROM cuoc_hen 
         WHERE phac_do_dieu_tri_id = $1 
           AND trang_thai IN ('chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham')
         LIMIT 1`,
        [phac_do_dieu_tri_id]
      );
      if (activeApptRes.rows.length > 0) {
        const activeAppt = activeApptRes.rows[0];
        throw new Error(`Khách hàng đã có lịch đặt cho buổi số ${activeAppt.so_thu_tu_buoi} đang hoạt động. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước khi đặt buổi tiếp theo.`);
      }

      // Chặn đặt buổi mới SỚM HƠN buổi liền trước trong cùng phác đồ (kể cả khi buổi trước đã
      // hoàn thành/không còn active) — trước đây không đối chiếu thời gian giữa các buổi nên dữ
      // liệu test từng đặt được buổi 4 sớm hơn buổi 3 cùng phác đồ.
      if (so_thu_tu_buoi && Number(so_thu_tu_buoi) > 1) {
        const prevSessionRes = await pool.query(
          `SELECT MAX(ngay_gio_bat_dau) as last_date
           FROM cuoc_hen
           WHERE phac_do_dieu_tri_id = $1 AND so_thu_tu_buoi < $2 AND trang_thai != 'da_huy'`,
          [phac_do_dieu_tri_id, so_thu_tu_buoi]
        );
        const lastDate = prevSessionRes.rows[0]?.last_date;
        if (lastDate && new Date(ngay_gio_bat_dau).getTime() <= new Date(lastDate).getTime()) {
          throw new Error(`Buổi số ${so_thu_tu_buoi} phải được đặt sau thời gian của (các) buổi trước đó trong cùng liệu trình.`);
        }
      }

      // Kiểm tra điều kiện hoàn tất thanh toán của buổi trước khi đặt lịch cho buổi tiếp theo (Thống nhất 3 hình thức)
      const invRes = await pool.query(
        `SELECT hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.tong_tien_goc,
                hd.ti_le_giam_gia_goi, hd.so_tien_giam_voucher, hd.trang_thai as hd_trang_thai,
                pd.tong_so_buoi, pd.trang_thai as pd_trang_thai, g.loai_goi
         FROM hoa_don hd
         JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
         JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
         WHERE hd.phac_do_dieu_tri_id = $1
         LIMIT 1`,
        [phac_do_dieu_tri_id]
      );
      if (invRes.rows.length > 0) {
        const { hinh_thuc_thanh_toan_goi, tong_tien_phai_tra, so_tien_da_tra, tong_so_buoi, loai_goi,
          tong_tien_goc, ti_le_giam_gia_goi, so_tien_giam_voucher,
          pd_trang_thai, hd_trang_thai } = invRes.rows[0];

        // Gói đã hủy/hoàn tiền: chấm dứt vĩnh viễn, không đặt thêm buổi nào nữa (kể cả khi
        // so_tien_da_tra tụt xuống sau hoàn tiền — đó KHÔNG phải "khách còn nợ tiền").
        if (['huy', 'da_huy'].includes(String(pd_trang_thai)) || hd_trang_thai === 'da_hoan_tien') {
          throw new Error('Gói trị liệu này đã bị hủy và hoàn tiền. Không thể đặt thêm buổi điều trị cho gói đã hủy.');
        }

        // Gói lẻ LE không bị chặn đặt lịch trước thanh toán
        if (loai_goi !== 'LE') {
          const M = Number(so_thu_tu_buoi) || 1;
          const grossBeforeExamDeduction = Number(tong_tien_goc || 0)
            - Math.round(Number(tong_tien_goc || 0) * Number(ti_le_giam_gia_goi || 0) / 100)
            - Number(so_tien_giam_voucher || 0);
          const minRequired = getMinPaymentRequired(
            hinh_thuc_thanh_toan_goi,
            Number(tong_tien_phai_tra),
            Number(tong_so_buoi || 10),
            M,
            grossBeforeExamDeduction
          );
          if (Number(so_tien_da_tra) < minRequired) {
            if (hinh_thuc_thanh_toan_goi === 'tra_gop') {
              throw new Error(`Khách hàng chưa thanh toán Đợt 2 của gói trả góp. Vui lòng thanh toán trước khi thực hiện buổi trị liệu số ${M}!`);
            } else if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
              throw new Error(`Khách hàng chưa hoàn tất thanh toán cho gói trị liệu này. Vui lòng thanh toán trước khi thực hiện buổi số ${M}!`);
            } else {
              throw new Error(`Khách hàng chưa hoàn tất thanh toán cho buổi điều trị trước đó. Vui lòng thanh toán trước khi đặt lịch cho buổi số ${M}!`);
            }
          }
        }
      }
    }

    // Kiểm tra trùng lịch bác sĩ
    if (bac_si_id) {
      const doctorOverlap = await this.checkDoctorOverlap(bac_si_id, ngay_gio_bat_dau, ngay_gio_ket_thuc);
      if (doctorOverlap) {
        const err: any = new Error('Bác sĩ đã có lịch trong khung giờ này.');
        err.constraint = 'no_overlap_ktv';
        throw err;
      }
    }

    // Kiểm tra trùng lịch khách hàng
    if (khach_hang_id || so_dien_thoai) {
      const customerOverlap = await this.checkCustomerOverlap(khach_hang_id, so_dien_thoai, ngay_gio_bat_dau, ngay_gio_ket_thuc);
      if (customerOverlap) {
        const err: any = new Error('Khách hàng đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này.');
        err.constraint = 'no_overlap_khach_hang';
        throw err;
      }
    }

    // Kiểm tra giới hạn khách hàng đặt tối đa 3 dịch vụ trong cùng 1 ngày
    if (khach_hang_id || so_dien_thoai) {
      const startLocal = new Date(new Date(ngay_gio_bat_dau).getTime() + 7 * 60 * 60000);
      const dateStr = `${startLocal.getUTCFullYear()}-${String(startLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(startLocal.getUTCDate()).padStart(2, '0')}`;

      const hasTooManyServices = await this.checkCustomerHasClinicalExamOnDate(khach_hang_id, so_dien_thoai || null, dateStr);
      if (hasTooManyServices) {
        throw new Error('Khách hàng đã đạt giới hạn tối đa 3 dịch vụ trong ngày này.');
      }
    }

    let final_khach_hang_id = khach_hang_id;

    // Kiểm tra trùng SĐT liên hệ với tài khoản khách hàng khác hoặc nhân sự
    if (so_dien_thoai && so_dien_thoai.trim() !== '') {
      const cleanPhone = so_dien_thoai.trim();
      const checkPhoneCust = await pool.query(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND ($2::uuid IS NULL OR id != $2::uuid)',
        [cleanPhone, final_khach_hang_id || null]
      );
      const checkPhoneStaff = await pool.query('SELECT id FROM nguoi_dung WHERE so_dien_thoai = $1', [cleanPhone]);
      if (checkPhoneCust.rows.length > 0 || checkPhoneStaff.rows.length > 0) {
        throw new Error('Số điện thoại liên hệ này đã được đăng ký cho một tài khoản khác trong hệ thống.');
      }
    }

    if (!final_khach_hang_id && (email || so_dien_thoai)) {
      // 1. Validate formats
      if (!ho_ten_khach || ho_ten_khach.trim().length < 2) {
        throw new Error('Họ tên khách hàng phải có ít nhất 2 ký tự.');
      }
      const nameRegex = /^[\p{L}\s']{2,}$/u;
      if (!nameRegex.test(ho_ten_khach.trim())) {
        throw new Error('Họ tên khách hàng chỉ được chứa chữ cái và khoảng trắng.');
      }

      if (!so_dien_thoai) {
        throw new Error('Số điện thoại khách hàng là bắt buộc.');
      }
      const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
      if (!phoneRegex.test(so_dien_thoai.trim())) {
        throw new Error('Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      }

      // Email bắt buộc — đây cũng là định danh đăng nhập của khách và cần thiết cho xác thực OTP
      // sau này (quên mật khẩu, ...), không thể để trống rồi tự sinh email giả như trước.
      if (!email || email.trim() === '') {
        throw new Error('Email khách hàng là bắt buộc.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Địa chỉ email không đúng định dạng.');
      }

      // 3. Check for duplicate email in customer or staff
      if (email && email.trim() !== '') {
        const checkEmailCust = await pool.query('SELECT id FROM khach_hang WHERE email = $1', [email.trim()]);
        const checkEmailStaff = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [email.trim()]);
        if (checkEmailCust.rows.length > 0 || checkEmailStaff.rows.length > 0) {
          throw new Error('Địa chỉ email này đã được đăng ký cho một tài khoản khác.');
        }
      }

      // 4. Create new customer
      const targetEmail = email.trim();
      const defaultPassword = '123456';
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(defaultPassword, salt);

      const { rows: newKh } = await pool.query(`
        INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, mat_khau_hash, gioi_tinh, trang_thai, phai_doi_mat_khau)
        VALUES ($1, $2, $3, $4, $5, 'hoat_dong', true) RETURNING id
      `, [ho_ten_khach.trim(), so_dien_thoai.trim(), targetEmail, hash, gioi_tinh_khach || 'khac']);
      final_khach_hang_id = newKh[0].id;
    }

    // Validate package payment check for treatment appointments (DIEU_TRI) or when the service is a package (LIEU_TRINH)
    const targetGoiId = dang_ky_goi_id || phac_do_dieu_tri_id || finalGoiId;

    if (final_khach_hang_id && targetGoiId) {
      let loaiGoi = null;
      let tenGoi = 'Gói dịch vụ';

      let resolvedPdId = phac_do_dieu_tri_id || null;
      if (resolvedPdId) {
        const pdInfo = await pool.query(`
          SELECT pd.goi_dich_vu_id, gdv.loai_goi, gdv.ten_goi 
          FROM phac_do_dieu_tri pd
          JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
          WHERE pd.id = $1
        `, [resolvedPdId]);
        if (pdInfo.rows.length > 0) {
          loaiGoi = pdInfo.rows[0].loai_goi;
          tenGoi = pdInfo.rows[0].ten_goi;
        }
      } else {
        const gdvInfo = await pool.query('SELECT loai_goi, ten_goi FROM goi_dich_vu WHERE id = $1', [targetGoiId]);
        if (gdvInfo.rows.length > 0) {
          loaiGoi = gdvInfo.rows[0].loai_goi;
          tenGoi = gdvInfo.rows[0].ten_goi;
        }
      }

      const isTreatment = loai_lich === 'dieu_tri' || loai_lich === 'DIEU_TRI' || loaiGoi === 'LIEU_TRINH';

      if (isTreatment && loaiGoi === 'LIEU_TRINH') {
        const invoiceQuery = `
          SELECT hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.hinh_thuc_thanh_toan_goi, hd.trang_thai, pd.id as phac_do_id, pd.tong_so_buoi,
                 hd.tong_tien_goc, hd.ti_le_giam_gia_goi, hd.so_tien_giam_voucher
          FROM phac_do_dieu_tri pd
          JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
          WHERE pd.khach_hang_id = $1 AND (pd.id = $2 OR pd.goi_dich_vu_id = $3)
          ORDER BY hd.ngay_tao DESC LIMIT 1
        `;
        const invRes = await pool.query(invoiceQuery, [final_khach_hang_id, resolvedPdId, targetGoiId]);

        if (invRes.rows.length === 0) {
          throw new Error(`Bệnh nhân chưa thanh toán/đăng ký gói trị liệu "${tenGoi}". Vui lòng thanh toán trước khi lên lịch hẹn!`);
        }

        const invoiceObj = invRes.rows[0];
        const tongTien = Number(invoiceObj.tong_tien_phai_tra || 0);
        const daThanhToan = Number(invoiceObj.so_tien_da_tra || 0);
        const hinhThuc: HinhThucThanhToanGoi = invoiceObj.hinh_thuc_thanh_toan_goi || 'tra_thang';
        const tongSoBuoiGoi = Number(invoiceObj.tong_so_buoi || 10);
        const sessionNumForCheck = Number(so_thu_tu_buoi) || 1;
        const grossBeforeExamDeduction = Number(invoiceObj.tong_tien_goc || 0)
          - Math.round(Number(invoiceObj.tong_tien_goc || 0) * Number(invoiceObj.ti_le_giam_gia_goi || 0) / 100)
          - Number(invoiceObj.so_tien_giam_voucher || 0);

        const minRequired = getMinPaymentRequired(hinhThuc, tongTien, tongSoBuoiGoi, sessionNumForCheck, grossBeforeExamDeduction);
        if (daThanhToan < minRequired) {
          const formattedPaid = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(daThanhToan);
          const formattedRequired = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minRequired);
          const label = hinhThuc === 'tra_gop' ? 'Trả góp' : hinhThuc === 'tung_buoi' ? 'Trả từng buổi' : 'Trả thẳng 100%';
          throw new Error(`Gói trị liệu "${tenGoi}" (${label}) yêu cầu thanh toán tối thiểu trước khi đặt lịch. Bệnh nhân mới đóng ${formattedPaid} / ${formattedRequired}.`);
        }

        if (!phac_do_dieu_tri_id && invoiceObj.phac_do_id) {
          phac_do_dieu_tri_id = invoiceObj.phac_do_id;
          data.phac_do_dieu_tri_id = invoiceObj.phac_do_id;
        }
      }
    }

    const finalPhacDoId = phac_do_dieu_tri_id || data.phac_do_dieu_tri_id;
    if (finalPhacDoId) {
      if (!phac_do_dieu_tri_id) {
        phac_do_dieu_tri_id = finalPhacDoId;
      }
      if (!so_thu_tu_buoi) {
        const countRes = await pool.query(
          "SELECT COUNT(*)::int as count FROM cuoc_hen WHERE phac_do_dieu_tri_id = $1 AND loai = 'DIEU_TRI'",
          [finalPhacDoId]
        );
        so_thu_tu_buoi = (countRes.rows[0].count || 0) + 1;
        data.so_thu_tu_buoi = so_thu_tu_buoi;
      }

      const activeApptRes = await pool.query(
        `SELECT id, so_thu_tu_buoi, trang_thai 
         FROM cuoc_hen 
         WHERE phac_do_dieu_tri_id = $1 
           AND trang_thai IN ('chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham')
         LIMIT 1`,
        [finalPhacDoId]
      );
      if (activeApptRes.rows.length > 0) {
        const activeAppt = activeApptRes.rows[0];
        throw new Error(`Khách hàng đã có lịch đặt cho buổi số ${activeAppt.so_thu_tu_buoi} đang hoạt động. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước khi đặt buổi tiếp theo.`);
      }

      // Chặn đặt buổi mới SỚM HƠN buổi liền trước trong cùng phác đồ (xem giải thích ở nhánh trên).
      if (so_thu_tu_buoi && Number(so_thu_tu_buoi) > 1) {
        const prevSessionRes = await pool.query(
          `SELECT MAX(ngay_gio_bat_dau) as last_date
           FROM cuoc_hen
           WHERE phac_do_dieu_tri_id = $1 AND so_thu_tu_buoi < $2 AND trang_thai != 'da_huy'`,
          [finalPhacDoId, so_thu_tu_buoi]
        );
        const lastDate = prevSessionRes.rows[0]?.last_date;
        if (lastDate && new Date(ngay_gio_bat_dau).getTime() <= new Date(lastDate).getTime()) {
          throw new Error(`Buổi số ${so_thu_tu_buoi} phải được đặt sau thời gian của (các) buổi trước đó trong cùng liệu trình.`);
        }
      }

      // Kiểm tra điều kiện hoàn tất thanh toán của buổi trước khi đặt lịch cho buổi tiếp theo (Thống nhất 3 hình thức)
      const invRes = await pool.query(
        `SELECT hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.tong_tien_goc,
                hd.ti_le_giam_gia_goi, hd.so_tien_giam_voucher, pd.tong_so_buoi, g.loai_goi
         FROM hoa_don hd
         JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
         JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
         WHERE hd.phac_do_dieu_tri_id = $1
         LIMIT 1`,
        [finalPhacDoId]
      );
      if (invRes.rows.length > 0) {
        const { hinh_thuc_thanh_toan_goi, tong_tien_phai_tra, so_tien_da_tra, tong_so_buoi, loai_goi,
          tong_tien_goc, ti_le_giam_gia_goi, so_tien_giam_voucher } = invRes.rows[0];

        // Gói lẻ LE không bị chặn đặt lịch trước thanh toán
        if (loai_goi !== 'LE') {
          const M = Number(so_thu_tu_buoi) || 1;
          const grossBeforeExamDeduction = Number(tong_tien_goc || 0)
            - Math.round(Number(tong_tien_goc || 0) * Number(ti_le_giam_gia_goi || 0) / 100)
            - Number(so_tien_giam_voucher || 0);
          const minRequired = getMinPaymentRequired(
            hinh_thuc_thanh_toan_goi,
            Number(tong_tien_phai_tra),
            Number(tong_so_buoi || 10),
            M,
            grossBeforeExamDeduction
          );
          if (Number(so_tien_da_tra) < minRequired) {
            if (hinh_thuc_thanh_toan_goi === 'tra_gop') {
              throw new Error(`Khách hàng chưa thanh toán Đợt 2 của gói trả góp. Vui lòng thanh toán trước khi thực hiện buổi trị liệu số ${M}!`);
            } else if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
              throw new Error(`Khách hàng chưa hoàn tất thanh toán cho gói trị liệu này. Vui lòng thanh toán trước khi thực hiện buổi số ${M}!`);
            } else {
              throw new Error(`Khách hàng chưa hoàn tất thanh toán cho buổi điều trị trước đó. Vui lòng thanh toán trước khi đặt lịch cho buổi số ${M}!`);
            }
          }
        }
      }
    }

    const isCreatedByStaff = !!data.nguoi_tao_id;
    const defaultStatus = isCreatedByStaff
      ? (bac_si_id ? 'da_xac_nhan' : 'cho_xac_nhan')
      : 'chua_xac_nhan';
    const trang_thai = data.trang_thai || defaultStatus;
    const finalLoai = (loai_lich === 'dieu_tri' || loai_lich === 'DIEU_TRI') ? 'DIEU_TRI' : ((loai_lich === 'kham_moi' || loai_lich === 'KHAM') ? 'KHAM' : 'DICH_VU_LE');

    // Tự động phân phòng từ lịch trực của nhân sự nếu chưa gán
    let resolvedPhongId = phong_id ? Number(phong_id) : null;
    if (!resolvedPhongId && bac_si_id) {
      const { rows: shiftRows } = await pool.query(`
        SELECT phong_id FROM lich_truc_nhan_su
        WHERE nhan_su_id = $1
          AND ngay_truc = $2::date
          AND trang_thai = 'hoat_dong'
          AND gio_bat_dau <= ($3::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
          AND gio_ket_thuc > ($3::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
        LIMIT 1
      `, [bac_si_id, ngay_gio_bat_dau.split('T')[0], ngay_gio_bat_dau]);
      if (shiftRows.length > 0 && shiftRows[0].phong_id) {
        resolvedPhongId = shiftRows[0].phong_id;
      }
    }

    const query = `
      INSERT INTO cuoc_hen (khach_hang_id, nhan_su_id, goi_dich_vu_id, phac_do_dieu_tri_id, so_thu_tu_buoi, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, ghi_chu_khach_hang, phong_id, nguoi_tao_id, so_dien_thoai)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      bac_si_id || null,
      finalGoiId || null,
      phac_do_dieu_tri_id || null,
      so_thu_tu_buoi || null,
      ngay_gio_bat_dau,
      ngay_gio_ket_thuc,
      finalLoai,
      trang_thai,
      ghi_chu_dat_lich || null,
      resolvedPhongId,
      data.nguoi_tao_id || null,
      so_dien_thoai || null
    ]);

    return rows[0];
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const goi_dich_vu_id = data.goi_dich_vu_id || data.dich_vu_id;
    const { khach_hang_id, nhan_su_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ly_do_kham, trang_thai, trieu_chung, anh_dinh_kem_url } = data;
    const phac_do_dieu_tri_id = data.phac_do_dieu_tri_id;
    const so_thu_tu_buoi = data.so_thu_tu_buoi;

    const startLocal = new Date(new Date(ngay_gio_bat_dau).getTime() + 7 * 60 * 60000);
    const dateStr = `${startLocal.getUTCFullYear()}-${String(startLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(startLocal.getUTCDate()).padStart(2, '0')}`;
    const slotTimeStr = `${String(startLocal.getUTCHours()).padStart(2, '0')}:${String(startLocal.getUTCMinutes()).padStart(2, '0')}`;

    const bookedSlotsData = await this.getBookedSlots(dateStr, undefined, undefined, 30, goi_dich_vu_id, data.temp_hold_id);
    const bookedSlotsList = Array.isArray(bookedSlotsData) ? bookedSlotsData : (bookedSlotsData.bookedSlots || []);
    if (bookedSlotsList.includes(slotTimeStr)) {
      throw new Error('Khung giờ này đã hết chỗ, vui lòng chọn khung giờ khác.');
    }

    const final_khach_hang_id_input = khach_hang_id || null;

    // Kiểm tra chặn đặt lịch tiếp theo khi buổi trước đó chưa hoàn thành
    if (phac_do_dieu_tri_id) {
      const activeApptRes = await pool.query(
        `SELECT id, so_thu_tu_buoi, trang_thai 
         FROM cuoc_hen 
         WHERE phac_do_dieu_tri_id = $1 
           AND trang_thai IN ('chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham')
         LIMIT 1`,
        [phac_do_dieu_tri_id]
      );
      if (activeApptRes.rows.length > 0) {
        const activeAppt = activeApptRes.rows[0];
        throw new Error(`Bạn đã có lịch đặt cho buổi số ${activeAppt.so_thu_tu_buoi} đang hoạt động. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước khi đặt buổi tiếp theo.`);
      }

      // Chặn đặt buổi mới SỚM HƠN buổi liền trước trong cùng phác đồ
      if (so_thu_tu_buoi && Number(so_thu_tu_buoi) > 1) {
        const prevSessionRes = await pool.query(
          `SELECT MAX(ngay_gio_bat_dau) as last_date
           FROM cuoc_hen
           WHERE phac_do_dieu_tri_id = $1 AND so_thu_tu_buoi < $2 AND trang_thai != 'da_huy'`,
          [phac_do_dieu_tri_id, so_thu_tu_buoi]
        );
        const lastDate = prevSessionRes.rows[0]?.last_date;
        if (lastDate && new Date(ngay_gio_bat_dau).getTime() <= new Date(lastDate).getTime()) {
          throw new Error(`Buổi số ${so_thu_tu_buoi} phải được đặt sau thời gian của (các) buổi trước đó trong cùng liệu trình.`);
        }
      }

      // Kiểm tra điều kiện hoàn tất thanh toán của buổi trước khi đặt lịch cho buổi tiếp theo
      const invRes = await pool.query(
        `SELECT hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.tong_tien_goc,
                hd.ti_le_giam_gia_goi, hd.so_tien_giam_voucher, hd.trang_thai as hd_trang_thai,
                pd.tong_so_buoi, pd.trang_thai as pd_trang_thai, g.loai_goi
         FROM hoa_don hd
         JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
         JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
         WHERE hd.phac_do_dieu_tri_id = $1
         LIMIT 1`,
        [phac_do_dieu_tri_id]
      );
      if (invRes.rows.length > 0) {
        const { hinh_thuc_thanh_toan_goi, tong_tien_phai_tra, so_tien_da_tra, tong_so_buoi, loai_goi,
          tong_tien_goc, ti_le_giam_gia_goi, so_tien_giam_voucher,
          pd_trang_thai, hd_trang_thai } = invRes.rows[0];

        if (['huy', 'da_huy'].includes(String(pd_trang_thai)) || hd_trang_thai === 'da_hoan_tien') {
          throw new Error('Gói trị liệu này đã bị hủy và hoàn tiền. Không thể đặt thêm buổi điều trị cho gói đã hủy.');
        }

        if (loai_goi !== 'LE') {
          const M = Number(so_thu_tu_buoi) || 1;
          const grossBeforeExamDeduction = Number(tong_tien_goc || 0)
            - Math.round(Number(tong_tien_goc || 0) * Number(ti_le_giam_gia_goi || 0) / 100)
            - Number(so_tien_giam_voucher || 0);
          const minRequired = getMinPaymentRequired(
            hinh_thuc_thanh_toan_goi,
            Number(tong_tien_phai_tra),
            Number(tong_so_buoi || 10),
            M,
            grossBeforeExamDeduction
          );
          if (Number(so_tien_da_tra) < minRequired) {
            if (hinh_thuc_thanh_toan_goi === 'tra_gop') {
              throw new Error(`Bạn chưa thanh toán Đợt 2 của gói trả góp. Vui lòng thanh toán trước khi thực hiện buổi trị liệu số ${M}!`);
            } else if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
              throw new Error(`Bạn chưa hoàn tất thanh toán cho gói trị liệu này. Vui lòng thanh toán trước khi thực hiện buổi số ${M}!`);
            } else {
              throw new Error(`Bạn chưa hoàn tất thanh toán cho buổi điều trị trước đó. Vui lòng thanh toán trước khi đặt lịch cho buổi số ${M}!`);
            }
          }
        }
      }
    }

    let isExamService = false;
    let duration = 30; // default duration
    if (goi_dich_vu_id) {
      const dvRes = await pool.query("SELECT loai_goi, thoi_luong_phut FROM goi_dich_vu WHERE id = $1", [goi_dich_vu_id]);
      if (dvRes.rows.length > 0) {
        isExamService = dvRes.rows[0].loai_goi === 'KHAM';
        duration = Number(dvRes.rows[0].thoi_luong_phut) || 30;
      }
    }

    const ngay_gio_ket_thuc = data.ngay_gio_ket_thuc || new Date(new Date(ngay_gio_bat_dau).getTime() + duration * 60000).toISOString();

    if (final_khach_hang_id_input || so_dien_thoai) {
      const hasClinicalExam = await this.checkCustomerHasClinicalExamOnDate(final_khach_hang_id_input, so_dien_thoai || null, dateStr, data.temp_hold_id);
      if (hasClinicalExam) {
        const [y, m, d] = dateStr.split('-');
        throw new Error(`Bạn đã đạt giới hạn đặt tối đa 3 dịch vụ trong ngày ${parseInt(d, 10)}/${parseInt(m, 10)}. Vui lòng chọn ngày khác hoặc liên hệ hotline.`);
      }
    }

    if (final_khach_hang_id_input || so_dien_thoai) {
      const customerOverlap = await this.checkCustomerOverlap(final_khach_hang_id_input, so_dien_thoai, ngay_gio_bat_dau, ngay_gio_ket_thuc);
      if (customerOverlap) {
        throw new Error('Bạn đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này.');
      }
    }

    if (final_khach_hang_id_input && so_dien_thoai && so_dien_thoai.trim() !== '') {
      const cleanPhone = so_dien_thoai.trim();
      const checkPhoneCust = await pool.query(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
        [cleanPhone, final_khach_hang_id_input]
      );
      const checkPhoneStaff = await pool.query('SELECT id FROM nguoi_dung WHERE so_dien_thoai = $1', [cleanPhone]);
      if (checkPhoneCust.rows.length > 0 || checkPhoneStaff.rows.length > 0) {
        throw new Error('Số điện thoại liên hệ này đã được đăng ký cho một tài khoản khác trong hệ thống.');
      }
    }

    let final_khach_hang_id = final_khach_hang_id_input;
    if (!final_khach_hang_id && so_dien_thoai) {
      const res = await pool.query('SELECT id FROM khach_hang WHERE so_dien_thoai = $1', [so_dien_thoai]);
      if (res.rows.length > 0) {
        final_khach_hang_id = res.rows[0].id;
      } else {
        const targetEmail = `${so_dien_thoai}@officecare.placeholder`;
        const defaultPassword = '123456';
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(defaultPassword, salt);

        const { rows: newKh } = await pool.query(`
          INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, mat_khau_hash, gioi_tinh, phai_doi_mat_khau)
          VALUES ($1, $2, $3, $4, $5, true) RETURNING id
        `, [ho_ten_khach || 'Khách vãng lai', so_dien_thoai, targetEmail, hash, gioi_tinh_khach || 'khac']);
        final_khach_hang_id = newKh[0].id;
      }
    }

    let final_nhan_su_id = nhan_su_id ? Number(nhan_su_id) : (data.nguoi_dung_id ? Number(data.nguoi_dung_id) : null);

    // Tự động phân phòng từ lịch trực của nhân sự nếu chưa gán
    let resolvedPhongId = null;
    if (final_nhan_su_id) { // selected staff member
      const { rows: shiftRows } = await pool.query(`
        SELECT phong_id FROM lich_truc_nhan_su
        WHERE nhan_su_id = $1
          AND ngay_truc = $2::date
          AND trang_thai = 'hoat_dong'
          AND gio_bat_dau <= ($3::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
          AND gio_ket_thuc > ($3::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
        LIMIT 1
      `, [final_nhan_su_id, ngay_gio_bat_dau.split('T')[0], ngay_gio_bat_dau]);
      if (shiftRows.length > 0 && shiftRows[0].phong_id) {
        resolvedPhongId = shiftRows[0].phong_id;
      }
    }

    const finalLoai = phac_do_dieu_tri_id ? 'DIEU_TRI' : (isExamService ? 'KHAM' : 'DICH_VU_LE');

    const query = `
      INSERT INTO cuoc_hen (khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, ghi_chu_khach_hang, phong_id, anh_dinh_kem_url, phac_do_dieu_tri_id, so_thu_tu_buoi, so_dien_thoai)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      goi_dich_vu_id || null,
      final_nhan_su_id,
      ngay_gio_bat_dau,
      ngay_gio_ket_thuc,
      finalLoai,
      trang_thai || 'chua_xac_nhan',
      trieu_chung || ly_do_kham || null,
      resolvedPhongId,
      anh_dinh_kem_url || null,
      phac_do_dieu_tri_id || null,
      so_thu_tu_buoi || null,
      so_dien_thoai || null
    ]);

    if (data.temp_hold_id) {
      await pool.query("DELETE FROM tam_giu_cho WHERE session_id = $1", [data.temp_hold_id]);
    }

    return rows[0];
  }

  async getPublicServices() {
    const query = `
      SELECT id, ten_goi as ten_dich_vu, thoi_luong_phut, don_gia
      FROM goi_dich_vu
      WHERE trang_thai = 'hoat_dong' AND loai_goi IN ('KHAM', 'LE')
      ORDER BY ten_goi ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getActiveDoctorDates(): Promise<string[]> {
    const query = `
      SELECT DISTINCT to_char(lt.ngay_truc, 'YYYY-MM-DD') as ngay
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
      WHERE nd.vai_tro_id = 4
        AND lt.trang_thai = 'hoat_dong'
        AND lt.ngay_truc >= CURRENT_DATE
      ORDER BY ngay;
    `;
    const { rows } = await pool.query(query);
    return rows.map((r: any) => r.ngay);
  }

  async getBookedSlots(dateStr: string, userId?: string, phone?: string, duration: number = 30, dichVuId?: string, excludeSessionId?: string): Promise<any> {
    let khach_hang_id: string | null = null;
    if (userId) {
      const khRes = await pool.query('SELECT id FROM khach_hang WHERE id = $1::uuid', [userId]);
      if (khRes.rows.length > 0) {
        khach_hang_id = khRes.rows[0].id;
      }
    }

    let isExam = true;
    if (dichVuId) {
      const dvRes = await pool.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [dichVuId]);
      if (dvRes.rows.length > 0) {
        isExam = dvRes.rows[0].loai_goi === 'KHAM';
      }
    }

    const roleId = isExam ? 4 : 3;

    // 1. Lấy danh sách nhân sự đang hoạt động
    const docQuery = `
      SELECT cg.id AS doctor_id, cg.nguoi_dung_id, nd.ho_ten, nd.anh_dai_dien
      FROM ho_so_chuyen_gia cg
      JOIN nguoi_dung nd ON cg.nguoi_dung_id = nd.id
      WHERE nd.vai_tro_id = $1 AND nd.trang_thai = 'hoat_dong'
    `;
    const docRes = await pool.query(docQuery, [roleId]);
    const doctors = docRes.rows;

    // 2. Lấy danh sách ca làm việc (lịch trực) của các nhân sự trong ngày
    const schedQuery = `
      SELECT nhan_su_id as nguoi_dung_id, gio_bat_dau, gio_ket_thuc, trang_thai
      FROM lich_truc_nhan_su
      WHERE DATE(ngay_truc) = $1::date AND trang_thai = 'hoat_dong'
    `;
    const schedRes = await pool.query(schedQuery, [dateStr]);
    const schedules = schedRes.rows;

    // 3. Lấy danh sách tất cả các lịch hẹn/ca trị liệu đang hoạt động của ngày này (theo giờ VN)
    const aptQuery = `
      SELECT 
        ch.id,
        ch.nhan_su_id as bac_si_id,
        ch.ngay_gio_bat_dau AS bat_dau,
        ch.ngay_gio_ket_thuc AS ket_thuc
      FROM cuoc_hen ch
      WHERE
        DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date
        -- KHÔNG loại 'hoan_thanh' — cùng lý do đã sửa ở checkCustomerOverlap: 1 ca đã hoàn thành
        -- vẫn thực sự chiếm đúng khung giờ/nhân sự đó trong lưới khả dụng của ngày.
        AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
    `;
    const aptRes = await pool.query(aptQuery, [dateStr]);

    // Clean up expired holds
    await pool.query("DELETE FROM tam_giu_cho WHERE thoi_gian_het_han <= NOW()");

    // Get active holds for this day
    const holdQuery = `
      SELECT 
        id,
        nhan_su_id as bac_si_id,
        ngay_gio_bat_dau AS bat_dau,
        ngay_gio_ket_thuc AS ket_thuc
      FROM tam_giu_cho
      WHERE 
        DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date
        AND thoi_gian_het_han > NOW()
        AND ($2::varchar IS NULL OR session_id != $2::varchar)
    `;
    const holdRes = await pool.query(holdQuery, [dateStr, excludeSessionId || null]);

    const appointments = [...aptRes.rows, ...holdRes.rows];

    const interval = duration;

    const generateSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const slots: string[] = [];
      const current = new Date();
      current.setHours(startHour, startMinute, 0, 0);

      const end = new Date();
      end.setHours(endHour, endMinute, 0, 0);

      while (true) {
        const slotNextStart = new Date(current.getTime() + interval * 60000);
        if (slotNextStart.getTime() > end.getTime()) {
          break;
        }

        const formatTime = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };

        slots.push(formatTime(current));
        current.setTime(slotNextStart.getTime());
      }
      return slots;
    };

    const timeSlots = generateSlots(7, 30, 19, 30);

    const scheduledSpecialistsForDay = doctors.filter(doc =>
      schedules.some(s => s.nguoi_dung_id === doc.nguoi_dung_id)
    );

    const enrichedSpecialists = scheduledSpecialistsForDay.map(d => {
      const sch = schedules.find(s => s.nguoi_dung_id === d.nguoi_dung_id);
      const shiftStr = sch ? `Trực ca ${sch.gio_bat_dau.substring(0, 5)}-${sch.gio_ket_thuc.substring(0, 5)}` : 'Không trực hôm nay';
      const count = appointments.filter(apt => apt.bac_si_id === d.nguoi_dung_id).length;
      return {
        id: d.nguoi_dung_id,
        ho_ten: d.ho_ten,
        anh_dai_dien: d.anh_dai_dien,
        ca_truc: shiftStr,
        so_ca: count
      };
    });

    const slotAvailability: Record<string, number[]> = {};

    if (khach_hang_id || phone) {
      const hasClinicalExam = await this.checkCustomerHasClinicalExamOnDate(khach_hang_id, phone || null, dateStr, excludeSessionId);
      if (hasClinicalExam) {
        for (const slot of timeSlots) {
          slotAvailability[slot] = [];
        }
        return {
          bookedSlots: timeSlots,
          specialists: enrichedSpecialists,
          slotAvailability
        };
      }
    }

    const bookedSlots: string[] = [];

    for (const slot of timeSlots) {
      const slotStart = new Date(`${dateStr}T${slot}:00+07:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      if (khach_hang_id || phone) {
        const hasOverlap = await this.checkCustomerOverlap(khach_hang_id, phone || null, slotStart.toISOString(), slotEnd.toISOString());
        if (hasOverlap) {
          bookedSlots.push(slot);
          slotAvailability[slot] = [];
          continue;
        }
      }

      const isOverlapping = (aptStart: any, aptEnd: any) => {
        return slotStart < new Date(aptEnd) && slotEnd > new Date(aptStart);
      };

      const slotApts = appointments.filter(apt => isOverlapping(apt.bat_dau, apt.ket_thuc));

      const scheduledDoctors = doctors.filter(doc => {
        const docScheds = schedules.filter(s => s.nguoi_dung_id === doc.nguoi_dung_id);
        if (docScheds.length === 0) return false;

        return docScheds.some(s => {
          const dutyStart = s.gio_bat_dau.substring(0, 5);
          const dutyEnd = s.gio_ket_thuc.substring(0, 5);
          return dutyStart <= slot && dutyEnd > slot;
        });
      });

      const assignedApts = slotApts.filter(a => a.bac_si_id !== null);
      const occupiedDoctorIds = assignedApts.map(a => a.bac_si_id).filter(Boolean);
      const freeDoctors = scheduledDoctors.filter(doc => !occupiedDoctorIds.includes(doc.nguoi_dung_id));

      const unassignedAptsCount = slotApts.filter(a => a.bac_si_id === null).length;
      let slotFreeDoctorIds = freeDoctors.map(doc => doc.nguoi_dung_id);

      if (unassignedAptsCount > 0) {
        slotFreeDoctorIds = slotFreeDoctorIds.slice(unassignedAptsCount);
      }

      slotAvailability[slot] = slotFreeDoctorIds;

      if (slotFreeDoctorIds.length === 0) {
        bookedSlots.push(slot);
      }
    }

    return {
      bookedSlots,
      specialists: enrichedSpecialists,
      slotAvailability
    };
  }

  async updateAppointmentStatus(id: string, data: {
    trang_thai: string;
    bac_si_id?: string | null;
    chuyen_gia_id?: string | null;
    ky_thuat_vien_id?: string | null;
    ngay_gio_bat_dau?: string | null;
    ngay_gio_ket_thuc?: string | null;
    ghi_chu_noi_bo?: string | null;
    ly_do_huy?: string | null;
    phong_id?: string | number | null;
  }, actorRoleId?: number) {
    let finalStatus = data.trang_thai;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const apptRes = await client.query('SELECT * FROM cuoc_hen WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn');
      }
      const appt = apptRes.rows[0];

      // Lễ tân (role 2) cũng được phép gọi route admin này (authorizeRoles(2,4,5,6)) — áp đúng
      // luật chuyển trạng thái + gate thanh toán Đợt 2 của Lễ tân ở đây để route này không trở
      // thành đường lách qua các ràng buộc chỉ có ở /receptionist/appointments/:id/status.
      // Vai trò 4/5/6 không vào nhánh này — hành vi giữ nguyên 100%.
      if (actorRoleId === 2) {
        // "Khóa toàn bộ form" phải là bất biến ở SERVER, không chỉ ẩn nút trên UI — nếu không, gửi
        // thẳng đúng trang_thai hiện tại (không đổi) kèm bac_si_id/phong_id/ngay_gio_bat_dau/
        // ghi_chu_noi_bo mới vẫn lọt qua nhánh dưới và sửa được lịch đã check-in/hoàn thành/hủy.
        if (isReceptionistLockedStatus(appt.trang_thai)) {
          const err = new Error(
            'Không thể thay đổi lịch hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.'
          ) as any;
          err.statusCode = 403;
          throw err;
        }
        if (data.trang_thai !== appt.trang_thai) {
          const check = checkReceptionistTransition(appt.trang_thai, data.trang_thai, !!appt.nhan_su_id, appt.ngay_gio_bat_dau);
          if (!check.allowed) {
            const err = new Error(check.reason) as any;
            err.statusCode = 403;
            throw err;
          }
          if (data.trang_thai === 'da_checkin' || data.trang_thai === 'check_in') {
            await assertTraGopDot2PaidBeforeCheckin(client, id);
          }
        }
      }

      if (data.trang_thai === 'hoan_thanh') {
        if (appt.phac_do_dieu_tri_id) {
          const planInfo = await client.query(`
            SELECT gdv.loai_goi
            FROM phac_do_dieu_tri pd
            JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
            WHERE pd.id = $1
          `, [appt.phac_do_dieu_tri_id]);

          if (planInfo.rows.length > 0 && planInfo.rows[0].loai_goi === 'LIEU_TRINH') {
            const paymentCheck = await client.query(`
              SELECT hd.trang_thai, hd.hinh_thuc_thanh_toan_goi
              FROM hoa_don hd
              WHERE hd.phac_do_dieu_tri_id = $1
              LIMIT 1
            `, [appt.phac_do_dieu_tri_id]);

            if (paymentCheck.rows.length > 0) {
              const { trang_thai: invoiceStatus, hinh_thuc_thanh_toan_goi } = paymentCheck.rows[0];
              if (hinh_thuc_thanh_toan_goi !== 'tung_buoi') {
                if (!invoiceStatus || !['da_thanh_toan', 'dang_tra_gop'].includes(invoiceStatus)) {
                  throw new Error('Gói trị liệu liên kết chưa được thanh toán (đối với trả thẳng/trả góp). Không thể hoàn thành ca điều trị.');
                }
              }
            } else {
              throw new Error('Gói trị liệu liên kết chưa được đăng ký/thành lập hóa đơn.');
            }
          }
        }
      }

      // Handle Cancel / No-Show Logic
      if (['da_huy', 'khong_den', 'khach_khong_den'].includes(data.trang_thai)) {
        const isPackageSession = !!(appt.phac_do_dieu_tri_id && appt.so_thu_tu_buoi);
        let hinhThuc: HinhThucThanhToanGoi | null = null;

        if (isPackageSession) {
          const invoiceRes = await client.query(`
            SELECT hinh_thuc_thanh_toan_goi FROM hoa_don
            WHERE phac_do_dieu_tri_id = $1
            LIMIT 1
          `, [appt.phac_do_dieu_tri_id]);
          hinhThuc = invoiceRes.rows[0]?.hinh_thuc_thanh_toan_goi || null;
        }

        const outcome = resolveNoShowOutcome(data.trang_thai as NoShowAction, hinhThuc, isPackageSession);
        finalStatus = outcome.finalStatus;
        if (outcome.reputationPenalty > 0) {
          await client.query(
            'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - $1) WHERE id = $2',
            [outcome.reputationPenalty, appt.khach_hang_id]
          );
        }
      }

      const final_bac_si_id = data.bac_si_id !== undefined ? data.bac_si_id : (data.chuyen_gia_id !== undefined ? data.chuyen_gia_id : data.ky_thuat_vien_id);
      const isCancelledOrNoShow = ['da_huy', 'khong_den'].includes(finalStatus);
      // Chỉ HỦY mới giải phóng nhân sự/phòng — "không đến" vẫn giữ nguyên nhan_su_id/phong_id vì
      // nhân sự đã bố trí đúng giờ đó, khách không tới không có nghĩa nhân sự hết trách nhiệm với
      // ca này (khác hủy sớm, lúc đó slot thật sự trống lại). Giữ để Bác sĩ/KTV vẫn thấy đúng ca
      // "không đến" của mình trong thống kê, thay vì mất dấu vết ai từng phụ trách ca đó.
      const shouldReleaseAssignment = finalStatus === 'da_huy';

      if (!isCancelledOrNoShow) {
        const ldRes = await client.query('SELECT ngay_gio_bat_dau, ngay_gio_ket_thuc, nhan_su_id, goi_dich_vu_id, khach_hang_id, phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [id]);
        if (ldRes.rows.length > 0) {
          const aptTime = ldRes.rows[0];
          const check_bac_si_id = final_bac_si_id !== undefined ? final_bac_si_id : aptTime.nhan_su_id;
          const start = data.ngay_gio_bat_dau ? new Date(data.ngay_gio_bat_dau).toISOString() : new Date(aptTime.ngay_gio_bat_dau).toISOString();
          const origDuration = new Date(aptTime.ngay_gio_ket_thuc).getTime() - new Date(aptTime.ngay_gio_bat_dau).getTime();
          const end = data.ngay_gio_ket_thuc ? new Date(data.ngay_gio_ket_thuc).toISOString() : new Date(new Date(start).getTime() + origDuration).toISOString();

          if (aptTime.khach_hang_id) {
            const customerOverlap = await this.checkCustomerOverlap(aptTime.khach_hang_id, null, start, end, id);
            if (customerOverlap) {
              const err: any = new Error('Khách hàng đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này.');
              err.constraint = 'no_overlap_khach_hang';
              throw err;
            }
          }

          if (check_bac_si_id) {
            const doctorOverlap = await this.checkDoctorOverlap(check_bac_si_id, start, end, id);
            if (doctorOverlap) {
              const err: any = new Error('Bác sĩ đã có lịch trong khung giờ này.');
              err.constraint = 'no_overlap_ktv';
              throw err;
            }
          }
        }
      }

      const updates = ['trang_thai = $1'];
      const values: any[] = [finalStatus];
      let paramIndex = 2;

      if (final_bac_si_id !== undefined && !isCancelledOrNoShow) {
        updates.push(`nhan_su_id = $${paramIndex}`);
        values.push(final_bac_si_id ? parseInt(final_bac_si_id, 10) : null);
        paramIndex++;
      } else if (shouldReleaseAssignment) {
        updates.push(`nhan_su_id = NULL`);
      }

      if (data.ngay_gio_bat_dau !== undefined) {
        updates.push(`ngay_gio_bat_dau = $${paramIndex}`);
        values.push(data.ngay_gio_bat_dau);
        paramIndex++;
      }
      if (data.ngay_gio_ket_thuc !== undefined) {
        updates.push(`ngay_gio_ket_thuc = $${paramIndex}`);
        values.push(data.ngay_gio_ket_thuc);
        paramIndex++;
      }

      if (data.ghi_chu_noi_bo !== undefined) {
        updates.push(`ghi_chu_noi_bo = $${paramIndex}`);
        values.push(data.ghi_chu_noi_bo);
        paramIndex++;
      }

      if (data.ly_do_huy !== undefined) {
        updates.push(`ly_do_huy = $${paramIndex}`);
        values.push(data.ly_do_huy);
        paramIndex++;
      }

      if (data.phong_id !== undefined && !isCancelledOrNoShow) {
        updates.push(`phong_id = $${paramIndex}`);
        values.push(data.phong_id ? parseInt(String(data.phong_id), 10) : null);
        paramIndex++;
      } else if (shouldReleaseAssignment) {
        updates.push(`phong_id = NULL`);
      }

      if (finalStatus === 'da_huy') {
        updates.push(`thoi_gian_huy = NOW()`);
      }

      values.push(id);
      const query = `
        UPDATE cuoc_hen 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      const { rows } = await client.query(query, values);

      if (rows.length > 0) {
        // Buổi bị "không đến" cũng có thể tiêu thụ 1 buổi của gói (Nhóm B) — phải gọi lại cả khi
        // finalStatus='khong_den', không chỉ hoan_thanh. Formula bên trong tự quyết đếm hay không.
        if (['hoan_thanh', 'khong_den', 'khach_khong_den'].includes(finalStatus) && rows[0].phac_do_dieu_tri_id) {
          await this.updateCompletedSessionsCount(rows[0].phac_do_dieu_tri_id);
        }
      }

      await client.query('COMMIT');
      return rows[0] || null;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }


  async updateCompletedSessionsCount(phac_do_dieu_tri_id: string) {
    // Đếm số buổi đã TIÊU THỤ của phác đồ: hoan_thanh luôn tính; buổi "không đến" CHỈ tính khi gói
    // là Nhóm B (trả thẳng/trả góp — khách đã trả trước nên mất buổi), còn Nhóm A không đến thì
    // KHÔNG mất buổi. Hủy (da_huy/da_huy_phat) không bao giờ tính. Giữ 'khach_khong_den_phat' trong
    // danh sách để dữ liệu lịch sử (nếu có) vẫn được diễn giải nhất quán.
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM cuoc_hen
       WHERE phac_do_dieu_tri_id = $1
         AND loai = 'DIEU_TRI'
         AND (
           trang_thai = 'hoan_thanh'
           OR (
             trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat')
             AND (SELECT hinh_thuc_thanh_toan_goi FROM hoa_don WHERE phac_do_dieu_tri_id = $1 LIMIT 1)
                 IN ('tra_thang', 'tra_gop')
           )
         )`,
      [phac_do_dieu_tri_id]
    );
    const completedCount = countRes.rows[0].count || 0;

    const pdRes = await pool.query('SELECT tong_so_buoi, trang_thai FROM phac_do_dieu_tri WHERE id = $1', [phac_do_dieu_tri_id]);
    if (pdRes.rows.length > 0) {
      const { tong_so_buoi, trang_thai } = pdRes.rows[0];
      const statusToSet = completedCount >= tong_so_buoi ? 'hoan_thanh' : (trang_thai === 'hoan_thanh' ? 'dang_dieu_tri' : trang_thai);
      await pool.query(
        'UPDATE phac_do_dieu_tri SET so_buoi_da_dung = $1, trang_thai = $2 WHERE id = $3',
        [completedCount, statusToSet, phac_do_dieu_tri_id]
      );
    }
  }

  async getCustomerAppointments(customer_id: string) {
    const query = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ch.trang_thai, 
        CASE 
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.ho_ten AS ten_khach_hang, 
        COALESCE(ch.so_dien_thoai, kh.so_dien_thoai) AS so_dien_thoai,
        kh.id as khach_hang_id,
        kh.diem_uy_tin as diem_uy_tin,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        pddt.tong_so_buoi as tong_so_buoi_goi,
        gdv.ten_goi as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        nd_ktv.anh_dai_dien AS anh_bac_si,
        ch.nhan_su_id as bac_si_id,
        ch.phong_id as phong_id,
        p.ten_phong as ten_phong,
        nk.chan_doan,
        nk.chong_chi_dinh,
        ch.ghi_chu_khach_hang as ghi_chu,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.ly_do_huy as ly_do_huy,
        COALESCE(
          (
            SELECT created_at
            FROM otp_codes
            WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
            ORDER BY created_at DESC 
            LIMIT 1
          ), 
          ch.ngay_gio_bat_dau
        ) as thoi_gian_tao,
        (
          SELECT expires_at 
          FROM otp_codes 
          WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
          ORDER BY expires_at DESC 
          LIMIT 1
        ) as han_xac_nhan,
        CASE 
          WHEN dg_n.id IS NULL THEN NULL
          WHEN gdv.loai_goi = 'LIEU_TRINH' AND pddt.trang_thai NOT IN ('hoan_thanh', 'huy_ngang') THEN dg_n.id
          WHEN dg_g.id IS NOT NULL THEN dg_g.id
          ELSE NULL
        END as rating_id,
        COALESCE(dg_g.so_sao, dg_n.so_sao) as rating_stars,
        COALESCE(dg_g.nhan_xet, dg_n.nhan_xet) as rating_comment,
        dg_g.id as rating_service_id,
        dg_g.so_sao as rating_service_stars,
        dg_g.nhan_xet as rating_service_comment,
        dg_n.id as rating_staff_id,
        dg_n.so_sao as rating_staff_stars,
        dg_n.nhan_xet as rating_staff_comment,
        gdv.loai_goi,
        pddt.trang_thai as phac_do_status
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      LEFT JOIN danh_gia_goi_dich_vu dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id)
      LEFT JOIN danh_gia_nhan_su dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id)
      WHERE kh.id = $1
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [customer_id]);
    return rows;
  }

  async countCustomerCancellationsThisWeek(customer_id: string): Promise<number> {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60000);
    const day = vnNow.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(vnNow);
    monday.setUTCDate(vnNow.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const startOfWeekUTC = new Date(monday.getTime() - 7 * 60 * 60000).toISOString();
    const endOfWeekUTC = new Date(sunday.getTime() - 7 * 60 * 60000).toISOString();

    const query = `
      SELECT COUNT(*)::int as count FROM cuoc_hen
      WHERE khach_hang_id = $1::uuid
        AND trang_thai = 'da_huy'
        AND thoi_gian_huy >= $2::timestamptz
        AND thoi_gian_huy <= $3::timestamptz
    `;
    const { rows } = await pool.query(query, [customer_id, startOfWeekUTC, endOfWeekUTC]);
    return rows[0].count || 0;
  }

  async cancelCustomerAppointment(id: string, customer_id: string, ly_do_huy: string) {
    const checkQuery = 'SELECT * FROM cuoc_hen WHERE id = $1 AND khach_hang_id = $2';
    const checkRes = await pool.query(checkQuery, [id, customer_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }
    const appt = checkRes.rows[0];

    // Khách CHỈ được tự hủy khi còn ≥ 8 tiếng trước giờ hẹn. Dưới mốc này (hoặc đã qua giờ) phải
    // gọi Lễ tân/Admin hủy giúp (2 vai trò đó không đi qua gate này, hủy được bất kỳ lúc nào).
    // ngay_gio_bat_dau là TIMESTAMPTZ (OID 1184) — node-postgres parse đúng UTC instant, so bằng
    // Date thuần an toàn, không dính custom parser OID 1114 ở config/db.ts.
    const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
    if (new Date(appt.ngay_gio_bat_dau).getTime() - Date.now() < EIGHT_HOURS_MS) {
      const err: any = new Error('Không thể tự hủy lịch trong vòng 8 tiếng trước giờ hẹn. Vui lòng gọi Hotline để Lễ tân hỗ trợ hủy/đổi lịch.');
      err.statusCode = 400;
      throw err;
    }

    const isPackageSession = !!(appt.phac_do_dieu_tri_id && appt.so_thu_tu_buoi);
    let hinhThuc: HinhThucThanhToanGoi | null = null;

    if (isPackageSession) {
      const invoiceRes = await pool.query(`
        SELECT hinh_thuc_thanh_toan_goi FROM hoa_don
        WHERE phac_do_dieu_tri_id = $1
        LIMIT 1
      `, [appt.phac_do_dieu_tri_id]);
      hinhThuc = invoiceRes.rows[0]?.hinh_thuc_thanh_toan_goi || null;
    }

    const outcome = resolveNoShowOutcome('da_huy', hinhThuc, isPackageSession);
    const finalStatus = outcome.finalStatus;
    if (outcome.reputationPenalty > 0) {
      await pool.query(
        'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - $1) WHERE id = $2',
        [outcome.reputationPenalty, customer_id]
      );
    }

    const query = `
      UPDATE cuoc_hen
      SET trang_thai = $1, ly_do_huy = $2, thoi_gian_huy = NOW(), nhan_su_id = NULL, phong_id = NULL
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await pool.query(query, [finalStatus, ly_do_huy, id]);

    // Hủy không bao giờ đổi so_buoi_da_dung ở quy tắc mới (action luôn là 'da_huy') — không gọi
    // updateCompletedSessionsCount nữa.
    return rows[0];
  }

  async cancelBreakTimeAppointments(): Promise<{ cancelled_count: number }> {
    return { cancelled_count: 0 };
  }

  async checkDoctorOverlap(bac_si_id: string, start: string, end: string, excludeId?: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM cuoc_hen
      WHERE nhan_su_id = $1
        AND trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
        AND ($4::uuid IS NULL OR id != $4::uuid)
        AND ngay_gio_bat_dau < $3::timestamptz
        AND ngay_gio_ket_thuc > $2::timestamptz
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [bac_si_id, start, end, excludeId || null]);
    return rows.length > 0;
  }

  async checkCustomerHasClinicalExamOnDate(khach_hang_id: string | null, so_dien_thoai: string | null, dateStr: string, excludeSessionId?: string): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;

    let effectivePhone: string | null = so_dien_thoai;
    if (khach_hang_id && so_dien_thoai && so_dien_thoai.trim()) {
      const otherRes = await pool.query(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
        [so_dien_thoai.trim(), khach_hang_id]
      );
      if (otherRes.rows.length > 0) {
        effectivePhone = null;
      }
    }

    const apptQuery = `
      SELECT COUNT(*)::int as count FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE (
        ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
        OR ($2::text IS NOT NULL AND (ch.so_dien_thoai = $2::text OR kh.so_dien_thoai = $2::text))
      )
      AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
      AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3::date
    `;
    const apptRes = await pool.query(apptQuery, [
      khach_hang_id || null,
      effectivePhone || null,
      dateStr
    ]);
    const apptCount = apptRes.rows[0].count || 0;

    const holdQuery = `
      SELECT COUNT(*)::int as count FROM tam_giu_cho t
      LEFT JOIN khach_hang kh ON t.khach_hang_id = kh.id
      WHERE (
        ($1::uuid IS NOT NULL AND t.khach_hang_id = $1::uuid)
        OR ($2::text IS NOT NULL AND (t.so_dien_thoai = $2::text OR kh.so_dien_thoai = $2::text))
      )
      AND t.thoi_gian_het_han > NOW()
      AND ($4::varchar IS NULL OR t.session_id != $4::varchar)
      AND DATE(t.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3::date
    `;
    const holdRes = await pool.query(holdQuery, [
      khach_hang_id || null,
      effectivePhone || null,
      dateStr,
      excludeSessionId || null
    ]);
    const holdCount = holdRes.rows[0].count || 0;

    return (apptCount + holdCount) >= 3;
  }

  async checkPhoneTakenByOther(phone: string, excludeUserId: string): Promise<boolean> {
    if (!phone || !excludeUserId) return false;
    const res = await pool.query(
      'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
      [phone.trim(), excludeUserId]
    );
    return res.rows.length > 0;
  }

  async checkCustomerHasClinicalExamOnDateByUserId(userId: string | null, phone: string | null, dateStr: string, excludeSessionId?: string): Promise<boolean> {
    let khach_hang_id: string | null = null;
    if (userId) {
      const khRes = await pool.query('SELECT id FROM khach_hang WHERE id = $1::uuid', [userId]);
      if (khRes.rows.length > 0) {
        khach_hang_id = khRes.rows[0].id;
      }
    }
    return this.checkCustomerHasClinicalExamOnDate(khach_hang_id, phone, dateStr, excludeSessionId);
  }

  async checkCustomerOverlap(khach_hang_id: string | null, so_dien_thoai: string | null, start: string, end: string, excludeId?: string): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;

    const query = `
      SELECT 1 FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE (
        ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
        OR ($2::text IS NOT NULL AND (ch.so_dien_thoai = $2::text OR kh.so_dien_thoai = $2::text))
      )
        -- KHÔNG loại 'hoan_thanh' — 1 buổi đã hoàn thành vẫn thực sự chiếm đúng khung giờ đó của
        -- khách hàng (đã xác nhận qua data thật: 2 cuoc_hen của cùng khách trùng khít giờ, 1 cái
        -- 'hoan_thanh' lọt qua check này vì bị loại trừ nhầm, cho phép đặt chồng lịch).
        AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
        AND ($3::uuid IS NULL OR ch.id != $3::uuid)
        AND ch.ngay_gio_bat_dau < $5::timestamptz
        AND ch.ngay_gio_ket_thuc > $4::timestamptz
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [
      khach_hang_id || null,
      so_dien_thoai || null,
      excludeId || null,
      start,
      end
    ]);
    return rows.length > 0;
  }



  async getPublicAppointmentById(id: string) {
    const query = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ch.trang_thai,
        kh.ho_ten as ho_ten_khach, 
        kh.so_dien_thoai,
        kh.gioi_tinh as gioi_tinh_khach,
        kh.email,
        gdv.ten_goi as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ch.nhan_su_id AS ky_thuat_vien_id,
        ch.phong_id as phong_id,
        p.ten_phong as ten_phong,
        nk.chan_doan,
        nk.chong_chi_dinh,
        ch.ghi_chu_khach_hang as ghi_chu_dat_lich,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.ly_do_huy as ly_do_huy,
        ch.thoi_gian_huy,
        ch.ngay_gio_bat_dau as thoi_gian_tao,
        (SELECT expires_at FROM otp_codes WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) ORDER BY expires_at DESC LIMIT 1) as han_xac_nhan
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      WHERE ch.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  async getCustomerMedicalRecord(customer_id: string) {
    const custRes = await pool.query(
      'SELECT ho_ten, so_dien_thoai, email, diem_uy_tin FROM khach_hang WHERE id = $1',
      [customer_id]
    );
    const khach_hang = custRes.rows[0] || null;

    if (!khach_hang) return null;

    // 1. Lịch sử khám lâm sàng
    const examQuery = `
      SELECT 
        ch.id as cuoc_hen_id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau as ngay_kham,
        'KHAM' as loai_ho_so,
        ch.ghi_chu_khach_hang as ly_do_kham,
        ch.anh_dinh_kem_url,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nd.ho_ten as ten_bac_si,
        nd.anh_dai_dien as anh_bac_si,
        nd.vai_tro_id as vai_tro_bac_si,
        p.ten_phong as ten_phong,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        goi_kn.ten_goi as khuyen_nghi_goi,
        cd.phac_do_dieu_tri_id as khuyen_nghi_phac_do_id,
        CASE WHEN cd.id IS NOT NULL AND cd.phac_do_dieu_tri_id IS NULL
             THEN ch.ngay_gio_bat_dau + $2 * INTERVAL '1 day'
             ELSE NULL END as khuyen_nghi_han_kich_hoat
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu goi_kn ON cd.goi_dich_vu_id = goi_kn.id
      -- Chỉ khớp hóa đơn khám độc lập (phac_do_dieu_tri_id IS NULL) — nếu không lọc, 1 buổi khám
      -- dẫn tới mua gói sẽ khớp CẢ hóa đơn khám riêng LẪN hóa đơn gói (cùng cuoc_hen_id), gây trùng
      -- lặp lượt khám 2 lần trên hồ sơ khách hàng.
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id AND hd.phac_do_dieu_tri_id IS NULL
      WHERE ch.khach_hang_id = $1
        AND ch.loai IN ('KHAM', 'KHAM_MOI')
        AND ch.trang_thai = 'hoan_thanh'
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const examRes = await pool.query(examQuery, [customer_id, PACKAGE_ACTIVATION_WINDOW_DAYS]);

    // 2. Gói liệu trình
    const packageQuery = `
      SELECT 
        pd.id as phac_do_id,
        pd.goi_dich_vu_id,
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_phac_do,
        pd.ngay_kich_hoat,
        'GOI_LIEU_TRINH' as loai_ho_so,
        g.ten_goi as ten_dich_vu,
        pd.tong_so_buoi,
        pd.so_buoi_da_dung,
        pd.trang_thai as trang_thai_phac_do,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        hd.hinh_thuc_thanh_toan_goi
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST;
    `;
    const packageRes = await pool.query(packageQuery, [customer_id]);

    // 3. Các buổi thuộc gói
    const sessionQuery = `
      SELECT 
        ch.id as cuoc_hen_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        ch.ngay_gio_bat_dau,
        ch.trang_thai,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nk.vas_truoc,
        nk.vas_sau,
        nd.ho_ten as ten_bac_si,
        nd.anh_dai_dien as anh_ky_thuat_vien,
        p.ten_phong,
        COALESCE(dg_g.so_sao, dg_n.so_sao) as danh_gia_sao,
        COALESCE(dg_g.nhan_xet, dg_n.nhan_xet) as danh_gia_nhan_xet,
        COALESCE(dg_g.phan_hoi_nhan_xet, dg_n.phan_hoi_nhan_xet) as phan_hoi_nhan_xet
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN danh_gia_goi_dich_vu dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id)
      LEFT JOIN danh_gia_nhan_su dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id)
      WHERE ch.khach_hang_id = $1
        AND ch.phac_do_dieu_tri_id IS NOT NULL
      ORDER BY ch.so_thu_tu_buoi ASC;
    `;
    const sessionRes = await pool.query(sessionQuery, [customer_id]);

    // Group sessions by package
    const sessionsByPackage: Record<string, any[]> = {};
    for (const session of sessionRes.rows) {
      const pid = session.phac_do_dieu_tri_id;
      if (!sessionsByPackage[pid]) {
        sessionsByPackage[pid] = [];
      }
      sessionsByPackage[pid].push(session);
    }

    // Map packages to include their sessions
    const goi_dieu_tri = packageRes.rows.map((pkg: any) => ({
      ...pkg,
      buoi_dieu_tri: sessionsByPackage[pkg.phac_do_id] || []
    }));

    // 4. Dịch vụ lẻ
    const singleQuery = `
      SELECT 
        ch.id as cuoc_hen_id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau as ngay_dieu_tri,
        'DICH_VU_LE' as loai_ho_so,
        g.ten_goi as ten_dich_vu,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nk.vas_truoc,
        nk.vas_sau,
        nd.ho_ten as ten_bac_si,
        p.ten_phong,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        COALESCE(dg_g.so_sao, dg_n.so_sao) as danh_gia_sao,
        COALESCE(dg_g.nhan_xet, dg_n.nhan_xet) as danh_gia_nhan_xet,
        COALESCE(dg_g.phan_hoi_nhan_xet, dg_n.phan_hoi_nhan_xet) as phan_hoi_nhan_xet
      FROM cuoc_hen ch
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id
      LEFT JOIN danh_gia_goi_dich_vu dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id)
      LEFT JOIN danh_gia_nhan_su dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id)
      WHERE ch.khach_hang_id = $1
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.loai != 'KHAM'
        AND ch.loai != 'KHAM_MOI'
        AND (ch.trang_thai = 'hoan_thanh' OR hd.id IS NOT NULL)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const singleRes = await pool.query(singleQuery, [customer_id]);

    return {
      khach_hang,
      lich_su_kham: examRes.rows,
      goi_dieu_tri,
      dieu_tri_le: singleRes.rows
    };
  }

  async getCustomerTreatmentSessions(customer_id: string) {
    const query = `
      SELECT 
        ch.id,
        ch.so_thu_tu_buoi,
        ch.ngay_gio_bat_dau as thoi_gian_bat_dau,
        ch.ngay_gio_ket_thuc as thoi_gian_ket_thuc,
        ch.trang_thai,
        nk.chan_doan as ai_tom_tat_ngan,
        nk.vas_truoc as danh_gia_truoc_buoi,
        nk.vas_sau as danh_gia_sau_buoi,
        nk.ghi_chu as danh_gia_hieu_qua,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        dv.ten_dich_vu,
        g.ten_goi
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN dich_vu dv ON ch.dich_vu_id = dv.id
      WHERE ch.khach_hang_id = $1 AND ch.loai = 'DIEU_TRI'
      ORDER BY ch.so_thu_tu_buoi DESC, ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [customer_id]);
    return rows;
  }

  // Toàn bộ hóa đơn của khách hàng — mirror đúng admin.repository.ts::getInvoices() (cùng field
  // shape để frontend tái dùng đúng công thức hoàn tiền ở billing.ts), chỉ thêm điều kiện lọc theo
  // đúng khách hàng đang đăng nhập. Dùng cho trang "Hóa đơn của tôi" — xem toàn bộ hóa đơn +
  // xem trước (view-only) công thức hoàn tiền của gói liệu trình, không có quyền thao tác.
  async getCustomerInvoices(customer_id: string) {
    const { rows } = await pool.query(`
      SELECT
        hd.id,
        hd.khach_hang_id,
        hd.phac_do_dieu_tri_id,
        hd.cuoc_hen_id,
        hd.tong_tien_goc,
        hd.hinh_thuc_thanh_toan_goi,
        hd.ti_le_giam_gia_goi,
        hd.voucher_id,
        hd.so_tien_giam_voucher,
        v.ma_code as ma_voucher_ap_dung,
        v.ten_chien_dich as ten_voucher_ap_dung,
        hd.tong_tien_phai_tra as tong_tien_thanh_toan,
        hd.so_tien_da_tra as da_thanh_toan,
        hd.trang_thai,
        hd.ghi_chu,
        hd.ngay_tao,
        ch.ngay_gio_bat_dau as ngay_kham,
        ch.ngay_gio_ket_thuc as ngay_kham_ket_thuc,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai,
        (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = pd.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND hd.hinh_thuc_thanh_toan_goi IN ('tra_thang', 'tra_gop'))
            )
            AND loai = 'DIEU_TRI'
        ) as so_buoi_da_dung,
        pd.tong_so_buoi,
        pd.han_su_dung,
        pd.trang_thai as trang_thai_phac_do,
        COALESCE(gdv.loai_goi, dv.loai_goi) as loai_goi,
        COALESCE(gdv.ten_goi, dv.ten_goi, 'Phí khám lâm sàng & Lượng giá') as ten_dich_vu,
        CASE
          WHEN hd.hinh_thuc_thanh_toan_goi = 'tung_buoi' AND EXISTS (
            SELECT 1 FROM hoa_don exam_hd
            WHERE exam_hd.cuoc_hen_id = hd.cuoc_hen_id
              AND exam_hd.phac_do_dieu_tri_id IS NULL
              AND exam_hd.trang_thai = 'da_thanh_toan'
          ) THEN 0
          WHEN hd.phac_do_dieu_tri_id IS NULL AND hd.tong_tien_goc > COALESCE(NULLIF(hd.phi_kham_ap_dung, 0), dv.don_gia, 0) THEN 0
          WHEN hd.cuoc_hen_id IS NOT NULL THEN COALESCE(NULLIF(hd.phi_kham_ap_dung, 0), dv.don_gia, 0)
          ELSE 0
        END as chi_phi_kham,
        (
          SELECT 'HD-' || UPPER(SUBSTRING(sep_hd.id::text FROM 1 FOR 6))
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
          LIMIT 1
        ) as ma_hoa_don_kham_rieng,
        (
          SELECT sep_hd.ngay_tao
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
          LIMIT 1
        ) as ngay_thanh_toan_kham_rieng
      FROM hoa_don hd
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      LEFT JOIN phac_do_dieu_tri pd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN cuoc_hen ch ON hd.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN khuyen_mai_voucher v ON hd.voucher_id = v.id
      WHERE hd.khach_hang_id = $1::uuid
      ORDER BY hd.ngay_tao DESC
    `, [customer_id]);
    return rows;
  }

  // Lịch sử giao dịch (thanh toán + hoàn tiền) của toàn bộ hóa đơn thuộc khách hàng này — mirror
  // admin.repository.ts::getPayments(), lọc theo đúng chủ hóa đơn.
  async getCustomerPayments(customer_id: string) {
    const { rows } = await pool.query(`
      SELECT
        gt.id, gt.hoa_don_id, gt.so_tien, gt.loai_giao_dich, gt.phuong_thuc, gt.ma_tham_chieu,
        gt.ma_tham_chieu as ma_giao_dich,
        gt.ngay_giao_dich as thoi_gian_giao_dich,
        gt.chi_tiet,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don
      FROM giao_dich_thanh_toan gt
      JOIN hoa_don hd ON gt.hoa_don_id = hd.id
      WHERE hd.khach_hang_id = $1::uuid
      ORDER BY gt.ngay_giao_dich DESC
    `, [customer_id]);
    return rows;
  }

  async checkCustomerWeeklyClinicalExamLimit(customer_id: string | number | null | undefined, so_dien_thoai: string | null, ngay_gio_bat_dau: string | Date): Promise<boolean> {
    const startLoc = new Date(new Date(ngay_gio_bat_dau).getTime() + 7 * 60 * 60000);
    const day = startLoc.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(startLoc);
    monday.setUTCDate(startLoc.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const startOfWeekUTC = new Date(monday.getTime() - 7 * 60 * 60000).toISOString();
    const endOfWeekUTC = new Date(sunday.getTime() - 7 * 60 * 60000).toISOString();

    let conditions = [];
    let params = [];

    if (customer_id) {
      conditions.push('ch.khach_hang_id = $1');
      params.push(customer_id);
    } else if (so_dien_thoai) {
      conditions.push('kh.so_dien_thoai = $1');
      params.push(so_dien_thoai);
    } else {
      return false;
    }

    const index1 = params.length + 1;
    const index2 = params.length + 2;
    params.push(startOfWeekUTC, endOfWeekUTC);

    const query = `
      SELECT ch.id 
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE (${conditions.join(' OR ')})
        AND ch.loai = 'KHAM'
        AND ch.trang_thai NOT IN ('da_huy', 'huy')
        AND ch.ngay_gio_bat_dau >= $${index1}
        AND ch.ngay_gio_bat_dau <= $${index2}
    `;
    const { rows } = await pool.query(query, params);
    return rows.length >= 2;
  }

  async checkGlobalSlotCapacity(
    dich_vu_id: string,
    start: string,
    end: string,
    excludeId?: string
  ): Promise<void> {
    const dvRes = await pool.query('SELECT loai_goi, ten_goi FROM goi_dich_vu WHERE id = $1', [dich_vu_id]);
    if (dvRes.rows.length === 0) return;
    const { loai_goi } = dvRes.rows[0];
    const isExam = loai_goi === 'KHAM';
    const roleId = isExam ? 4 : 3;

    const startVn = new Date(new Date(start).getTime() + 7 * 60 * 60000);
    const dateStr = startVn.toISOString().substring(0, 10);
    const startSlotTime = startVn.toISOString().substring(11, 16);

    const endVn = new Date(new Date(end).getTime() + 7 * 60 * 60000);
    const endSlotTime = endVn.toISOString().substring(11, 16);

    const staffRes = await pool.query(
      `SELECT COUNT(DISTINCT lt.nhan_su_id)::int as total_staff
       FROM lich_truc_nhan_su lt
       JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
       WHERE nd.vai_tro_id = $1
         AND lt.trang_thai = 'hoat_dong'
         AND lt.ngay_truc = $2::date
         AND lt.gio_bat_dau::time <= $3::time
         AND lt.gio_ket_thuc::time >= $4::time`,
      [roleId, dateStr, startSlotTime, endSlotTime]
    );
    const totalStaff = staffRes.rows[0].total_staff;

    if (totalStaff <= 0) {
      throw new Error(`Khung giờ này hiện tại không có nhân sự trực phù hợp.`);
    }

    const countQuery = `
      SELECT COUNT(*)::int as count 
      FROM cuoc_hen
      WHERE trang_thai NOT IN ('huy', 'khong_den')
        AND ($3::uuid IS NULL OR id != $3::uuid)
        AND ngay_gio_bat_dau < $2::timestamptz
        AND ngay_gio_ket_thuc > $1::timestamptz
        AND loai = $4
    `;

    const countRes = await pool.query(countQuery, [
      start,
      end,
      excludeId || null,
      isExam ? 'KHAM' : 'DIEU_TRI'
    ]);
    const activeBookingsCount = countRes.rows[0].count;

    if (activeBookingsCount >= totalStaff) {
      const typeLabel = isExam ? 'khám lâm sàng' : 'trị liệu';
      throw new Error(
        `Khung giờ này đã đạt giới hạn tối đa ${totalStaff} ca ${typeLabel} theo năng lực nhân sự trực.`
      );
    }
  }

  async createTempHold(data: { session_id: string, ngay_gio_bat_dau: string, goi_dich_vu_id: string, nhan_su_id: number | null, khach_hang_id?: string | null, so_dien_thoai?: string | null }) {
    await pool.query("DELETE FROM tam_giu_cho WHERE thoi_gian_het_han <= NOW()");

    let isExamService = false;
    let duration = 30; // default duration
    if (data.goi_dich_vu_id) {
      const dvRes = await pool.query("SELECT loai_goi, thoi_luong_phut FROM goi_dich_vu WHERE id = $1::uuid", [data.goi_dich_vu_id]);
      if (dvRes.rows.length > 0) {
        isExamService = dvRes.rows[0].loai_goi === 'KHAM';
        duration = Number(dvRes.rows[0].thoi_luong_phut) || 30;
      }
    }

    const ngay_gio_ket_thuc = new Date(new Date(data.ngay_gio_bat_dau).getTime() + duration * 60000).toISOString();
    const thoi_gian_het_han = new Date(Date.now() + 5 * 60000).toISOString(); // 5 minutes hold

    const upsertQuery = `
      INSERT INTO tam_giu_cho (session_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, nhan_su_id, goi_dich_vu_id, thoi_gian_het_han, khach_hang_id, so_dien_thoai)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (session_id) DO UPDATE
      SET ngay_gio_bat_dau = EXCLUDED.ngay_gio_bat_dau,
          ngay_gio_ket_thuc = EXCLUDED.ngay_gio_ket_thuc,
          nhan_su_id = EXCLUDED.nhan_su_id,
          goi_dich_vu_id = EXCLUDED.goi_dich_vu_id,
          thoi_gian_het_han = EXCLUDED.thoi_gian_het_han,
          khach_hang_id = COALESCE(EXCLUDED.khach_hang_id, tam_giu_cho.khach_hang_id),
          so_dien_thoai = COALESCE(EXCLUDED.so_dien_thoai, tam_giu_cho.so_dien_thoai),
          thoi_gian_tao = NOW()
      RETURNING *
    `;

    const { rows } = await pool.query(upsertQuery, [
      data.session_id,
      data.ngay_gio_bat_dau,
      ngay_gio_ket_thuc,
      data.nhan_su_id,
      data.goi_dich_vu_id,
      thoi_gian_het_han,
      data.khach_hang_id || null,
      data.so_dien_thoai || null
    ]);

    return rows[0];
  }

  async releaseTempHold(session_id: string) {
    await pool.query("DELETE FROM tam_giu_cho WHERE session_id = $1", [session_id]);
  }
}

export default new AppointmentRepository();

