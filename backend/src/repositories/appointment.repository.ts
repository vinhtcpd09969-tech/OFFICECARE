import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { getMinPaymentRequired, resolveNoShowOutcome } from '../domain/billing';
import { HinhThucThanhToanGoi, NoShowAction } from '../domain/types';

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
        kh.so_dien_thoai AS so_dien_thoai,
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
        ch.ghi_chu_noi_bo as ly_do_huy
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

    if (!final_khach_hang_id && (email || so_dien_thoai)) {
      let existCust = null;
      if (email) {
        const res = await pool.query('SELECT id FROM khach_hang WHERE email = $1', [email]);
        if (res.rows.length > 0) existCust = res.rows[0];
      }
      if (!existCust && so_dien_thoai) {
        const res = await pool.query('SELECT id FROM khach_hang WHERE so_dien_thoai = $1', [so_dien_thoai]);
        if (res.rows.length > 0) existCust = res.rows[0];
      }

      if (existCust) {
        final_khach_hang_id = existCust.id;
      } else {
        const targetEmail = email || `${so_dien_thoai || 'guest_' + Math.floor(Math.random() * 100000)}@officecare.placeholder`;
        const defaultPassword = '123456';
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(defaultPassword, salt);

        const { rows: newKh } = await pool.query(`
          INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, mat_khau_hash, gioi_tinh)
          VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [ho_ten_khach || 'Khách vãng lai', so_dien_thoai || null, targetEmail, hash, gioi_tinh_khach || 'khac']);
        final_khach_hang_id = newKh[0].id;
      }
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
      INSERT INTO cuoc_hen (khach_hang_id, nhan_su_id, goi_dich_vu_id, phac_do_dieu_tri_id, so_thu_tu_buoi, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, ghi_chu_khach_hang, phong_id, nguoi_tao_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      data.nguoi_tao_id || null
    ]);

    return rows[0];
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const goi_dich_vu_id = data.goi_dich_vu_id || data.dich_vu_id;
    const { khach_hang_id, nhan_su_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ly_do_kham, trang_thai, trieu_chung } = data;

    const startLocal = new Date(new Date(ngay_gio_bat_dau).getTime() + 7 * 60 * 60000);
    const dateStr = `${startLocal.getUTCFullYear()}-${String(startLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(startLocal.getUTCDate()).padStart(2, '0')}`;
    const slotTimeStr = `${String(startLocal.getUTCHours()).padStart(2, '0')}:${String(startLocal.getUTCMinutes()).padStart(2, '0')}`;

    const bookedSlotsData = await this.getBookedSlots(dateStr, undefined, undefined, 30, goi_dich_vu_id, data.temp_hold_id);
    const bookedSlotsList = Array.isArray(bookedSlotsData) ? bookedSlotsData : (bookedSlotsData.bookedSlots || []);
    if (bookedSlotsList.includes(slotTimeStr)) {
      throw new Error('Khung giờ này đã hết chỗ, vui lòng chọn khung giờ khác.');
    }

    const final_khach_hang_id_input = khach_hang_id || null;

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
          INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, mat_khau_hash, gioi_tinh)
          VALUES ($1, $2, $3, $4, $5) RETURNING id
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

    const query = `
      INSERT INTO cuoc_hen (khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, ghi_chu_khach_hang, phong_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      goi_dich_vu_id || null,
      final_nhan_su_id,
      ngay_gio_bat_dau,
      ngay_gio_ket_thuc,
      isExamService ? 'KHAM' : 'DICH_VU_LE',
      trang_thai || 'chua_xac_nhan',
      trieu_chung || ly_do_kham || null,
      resolvedPhongId
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
      SELECT cg.id AS doctor_id, cg.nguoi_dung_id, nd.ho_ten
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
        AND ch.trang_thai NOT IN ('da_huy', 'huy', 'hoan_thanh', 'khong_den')
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

    const timeSlots = [
      ...generateSlots(8, 0, 12, 0),
      ...generateSlots(12, 0, 18, 0),
      ...generateSlots(18, 0, 20, 0)
    ];

    const scheduledSpecialistsForDay = doctors.filter(doc =>
      schedules.some(s => s.nguoi_dung_id === doc.nguoi_dung_id)
    );

    const slotAvailability: Record<string, number[]> = {};

    if (khach_hang_id || phone) {
      const hasClinicalExam = await this.checkCustomerHasClinicalExamOnDate(khach_hang_id, phone || null, dateStr, excludeSessionId);
      if (hasClinicalExam) {
        for (const slot of timeSlots) {
          slotAvailability[slot] = [];
        }
        return {
          bookedSlots: timeSlots,
          specialists: scheduledSpecialistsForDay.map(d => ({ id: d.nguoi_dung_id, ho_ten: d.ho_ten })),
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
      specialists: scheduledSpecialistsForDay.map(d => ({ id: d.nguoi_dung_id, ho_ten: d.ho_ten })),
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
    phong_id?: string | number | null;
  }) {
    let finalStatus = data.trang_thai;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const apptRes = await client.query('SELECT * FROM cuoc_hen WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn');
      }
      const appt = apptRes.rows[0];

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
        let previousMisses = 0;

        if (isPackageSession) {
          const missCountRes = await client.query(`
            SELECT COUNT(*)::int as count FROM cuoc_hen
            WHERE phac_do_dieu_tri_id = $1
              AND so_thu_tu_buoi = $2
              AND id != $3
              AND trang_thai IN ('da_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat', 'da_huy_phat')
          `, [appt.phac_do_dieu_tri_id, appt.so_thu_tu_buoi, id]);
          previousMisses = missCountRes.rows[0].count || 0;

          const invoiceRes = await client.query(`
            SELECT hinh_thuc_thanh_toan_goi FROM hoa_don
            WHERE phac_do_dieu_tri_id = $1
            LIMIT 1
          `, [appt.phac_do_dieu_tri_id]);
          hinhThuc = invoiceRes.rows[0]?.hinh_thuc_thanh_toan_goi || null;
        }

        const outcome = resolveNoShowOutcome(data.trang_thai as NoShowAction, hinhThuc, previousMisses, isPackageSession);
        finalStatus = outcome.finalStatus;
        if (outcome.reputationPenalty > 0) {
          await client.query(
            'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - $1) WHERE id = $2',
            [outcome.reputationPenalty, appt.khach_hang_id]
          );
        }
      }

      const final_bac_si_id = data.bac_si_id !== undefined ? data.bac_si_id : (data.chuyen_gia_id !== undefined ? data.chuyen_gia_id : data.ky_thuat_vien_id);
      const isCancelledOrNoShow = ['da_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat', 'da_huy_phat'].includes(finalStatus);

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
      } else if (isCancelledOrNoShow) {
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

      if (data.phong_id !== undefined && !isCancelledOrNoShow) {
        updates.push(`phong_id = $${paramIndex}`);
        values.push(data.phong_id ? parseInt(String(data.phong_id), 10) : null);
        paramIndex++;
      } else if (isCancelledOrNoShow) {
        updates.push(`phong_id = NULL`);
      }

      if (['da_huy', 'da_huy_phat'].includes(finalStatus)) {
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
        if (['hoan_thanh', 'khach_khong_den_phat', 'da_huy_phat'].includes(finalStatus) && rows[0].phac_do_dieu_tri_id) {
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
    // Đếm số buổi đã hoàn thành thực tế của phác đồ này trong cuoc_hen
    const countRes = await pool.query(
      "SELECT COUNT(*)::int as count FROM cuoc_hen WHERE phac_do_dieu_tri_id = $1 AND trang_thai IN ('hoan_thanh', 'khach_khong_den_phat', 'da_huy_phat') AND loai = 'DIEU_TRI'",
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
        kh.so_dien_thoai AS so_dien_thoai,
        kh.id as khach_hang_id,
        kh.diem_uy_tin as diem_uy_tin,
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
        ch.ghi_chu_noi_bo as ly_do_huy,
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
        dg.id as rating_id,
        dg.so_sao as rating_stars,
        dg.nhan_xet as rating_comment
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN danh_gia_chat_luong dg ON dg.cuoc_hen_id = ch.id
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

  async cancelCustomerAppointment(id: string, customer_id: string, ghi_chu_noi_bo: string) {
    const checkQuery = 'SELECT * FROM cuoc_hen WHERE id = $1 AND khach_hang_id = $2';
    const checkRes = await pool.query(checkQuery, [id, customer_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }
    const appt = checkRes.rows[0];

    const isPackageSession = !!(appt.phac_do_dieu_tri_id && appt.so_thu_tu_buoi);
    let hinhThuc: HinhThucThanhToanGoi | null = null;
    let previousMisses = 0;

    if (isPackageSession) {
      const missCountRes = await pool.query(`
        SELECT COUNT(*)::int as count FROM cuoc_hen
        WHERE phac_do_dieu_tri_id = $1
          AND so_thu_tu_buoi = $2
          AND id != $3
          AND trang_thai IN ('da_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat', 'da_huy_phat')
      `, [appt.phac_do_dieu_tri_id, appt.so_thu_tu_buoi, id]);
      previousMisses = missCountRes.rows[0].count || 0;

      const invoiceRes = await pool.query(`
        SELECT hinh_thuc_thanh_toan_goi FROM hoa_don
        WHERE phac_do_dieu_tri_id = $1
        LIMIT 1
      `, [appt.phac_do_dieu_tri_id]);
      hinhThuc = invoiceRes.rows[0]?.hinh_thuc_thanh_toan_goi || null;
    }

    const outcome = resolveNoShowOutcome('da_huy', hinhThuc, previousMisses, isPackageSession);
    const finalStatus = outcome.finalStatus;
    if (outcome.reputationPenalty > 0) {
      await pool.query(
        'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - $1) WHERE id = $2',
        [outcome.reputationPenalty, customer_id]
      );
    }

    const query = `
      UPDATE cuoc_hen
      SET trang_thai = $1, ghi_chu_noi_bo = $2, thoi_gian_huy = NOW(), nhan_su_id = NULL, phong_id = NULL
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await pool.query(query, [finalStatus, ghi_chu_noi_bo, id]);

    if (rows.length > 0 && finalStatus === 'da_huy_phat' && appt.phac_do_dieu_tri_id) {
      await this.updateCompletedSessionsCount(appt.phac_do_dieu_tri_id);
    }

    return rows[0];
  }

  async cancelBreakTimeAppointments(): Promise<{ cancelled_count: number }> {
    return { cancelled_count: 0 };
  }

  async checkDoctorOverlap(bac_si_id: string, start: string, end: string, excludeId?: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM cuoc_hen
      WHERE nhan_su_id = $1
        AND trang_thai NOT IN ('da_huy', 'huy')
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

    const apptQuery = `
      SELECT COUNT(*)::int as count FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE (
        ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
        OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
      )
      AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
      AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3::date
    `;
    const apptRes = await pool.query(apptQuery, [
      khach_hang_id || null,
      so_dien_thoai || null,
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
      so_dien_thoai || null,
      dateStr,
      excludeSessionId || null
    ]);
    const holdCount = holdRes.rows[0].count || 0;

    return (apptCount + holdCount) >= 3;
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
        OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
      )
        AND ch.trang_thai NOT IN ('da_huy', 'huy', 'hoan_thanh', 'khong_den')
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
        ch.ghi_chu_noi_bo as ly_do_huy,
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
      'SELECT ho_ten, so_dien_thoai, email FROM khach_hang WHERE id = $1',
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
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu,
        nd.ho_ten as ten_bac_si,
        p.ten_phong as ten_phong,
        hd.id as hoa_don_id,
        hd.ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id
      WHERE ch.khach_hang_id = $1 
        AND ch.loai IN ('KHAM', 'KHAM_MOI')
        AND ch.trang_thai = 'hoan_thanh'
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const examRes = await pool.query(examQuery, [customer_id]);

    // 2. Gói liệu trình
    const packageQuery = `
      SELECT 
        pd.id as phac_do_id,
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_phac_do,
        pd.ngay_kich_hoat,
        'GOI_LIEU_TRINH' as loai_ho_so,
        g.ten_goi as ten_dich_vu,
        pd.tong_so_buoi,
        pd.so_buoi_da_dung,
        pd.trang_thai as trang_thai_phac_do,
        hd.id as hoa_don_id,
        hd.ma_hoa_don,
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
        p.ten_phong,
        dg.so_sao as danh_gia_sao,
        dg.nhan_xet as danh_gia_nhan_xet
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN danh_gia_chat_luong dg ON dg.cuoc_hen_id = ch.id
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
        hd.ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        dg.so_sao as danh_gia_sao,
        dg.nhan_xet as danh_gia_nhan_xet
      FROM cuoc_hen ch
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id
      LEFT JOIN danh_gia_chat_luong dg ON dg.cuoc_hen_id = ch.id
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

