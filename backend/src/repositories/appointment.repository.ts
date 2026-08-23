import { Pool, PoolClient } from 'pg';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { getMinPaymentRequired, resolveNoShowOutcome } from '../domain/billing';
import { checkReceptionistTransition, isReceptionistLockedStatus, TERMINAL_STATUSES } from '../domain/appointmentStatus';
import { HinhThucThanhToanGoi, NoShowAction, LoaiCuocHen } from '../domain/types';
import adminCustomerRepository from './admin/adminCustomer.repository';
import {
  Buoi,
  GIO_NHAN_KHACH,
  KetQuaKiemTraDatLich,
  NhanSuTrucCa,
  NhomVaiTro,
  PhutDaDat,
  VAI_TRO_ID_KTV,
  kiemTraDatBatKy,
  kiemTraDatChoNhanSuCuThe,
  parseGioThanhPhut,
  resolveNhomVaiTro,
  tinhNganSachChung,
  tinhNganSachRieng,
  vaiTroIdCuaNhom,
} from '../domain/capacity';



/**
 * Đếm lại số buổi ĐÃ TIÊU THỤ của 1 phác đồ và tự chuyển trang_thai sang 'hoan_thanh' nếu đã đủ
 * (hoặc lùi lại 'dang_dieu_tri' nếu trước đó lỡ đánh dấu hoàn thành mà giờ chưa đủ buổi nữa) —
 * nguồn DUY NHẤT cho phép tính này. Dùng chung cho appointment.repository.ts (Bác sĩ/Admin đổi
 * trạng thái), technician.repository.ts (KTV hoàn thành buổi trị liệu), receptionist.repository.ts
 * (Lễ tân đổi trạng thái lịch hẹn) — trước đây mỗi nơi tự chép 1 bản riêng, không khóa hàng, nên 2
 * luồng cùng đụng 1 phác đồ gần lúc nhau có thể đua nhau ghi đè: luồng đọc COUNT trước khi luồng
 * kia kịp commit sẽ ghi lại giá trị cũ, khiến trang_thai kẹt ở 'dang_dieu_tri' dù đã đủ buổi (đã xảy
 * ra thật với dữ liệu, xem trace log lúc phát hiện bug).
 *
 * BẮT BUỘC gọi với `client` đang ở trong transaction (BEGIN...COMMIT) của caller, không gọi với
 * `pool` trần — `SELECT ... FOR UPDATE` chỉ thực sự khóa hàng phác đồ tới khi transaction ngoài
 * COMMIT/ROLLBACK, gọi ngoài transaction sẽ nhả khóa ngay sau câu lệnh, không chặn được race.
 */
export async function updateCompletedSessionsCount(db: Pool | PoolClient, phac_do_dieu_tri_id: string): Promise<void> {
  const pdRes = await db.query(
    'SELECT tong_so_buoi, trang_thai FROM phac_do_dieu_tri WHERE id = $1 FOR UPDATE',
    [phac_do_dieu_tri_id]
  );
  if (pdRes.rows.length === 0) return;
  const { tong_so_buoi, trang_thai } = pdRes.rows[0];

  // Đếm buổi đã TIÊU THỤ: hoan_thanh luôn tính; "không đến" CHỈ tính khi gói Nhóm B (trả
  // thẳng/trả góp — khách đã trả trước nên mất buổi), Nhóm A không đến thì KHÔNG mất buổi. Hủy
  // (da_huy/da_huy_phat) không bao giờ tính.
  const countRes = await db.query(
    `SELECT COUNT(*)::int as count FROM cuoc_hen
     WHERE phac_do_dieu_tri_id = $1
       AND loai = 'DIEU_TRI'
       AND (
         trang_thai = 'hoan_thanh'
         OR (
           trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat')
           AND (SELECT hinh_thuc_thanh_toan_goi FROM hoa_don WHERE phac_do_dieu_tri_id = $1 LIMIT 1) = 'tra_thang'
         )
       )`,
    [phac_do_dieu_tri_id]
  );
  const completedCount = countRes.rows[0].count || 0;
  const statusToSet = completedCount >= tong_so_buoi ? 'hoan_thanh' : (trang_thai === 'hoan_thanh' ? 'dang_dieu_tri' : trang_thai);

  if (statusToSet === 'hoan_thanh') {
    await db.query(
      `UPDATE phac_do_dieu_tri
       SET so_buoi_da_dung = $1, trang_thai = $2, ngay_hoan_thanh = COALESCE(ngay_hoan_thanh, NOW())
       WHERE id = $3`,
      [completedCount, statusToSet, phac_do_dieu_tri_id]
    );
  } else {
    await db.query(
      `UPDATE phac_do_dieu_tri
       SET so_buoi_da_dung = $1, trang_thai = $2
       WHERE id = $3`,
      [completedCount, statusToSet, phac_do_dieu_tri_id]
    );
  }
}

/**
 * Kiểm tra tính hợp lệ khi đặt buổi tiếp theo của gói liệu trình:
 * 1. Chặn nếu có ca hẹn đang hoạt động thuộc phác đồ này (chống đặt chồng chéo)
 * 2. Chặn nếu gói đã bị hủy hoặc hoàn tiền
 * 3. Chặn nếu gói đã quá hạn sử dụng
 * 4. Kiểm tra điều kiện số tiền đã trả tối thiểu theo hình thức thanh toán (tra_thang vs tung_buoi)
 */
export async function assertTreatmentPlanCanBookSession(
  phac_do_dieu_tri_id: string,
  so_thu_tu_buoi?: number,
  isClientFacing: boolean = false
): Promise<void> {
  const activeApptRes = await pool.query(
    `SELECT id, so_thu_tu_buoi, trang_thai 
     FROM cuoc_hen 
     WHERE phac_do_dieu_tri_id = $1 
       AND trang_thai IN ('da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_tai_luong_gia')
     LIMIT 1`,
    [phac_do_dieu_tri_id]
  );
  if (activeApptRes.rows.length > 0) {
    const activeAppt = activeApptRes.rows[0];
    const who = isClientFacing ? 'Bạn' : 'Khách hàng';
    throw new Error(`${who} đã có lịch đặt cho buổi số ${activeAppt.so_thu_tu_buoi} đang hoạt động. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước khi đặt buổi tiếp theo.`);
  }

  const invRes = await pool.query(
    `SELECT hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.tong_tien_goc,
            hd.so_tien_giam_voucher, hd.trang_thai as hd_trang_thai,
            pd.tong_so_buoi, pd.trang_thai as pd_trang_thai, g.loai_goi,
            (pd.trang_thai = 'dang_dieu_tri' AND pd.han_su_dung IS NOT NULL AND pd.han_su_dung < CURRENT_DATE) as qua_han,
            pd.han_su_dung
     FROM hoa_don hd
     JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
     JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
     WHERE hd.phac_do_dieu_tri_id = $1
     LIMIT 1`,
    [phac_do_dieu_tri_id]
  );
  if (invRes.rows.length > 0) {
    const {
      hinh_thuc_thanh_toan_goi, tong_tien_phai_tra, so_tien_da_tra, tong_so_buoi, loai_goi,
      tong_tien_goc, so_tien_giam_voucher,
      pd_trang_thai, hd_trang_thai, qua_han, han_su_dung
    } = invRes.rows[0];

    if (['huy', 'da_huy'].includes(String(pd_trang_thai)) || hd_trang_thai === 'da_hoan_tien') {
      throw new Error('Gói trị liệu này đã bị hủy và hoàn tiền. Không thể đặt thêm buổi điều trị cho gói đã hủy.');
    }

    if (qua_han) {
      const hanStr = new Date(han_su_dung).toLocaleDateString('vi-VN');
      const contactWho = isClientFacing ? 'phòng khám để được hỗ trợ' : 'Admin để xử lý';
      throw new Error(`Gói trị liệu này đã quá hạn sử dụng (hạn ${hanStr}). Vui lòng liên hệ ${contactWho} trước khi đặt thêm buổi điều trị.`);
    }

    if (loai_goi !== 'LE') {
      const M = Number(so_thu_tu_buoi) || 1;
      const grossBeforeExamDeduction = Number(tong_tien_goc || 0) - Number(so_tien_giam_voucher || 0);
      const minRequired = getMinPaymentRequired(
        hinh_thuc_thanh_toan_goi,
        Number(tong_tien_phai_tra),
        Number(tong_so_buoi || 10),
        M,
        grossBeforeExamDeduction
      );
      if (Number(so_tien_da_tra) < minRequired) {
        const who = isClientFacing ? 'Bạn' : 'Khách hàng';
        if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
          throw new Error(`${who} chưa hoàn tất thanh toán cho gói trị liệu này. Vui lòng thanh toán trước khi thực hiện buổi số ${M}!`);
        } else {
          throw new Error(`${who} chưa hoàn tất thanh toán cho buổi điều trị trước đó. Vui lòng thanh toán trước khi đặt lịch cho buổi số ${M}!`);
        }
      }
    }
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

/** "YYYY-MM-DD" + giờ hiện tại theo giờ VN — dùng để so ngày/giờ mà không lệch múi giờ server. */
function getVnNowParts(): { dateStr: string; minutesOfDay: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
  const minutesOfDay = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  return { dateStr, minutesOfDay };
}

/**
 * "Chốt thô" điều kiện #6 trong danh sách chặn đặt lịch — buổi đặt cho hôm nay đã trôi qua giờ
 * nhận khách kết thúc (vd đặt buổi sáng sau 12h00) thì không cho đặt nữa; ngày trong quá khứ luôn
 * coi là đã qua. Không xét "giờ đến muộn nhất theo từng dịch vụ" (Lớp 2, B20) — đó là kiểm tra ở
 * thời điểm CHECK-IN, thuộc giai đoạn 3 của kế hoạch, chưa cài ở đây.
/** Thời gian ngắt nhận lịch trước khi kết thúc buổi (phút) — mặc định 45 phút */
const CUTOFF_LEAD_MINUTES = 45;

function isBuoiDaQua(ngay: string, buoi: Buoi): boolean {
  const { dateStr: todayStr, minutesOfDay } = getVnNowParts();
  if (ngay < todayStr) return true;
  if (ngay > todayStr) return false;
  const endMinutes = parseGioThanhPhut(GIO_NHAN_KHACH[buoi].ketThuc);
  return minutesOfDay >= (endMinutes - CUTOFF_LEAD_MINUTES);
}

/** Ghép buổi (sáng/chiều) + ngày thành mốc TIMESTAMPTZ NOMINAL của buổi — KHÔNG phải giờ thật
 * khách sẽ được phục vụ (giờ thật do "Gọi vào" quyết định, ghi ở `thoi_gian_bat_dau`/`phien_lam_viec`).
 * Chỉ dùng để giữ tương thích các câu truy vấn DATE(ngay_gio_bat_dau) rải rác trong hệ thống mà
 * không phải sửa lại toàn bộ — xem "Ba lớp kiểm soát sức chứa" trong kế hoạch tái thiết kế. */
function resolveKhungGioNominalBuoi(ngay: string, buoi: Buoi): { batDau: string; ketThuc: string } {
  const { batDau, ketThuc } = GIO_NHAN_KHACH[buoi];
  return {
    batDau: `${ngay}T${batDau}:00+07:00`,
    ketThuc: `${ngay}T${ketThuc}:00+07:00`
  };
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
        ch.buoi,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
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
        nk.ghi_chu,
        ch.so_thu_tu_buoi,
        ch.phac_do_dieu_tri_id as phac_do_dieu_tri_id,
        ch.phac_do_dieu_tri_id as goi_dich_vu_id,
        ch.trang_thai_thanh_toan AS trang_thai_thanh_toan,
        hd.trang_thai as trang_thai_hoa_don_goi,
        hd.so_tien_da_tra as so_tien_da_tra_goi,
        hd.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi,
        hd.id as hoa_don_goi_id,
        hd.tong_tien_goc as tong_tien_goc_goi,
        hd.so_tien_giam_voucher as so_tien_giam_voucher_goi,
        pd.tong_so_buoi as tong_so_buoi_goi,
        pd.goi_dich_vu_id as pd_goi_dich_vu_id,
        COALESCE(g.loai_goi, gpd.loai_goi) as loai_goi,
        ch.nguoi_tao_id,
        nd_tao.ho_ten AS ten_nguoi_tao,
        ch.thoi_gian_tao as thoi_gian_tao,
        ch.ghi_chu_khach_hang AS ly_do_kham,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.thoi_gian_checkin,
        ch.thoi_gian_bat_dau,
        ch.thoi_gian_hoan_thanh,
        ch.thoi_gian_khong_den,
        ch.thoi_gian_huy,
        ch.han_tai_kham,
        -- Gói liệu trình được chỉ định từ CHÍNH buổi Lượng giá này (qua chi_dinh_buoi liên kết
        -- nhat_ky_buoi_dieu_tri của ca khám) — dùng để DetailModal hiện khối "Gói đã chỉ định" +
        -- nút "Thanh toán gói này" mà không đụng gì tới cột thanh toán/trạng thái hiện có.
        cd.goi_dich_vu_id as khuyen_nghi_goi_id,
        goi_kn.ten_goi as khuyen_nghi_ten_goi,
        goi_kn.loai_goi as khuyen_nghi_loai_goi,
        cd.phac_do_dieu_tri_id as khuyen_nghi_phac_do_id,
        -- B2/B19/B11/B23 — nguồn sự thật server-side cho "đang gọi vào"/số thứ tự hàng đợi, thay cho
        -- tín hiệu localStorage phía client (chỉ hoạt động cùng trình duyệt, không đồng bộ 2 máy
        -- thật). Lấy đúng PHIÊN MỚI NHẤT (1 lịch hẹn có thể có nhiều phiên — tái lượng giá check-in
        -- lại sinh phiên mới) bằng LATERAL, không JOIN thẳng để tránh nhân đôi dòng cuoc_hen.
        pv.thoi_gian_goi_vao,
        COALESCE(pv.so_lan_goi_khong_co_mat, 0) as so_lan_goi_khong_co_mat,
        pv.so_thu_tu_hang_doi,
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN true ELSE false END) AS is_reassessment
      FROM cuoc_hen ch
      LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN nguoi_dung nd_tao ON ch.nguoi_tao_id = nd_tao.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu goi_kn ON cd.goi_dich_vu_id = goi_kn.id
      LEFT JOIN LATERAL (
        SELECT thoi_gian_goi_vao, so_lan_goi_khong_co_mat, so_thu_tu_hang_doi, lan_thu
        FROM phien_lam_viec
        WHERE cuoc_hen_id = ch.id
        ORDER BY lan_thu DESC, thoi_gian_tao DESC
        LIMIT 1
      ) pv ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          id, trang_thai, so_tien_da_tra, tong_tien_phai_tra, hinh_thuc_thanh_toan_goi,
          tong_tien_goc, so_tien_giam_voucher
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
          -- Buổi hôm nay ĐANG DIỄN RA thật → so với giờ THẬT bây giờ, không phải mốc buổi danh nghĩa
          -- (xem giải thích đầy đủ ở doctor.repository.ts, cùng lỗi vừa vá 08/08/2026).
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc > (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      ${whereClause}
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, email, goi_dich_vu_id, ngay, buoi, ghi_chu_dat_lich, ly_do_kham, loai_lich, dang_ky_goi_id, phong_id } = data;
    let phac_do_dieu_tri_id = data.phac_do_dieu_tri_id;
    let so_thu_tu_buoi = data.so_thu_tu_buoi;
    const bac_si_id = data.bac_si_id || data.chuyen_gia_id || data.ky_thuat_vien_id;
    const finalGoiId = goi_dich_vu_id || data.dich_vu_id;
    const finalLoai: LoaiCuocHen = (loai_lich === 'dieu_tri' || loai_lich === 'DIEU_TRI') ? 'DIEU_TRI' : ((loai_lich === 'kham_moi' || loai_lich === 'KHAM') ? 'KHAM' : 'DICH_VU_LE');

    if (!buoi || (buoi !== 'sang' && buoi !== 'chieu')) {
      throw new Error('Thiếu thông tin buổi (sáng/chiều).');
    }
    if (!ngay || !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
      throw new Error('Thiếu hoặc sai định dạng ngày đặt lịch (YYYY-MM-DD).');
    }
    const { batDau: ngayGioBatDauNominal, ketThuc: ngayGioKetThucNominal } = resolveKhungGioNominalBuoi(ngay, buoi as Buoi);

    // Thời lượng thực để tính ngân sách phút — lấy trực tiếp từ dịch vụ, hoặc qua gói liệu trình
    // nếu buổi này thuộc phác đồ (buổi tiếp theo trong liệu trình có thể không kèm goi_dich_vu_id).
    let thoiLuongPhut = 60;
    if (finalGoiId) {
      const dvRes = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [finalGoiId]);
      if (dvRes.rows.length > 0) thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 60;
    } else if (phac_do_dieu_tri_id) {
      const dvRes = await pool.query(
        'SELECT gdv.thoi_luong_phut FROM phac_do_dieu_tri pd JOIN goi_dich_vu gdv ON gdv.id = pd.goi_dich_vu_id WHERE pd.id = $1',
        [phac_do_dieu_tri_id]
      );
      if (dvRes.rows.length > 0) thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 60;
    }

    // A1 — ngân sách phút theo buổi (thay hoàn toàn slot giờ cố định + trùng lịch nhân sự).
    // isBuoiDaQua chỉ chặn "chốt thô" (đã qua giờ nhận khách của cả buổi); Lớp 2 (giờ đến muộn
    // nhất theo từng dịch vụ) là kiểm tra ở thời điểm check-in, thuộc giai đoạn 3, chưa cài ở đây.
    if (isBuoiDaQua(ngay, buoi as Buoi)) {
      throw new Error('Buổi này đã qua giờ nhận khách, vui lòng chọn buổi khác.');
    }
    const capacityCheck = await this.checkBuoiCapacity({
      ngay, buoi: buoi as Buoi, loaiCuocHen: finalLoai, thoiLuongPhut,
      nhanSuId: bac_si_id ? Number(bac_si_id) : null
    });
    if (!capacityCheck.choPhep) {
      throw new Error(capacityCheck.lyDo || 'Buổi này đã hết chỗ.');
    }

    // Chống spam — giới hạn số lượng (3 lịch đang hoạt động toàn hệ thống).
    if (khach_hang_id || so_dien_thoai) {
      if (finalLoai === 'KHAM') {
        const hasPendingReExam = await this.checkCoLichChoTaiLuongGia(khach_hang_id, so_dien_thoai || null);
        if (hasPendingReExam) {
          throw new Error('Khách hàng đang có lịch chờ tái lượng giá — vui lòng quay lại dùng lịch đó thay vì đặt lịch Lượng giá mới.');
        }
      }
      const overActiveLimit = await this.checkCustomerActiveLimit(khach_hang_id, so_dien_thoai || null);
      if (overActiveLimit) {
        throw new Error('Khách hàng đang có tối đa 3 lịch chưa hoàn thành/chưa hủy — cần hoàn thành hoặc hủy bớt trước khi đặt thêm.');
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
                 hd.tong_tien_goc, hd.so_tien_giam_voucher
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
          - Number(invoiceObj.so_tien_giam_voucher || 0);

        const minRequired = getMinPaymentRequired(hinhThuc, tongTien, tongSoBuoiGoi, sessionNumForCheck, grossBeforeExamDeduction);
        if (daThanhToan < minRequired) {
          const formattedPaid = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(daThanhToan);
          const formattedRequired = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minRequired);
          const label = hinhThuc === 'tung_buoi' ? 'Trả từng buổi' : 'Trả thẳng 100%';
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
      
      // BẮT BUỘC ĐẶT THEO THỨ TỰ TUẦN TỰ (CHỐNG NHẢY CÓC BUỔI)
      const countRes = await pool.query(
        "SELECT COALESCE(MAX(so_thu_tu_buoi), 0)::int as max_session FROM cuoc_hen WHERE phac_do_dieu_tri_id = $1 AND trang_thai != 'da_huy'",
        [finalPhacDoId]
      );
      const expectedNextSession = (countRes.rows[0].max_session || 0) + 1;
      so_thu_tu_buoi = expectedNextSession;
      data.so_thu_tu_buoi = expectedNextSession;

      // Kiểm tra tính hợp lệ của gói liệu trình & điều kiện thanh toán
      await assertTreatmentPlanCanBookSession(finalPhacDoId, so_thu_tu_buoi, false);
    }

    // Phân loại tự động trang_thai_thanh_toan cho buổi gói liệu trình
    let defaultTrangThaiThanhToan = data.trang_thai_thanh_toan || 'chua_thanh_toan';
    if (finalPhacDoId) {
      const invCheck = await pool.query(
        `SELECT hd.hinh_thuc_thanh_toan_goi, hd.so_tien_da_tra, hd.tong_tien_phai_tra, hd.tong_tien_goc,
                hd.so_tien_giam_voucher, pd.tong_so_buoi
         FROM hoa_don hd
         JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
         WHERE hd.phac_do_dieu_tri_id = $1 LIMIT 1`,
        [finalPhacDoId]
      );
      if (invCheck.rows.length > 0) {
        const { hinh_thuc_thanh_toan_goi, so_tien_da_tra, tong_tien_phai_tra, tong_so_buoi, tong_tien_goc, so_tien_giam_voucher } = invCheck.rows[0];
        if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
          defaultTrangThaiThanhToan = 'da_thanh_toan';
        } else if (hinh_thuc_thanh_toan_goi === 'tung_buoi') {
          const M = Number(so_thu_tu_buoi) || 1;
          const totalSessions = Number(tong_so_buoi || 10);
          const totalAmount = Number(tong_tien_phai_tra || 0);
          const perSession = totalSessions > 0 ? Math.round(totalAmount / totalSessions) : totalAmount;
          const reqForThisSession = M >= totalSessions ? totalAmount : M * perSession;
          defaultTrangThaiThanhToan = Number(so_tien_da_tra) >= reqForThisSession ? 'da_thanh_toan' : 'chua_thanh_toan';
        }
      }
    }

    // A10 — bỏ hẳn chưa_xác_nhận/chờ_xác_nhận, mọi lịch mới vào thẳng đã xác nhận (trừ khi caller
    // truyền thẳng trạng thái khác, vd Lễ tân tạo lịch cho khách đã có mặt tại quầy).
    const trang_thai = data.trang_thai || 'da_xac_nhan';
    const trang_thai_thanh_toan = defaultTrangThaiThanhToan;

    // Tự động phân phòng từ lịch trực của nhân sự nếu chưa gán
    let resolvedPhongId = phong_id ? Number(phong_id) : null;
    if (!resolvedPhongId && bac_si_id) {
      const { rows: shiftRows } = await pool.query(`
        SELECT phong_id FROM lich_truc_nhan_su
        WHERE nhan_su_id = $1
          AND ngay_truc = $2::date
          AND trang_thai = 'hoat_dong'
          AND gio_bat_dau <= $3::time
          AND gio_ket_thuc > $3::time
        LIMIT 1
      `, [bac_si_id, ngay, GIO_NHAN_KHACH[buoi as Buoi].batDau]);
      if (shiftRows.length > 0 && shiftRows[0].phong_id) {
        resolvedPhongId = shiftRows[0].phong_id;
      }
    }

    const isConfirmedState = ['da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh'].includes(trang_thai) || !!bac_si_id;
    const thoi_gian_xac_nhan_val = isConfirmedState ? new Date() : null;

    // Tạo lịch nhanh tại quầy có thể tạo thẳng ở trạng thái đã check-in/đang khám/hoàn thành (khách
    // vãng lai đã có mặt) — trước đây chỉ set trang_thai mà KHÔNG set các mốc thời gian tương ứng
    // (thoi_gian_checkin/bat_dau/hoan_thanh), khiến Lịch Sử Trạng Thái hiện đúng nhãn trạng thái
    // nhưng thiếu mốc giờ, và các nơi khác dựa vào cột này để biết "đã check-in thật chưa" bị sai.
    // Cascading: 1 trạng thái sau luôn bao hàm đã đi qua (các) mốc trước đó.
    const isCheckedInState = ['da_checkin', 'dang_kham', 'hoan_thanh'].includes(trang_thai);
    const isInProgressState = ['dang_kham', 'hoan_thanh'].includes(trang_thai);
    const isCompletedState = trang_thai === 'hoan_thanh';
    const thoi_gian_checkin_val = isCheckedInState ? new Date() : null;
    const thoi_gian_bat_dau_val = isInProgressState ? new Date() : null;
    const thoi_gian_hoan_thanh_val = isCompletedState ? new Date() : null;

    let snapshotThoiLuong = 30;
    if (finalGoiId) {
      const { rows: gRows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [finalGoiId]);
      if (gRows.length > 0 && gRows[0].thoi_luong_phut) {
        snapshotThoiLuong = gRows[0].thoi_luong_phut;
      }
    }

    const query = `
      INSERT INTO cuoc_hen (
        khach_hang_id, nhan_su_id, goi_dich_vu_id, phac_do_dieu_tri_id, so_thu_tu_buoi,
        ngay_gio_bat_dau, ngay_gio_ket_thuc, buoi, loai, trang_thai, trang_thai_thanh_toan,
        ghi_chu_khach_hang, phong_id, nguoi_tao_id, thoi_gian_tao,
        thoi_gian_checkin, thoi_gian_bat_dau, thoi_gian_hoan_thanh, thoi_luong_phut
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, $17, $18
      )
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      bac_si_id || null,
      finalGoiId || null,
      phac_do_dieu_tri_id || null,
      so_thu_tu_buoi || null,
      ngayGioBatDauNominal,
      ngayGioKetThucNominal,
      buoi,
      finalLoai,
      trang_thai,
      trang_thai_thanh_toan,
      ghi_chu_dat_lich || null,
      resolvedPhongId,
      data.nguoi_tao_id || null,
      thoi_gian_checkin_val,
      thoi_gian_bat_dau_val,
      thoi_gian_hoan_thanh_val,
      snapshotThoiLuong
    ]);

    const createdAppointment = rows[0];

    if (data.hoa_don_id) {
      await pool.query(
        'UPDATE hoa_don SET cuoc_hen_id = $1 WHERE id = $2',
        [createdAppointment.id, data.hoa_don_id]
      );
    }

    // Nếu tạo lịch nhanh ở trạng thái đã check-in → tự động cấp phiên làm việc + số thứ tự hàng đợi
    if (createdAppointment.trang_thai === 'da_checkin') {
      const isKham = String(createdAppointment.loai || '').toUpperCase().includes('KHAM');
      await pool.query(`
        INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_thu_tu_hang_doi, thoi_gian_tao)
        VALUES (
          $1,
          COALESCE((SELECT MAX(lan_thu) FROM phien_lam_viec WHERE cuoc_hen_id = $1), 0) + 1,
          COALESCE(
            (
              SELECT MAX(p.so_thu_tu_hang_doi)
              FROM phien_lam_viec p
              JOIN cuoc_hen c ON p.cuoc_hen_id = c.id
              WHERE DATE(p.thoi_gian_tao AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE
                AND (
                  CASE
                    WHEN $2::boolean THEN c.loai IN ('KHAM', 'kham', 'kham_moi')
                    ELSE c.loai NOT IN ('KHAM', 'kham', 'kham_moi')
                  END
                )
            ),
            0
          ) + 1,
          NOW()
        )
      `, [createdAppointment.id, isKham]);
    }

    return createdAppointment;
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const goi_dich_vu_id = data.goi_dich_vu_id || data.dich_vu_id;
    const { khach_hang_id, nhan_su_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay, buoi, ly_do_kham, trang_thai, trieu_chung, anh_dinh_kem_url } = data;
    const phac_do_dieu_tri_id = data.phac_do_dieu_tri_id;
    const so_thu_tu_buoi = data.so_thu_tu_buoi;

    if (!buoi || (buoi !== 'sang' && buoi !== 'chieu')) {
      throw new Error('Thiếu thông tin buổi (sáng/chiều).');
    }
    if (!ngay || !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
      throw new Error('Thiếu hoặc sai định dạng ngày đặt lịch (YYYY-MM-DD).');
    }
    if (isBuoiDaQua(ngay, buoi as Buoi)) {
      throw new Error('Buổi này đã qua giờ nhận khách, vui lòng chọn buổi khác.');
    }
    const { batDau: ngayGioBatDauNominal, ketThuc: ngayGioKetThucNominal } = resolveKhungGioNominalBuoi(ngay, buoi as Buoi);

    const final_khach_hang_id_input = khach_hang_id || null;

    // Kiểm tra tính hợp lệ của gói liệu trình & điều kiện thanh toán (isClientFacing = true)
    if (phac_do_dieu_tri_id) {
      await assertTreatmentPlanCanBookSession(phac_do_dieu_tri_id, so_thu_tu_buoi, true);
    }

    let isExamService = false;
    let thoiLuongPhut = 30;
    if (goi_dich_vu_id) {
      const dvRes = await pool.query("SELECT loai_goi, thoi_luong_phut FROM goi_dich_vu WHERE id = $1", [goi_dich_vu_id]);
      if (dvRes.rows.length > 0) {
        isExamService = dvRes.rows[0].loai_goi === 'KHAM';
        thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 30;
      }
    }
    const finalLoaiForCapacity: LoaiCuocHen = phac_do_dieu_tri_id ? 'DIEU_TRI' : (isExamService ? 'KHAM' : 'DICH_VU_LE');

    // A1 — ngân sách phút theo buổi (thay slot giờ cố định + trùng lịch khách hàng — bỏ hẳn theo A12).
    const capacityCheck = await this.checkBuoiCapacity({
      ngay, buoi: buoi as Buoi, loaiCuocHen: finalLoaiForCapacity, thoiLuongPhut,
      nhanSuId: nhan_su_id ? Number(nhan_su_id) : (data.nguoi_dung_id ? Number(data.nguoi_dung_id) : null)
    });
    if (!capacityCheck.choPhep) {
      throw new Error(capacityCheck.lyDo || 'Buổi này đã hết chỗ, vui lòng chọn buổi khác.');
    }

    if (final_khach_hang_id_input || so_dien_thoai) {
      if (finalLoaiForCapacity === 'KHAM') {
        const hasExam = await this.checkCustomerHasClinicalExamOnDate(final_khach_hang_id_input, so_dien_thoai || null, ngay);
        if (hasExam) {
          throw new Error('Bạn đã có một buổi Lượng giá trong ngày này.');
        }
        const hasPendingReExam = await this.checkCoLichChoTaiLuongGia(final_khach_hang_id_input, so_dien_thoai || null);
        if (hasPendingReExam) {
          throw new Error('Bạn đang có lịch chờ tái lượng giá — vui lòng quay lại dùng lịch đó thay vì đặt lịch Lượng giá mới.');
        }
      }
      const overActiveLimit = await this.checkCustomerActiveLimit(final_khach_hang_id_input, so_dien_thoai || null);
      if (overActiveLimit) {
        throw new Error('Bạn đang có tối đa 3 lịch chưa hoàn thành/chưa hủy — vui lòng hoàn thành hoặc hủy bớt lịch hiện có trước khi đặt thêm.');
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
          AND phong_id IS NOT NULL
        LIMIT 1
      `, [final_nhan_su_id, ngay]);
      if (shiftRows.length > 0 && shiftRows[0].phong_id) {
        resolvedPhongId = shiftRows[0].phong_id;
      }
    }

    let snapshotThoiLuongPublic = 30;
    if (goi_dich_vu_id) {
      const { rows: gPublicRows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
      if (gPublicRows.length > 0 && gPublicRows[0].thoi_luong_phut) {
        snapshotThoiLuongPublic = gPublicRows[0].thoi_luong_phut;
      }
    }

    const query = `
      INSERT INTO cuoc_hen (
        khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, buoi,
        loai, trang_thai, trang_thai_thanh_toan, ghi_chu_khach_hang, phong_id, anh_dinh_kem_url,
        phac_do_dieu_tri_id, so_thu_tu_buoi, thoi_gian_tao, thoi_luong_phut
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      goi_dich_vu_id || null,
      final_nhan_su_id,
      ngayGioBatDauNominal,
      ngayGioKetThucNominal,
      buoi,
      finalLoaiForCapacity,
      trang_thai || 'da_xac_nhan',
      data.trang_thai_thanh_toan || 'chua_thanh_toan',
      trieu_chung || ly_do_kham || null,
      resolvedPhongId,
      anh_dinh_kem_url || null,
      phac_do_dieu_tri_id || null,
      so_thu_tu_buoi || null,
      snapshotThoiLuongPublic
    ]);

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

  /** Nhân sự đúng nhóm vai trò đang trực trong ngày, kèm ca trực + số khách song song (A1). */
  private async getNhanSuTrucCaTheoBuoi(dateStr: string, nhom: NhomVaiTro): Promise<NhanSuTrucCa[]> {
    const roleId = vaiTroIdCuaNhom(nhom);
    const { rows } = await pool.query(
      `SELECT lt.nhan_su_id as "nhanSuId", lt.gio_bat_dau::text as "gioBatDau", lt.gio_ket_thuc::text as "gioKetThuc",
              CASE WHEN nd.vai_tro_id = ${VAI_TRO_ID_KTV} THEN 2 ELSE 1 END as "soKhachSongSong"
       FROM lich_truc_nhan_su lt
       JOIN nguoi_dung nd ON nd.id = lt.nhan_su_id
       WHERE lt.ngay_truc = $1::date AND lt.trang_thai = 'hoat_dong'
         AND nd.vai_tro_id = $2 AND nd.trang_thai = 'hoat_dong'`,
      [dateStr, roleId]
    );
    return rows.map((r: any) => ({ ...r, soKhachSongSong: Number(r.soKhachSongSong) }));
  }

  /** Phút đã đặt trong buổi, quy về đúng nhóm vai trò (Lượng giá vs Trị liệu — 2 túi độc lập, A1). */
  private async getPhutDaDatTheoBuoi(dateStr: string, nhom: NhomVaiTro, buoi: Buoi, excludeApptId?: string): Promise<PhutDaDat[]> {
    const loaiList = nhom === 'chuyen_vien' ? ['KHAM', 'KHAM_MOI'] : ['DIEU_TRI', 'DICH_VU_LE'];
    const { rows } = await pool.query(
      `SELECT ch.nhan_su_id as "nhanSuId",
              COALESCE(gdv1.thoi_luong_phut, gdv2.thoi_luong_phut, 60) as "soPhut"
       FROM cuoc_hen ch
       LEFT JOIN goi_dich_vu gdv1 ON gdv1.id = ch.goi_dich_vu_id
       LEFT JOIN phac_do_dieu_tri pd ON pd.id = ch.phac_do_dieu_tri_id
       LEFT JOIN goi_dich_vu gdv2 ON gdv2.id = pd.goi_dich_vu_id
       WHERE ch.buoi = $1
         AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
         AND UPPER(ch.loai) = ANY($3::text[])
         AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den', 'khach_khong_den')
         AND ($4::uuid IS NULL OR ch.id != $4::uuid)`,
      [buoi, dateStr, loaiList, excludeApptId || null]
    );
    return rows.map((r: any) => ({ nhanSuId: r.nhanSuId, soPhut: Number(r.soPhut) }));
  }

  /**
   * Điểm gọi DUY NHẤT để kiểm tra ngân sách phút khi đặt lịch (A1) — mọi nơi tạo/đổi lịch phải
   * gọi qua đây, không tự query lại `lich_truc_nhan_su`/`cuoc_hen` rồi tính tay để tránh lệch công
   * thức. Thuần kết hợp dữ liệu DB với `domain/capacity.ts` (nguồn sự thật của công thức).
   */
  async checkBuoiCapacity(params: {
    ngay: string; buoi: Buoi; loaiCuocHen: LoaiCuocHen | string; thoiLuongPhut: number;
    nhanSuId?: number | null; excludeApptId?: string;
  }): Promise<KetQuaKiemTraDatLich> {
    const nhom = resolveNhomVaiTro(params.loaiCuocHen);
    const [nhanSu, daDat] = await Promise.all([
      this.getNhanSuTrucCaTheoBuoi(params.ngay, nhom),
      this.getPhutDaDatTheoBuoi(params.ngay, nhom, params.buoi, params.excludeApptId)
    ]);
    return params.nhanSuId
      ? kiemTraDatChoNhanSuCuThe(params.nhanSuId, nhanSu, daDat, params.thoiLuongPhut, params.buoi)
      : kiemTraDatBatKy(nhanSu, daDat, params.thoiLuongPhut, params.buoi);
  }

  /**
   * Sức chứa cả 2 buổi trong ngày cho 1 dịch vụ cụ thể — nguồn dữ liệu cho màn hình đặt lịch
   * (thay hoàn toàn getBookedSlots dạng lưới giờ cố định). dichVuId thiếu thì mặc định coi như
   * Lượng giá (khớp hành vi cũ của getBookedSlots khi không truyền dichVuId).
   */
  async getBuoiAvailability(dateStr: string, dichVuId?: string, userId?: string, phone?: string): Promise<{
    sang: { conLaiChung: number; choPhep: boolean; trungDichVu: boolean };
    chieu: { conLaiChung: number; choPhep: boolean; trungDichVu: boolean };
    nhanSu: Array<{ id: number; ho_ten: string; anh_dai_dien: string | null; caTruc: string; conLaiSang: number; conLaiChieu: number }>;
    hasExistingClinicalExam: boolean;
    buoc_thanh_toan_online: boolean;
  }> {
    let khach_hang_id: string | null = null;
    if (userId) {
      const khRes = await pool.query('SELECT id FROM khach_hang WHERE id = $1::uuid', [userId]);
      if (khRes.rows.length > 0) khach_hang_id = khRes.rows[0].id;
    }

    let isExam = true;
    let thoiLuongPhut = 60;
    if (dichVuId) {
      const dvRes = await pool.query('SELECT loai_goi, thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [dichVuId]);
      if (dvRes.rows.length > 0) {
        isExam = dvRes.rows[0].loai_goi === 'KHAM';
        thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 60;
      }
    }
    const nhom: NhomVaiTro = isExam ? 'chuyen_vien' : 'ktv';

    // Đã bỏ giới hạn 1 buổi lượng giá/ngày — theo AGENTS.md §1.2 quy tắc duy nhất là tối đa 3 lịch đang hoạt động toàn thời gian.
    const hasExistingClinicalExam = false;

    // Cảnh báo mềm "đã có 1 lịch đúng dịch vụ này trong buổi" — chỉ áp cho dịch vụ lẻ/gói, buổi
    // Lượng giá đã có chặn cứng riêng ở trên (hasExistingClinicalExam) nên không cần trùng lặp.
    let trungDichVuSang = false;
    let trungDichVuChieu = false;
    if (!isExam && dichVuId && (khach_hang_id || phone)) {
      [trungDichVuSang, trungDichVuChieu] = await Promise.all([
        this.checkCustomerHasSameServiceInBuoi(khach_hang_id, phone || null, dichVuId, dateStr, 'sang'),
        this.checkCustomerHasSameServiceInBuoi(khach_hang_id, phone || null, dichVuId, dateStr, 'chieu')
      ]);
    }

    const roleId = vaiTroIdCuaNhom(nhom);
    const [nhanSuTruc, staffInfoRes, daDatSang, daDatChieu] = await Promise.all([
      this.getNhanSuTrucCaTheoBuoi(dateStr, nhom),
      pool.query(`SELECT id, ho_ten, anh_dai_dien FROM nguoi_dung WHERE vai_tro_id = $1 AND trang_thai = 'hoat_dong'`, [roleId]),
      this.getPhutDaDatTheoBuoi(dateStr, nhom, 'sang'),
      this.getPhutDaDatTheoBuoi(dateStr, nhom, 'chieu')
    ]);

    const conLaiRieng = (ns: NhanSuTrucCa, buoi: Buoi, daDat: PhutDaDat[]) => {
      const nganSach = tinhNganSachRieng(ns, buoi);
      const daDung = daDat.filter(d => d.nhanSuId === ns.nhanSuId).reduce((tong, d) => tong + d.soPhut, 0);
      return Math.max(0, nganSach - daDung);
    };

    const nhanSuOut = staffInfoRes.rows
      .map((s: any) => {
        const ns = nhanSuTruc.find(n => n.nhanSuId === s.id);
        if (!ns) return null;
        return {
          id: s.id,
          ho_ten: s.ho_ten,
          anh_dai_dien: s.anh_dai_dien,
          caTruc: `${ns.gioBatDau.substring(0, 5)}-${ns.gioKetThuc.substring(0, 5)}`,
          conLaiSang: conLaiRieng(ns, 'sang', daDatSang),
          conLaiChieu: conLaiRieng(ns, 'chieu', daDatChieu)
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const conLaiChungBuoi = (daDat: PhutDaDat[], buoi: Buoi) =>
      Math.max(0, tinhNganSachChung(nhanSuTruc, buoi) - daDat.reduce((tong, d) => tong + d.soPhut, 0));

    let buoc_thanh_toan_online = false;
    if (khach_hang_id) {
      const noShowRes = await pool.query(
        `SELECT COUNT(*)::int as count
         FROM cuoc_hen
         WHERE khach_hang_id = $1
           AND trang_thai = 'khong_den'
           AND (thoi_gian_khong_den IS NULL OR thoi_gian_khong_den >= NOW() - INTERVAL '60 days')`,
        [khach_hang_id]
      );
      if ((noShowRes.rows[0]?.count || 0) >= 2) {
        buoc_thanh_toan_online = true;
      }
    }

    return {
      sang: { conLaiChung: conLaiChungBuoi(daDatSang, 'sang'), choPhep: kiemTraDatBatKy(nhanSuTruc, daDatSang, thoiLuongPhut, 'sang').choPhep, trungDichVu: trungDichVuSang },
      chieu: { conLaiChung: conLaiChungBuoi(daDatChieu, 'chieu'), choPhep: kiemTraDatBatKy(nhanSuTruc, daDatChieu, thoiLuongPhut, 'chieu').choPhep, trungDichVu: trungDichVuChieu },
      nhanSu: nhanSuOut,
      hasExistingClinicalExam,
      buoc_thanh_toan_online
    };
  }

  /**
   * B15 — ngân sách phút CÒN LẠI của từng nhân sự cùng túi vai trò, cho 1 buổi/ngày cụ thể. Dùng
   * để Admin/Quản lý kiểm tra trước khi đổi nhân sự cho MỘT ca cụ thể (mục "Quyền đổi nhân sự" —
   * người nhận phải còn ngân sách). Loại trừ đúng ca đang xét (`excludeApptId`) khỏi "đã dùng" vì
   * số phút của nó vốn đã tính cho người đang giữ, không phải phần MỚI phát sinh khi đổi.
   * Trả kèm `soKhachSongSong` để phía gọi tự đối chiếu số ca `dang_kham` hiện tại (Lớp 3 — giới hạn
   * bàn song song), không trộn chung vào con số ngân sách phút (Lớp 1) để tránh nhầm 2 khái niệm.
   */
  async getStaffBudgetForBuoi(dateStr: string, buoi: Buoi, loaiCuocHen: LoaiCuocHen | string, excludeApptId?: string): Promise<Array<{ nhanSuId: number; conLai: number; soKhachSongSong: number }>> {
    const nhom = resolveNhomVaiTro(loaiCuocHen);
    const [nhanSuTruc, daDat] = await Promise.all([
      this.getNhanSuTrucCaTheoBuoi(dateStr, nhom),
      this.getPhutDaDatTheoBuoi(dateStr, nhom, buoi, excludeApptId)
    ]);
    return nhanSuTruc.map(ns => {
      const nganSach = tinhNganSachRieng(ns, buoi);
      const daDung = daDat.filter(d => d.nhanSuId === ns.nhanSuId).reduce((tong, d) => tong + d.soPhut, 0);
      return { nhanSuId: ns.nhanSuId, conLai: Math.max(0, nganSach - daDung), soKhachSongSong: ns.soKhachSongSong };
    });
  }

  /**
   * A12 — tối đa 3 lịch hẹn ĐANG HOẠT ĐỘNG cùng lúc cho 1 khách hàng, tính TOÀN THỜI GIAN
   * (không theo ngày). Thay cho `checkCustomerDailyBookingLimit` + `checkCustomerPendingLimit`
   * cũ (đã gộp làm một theo yêu cầu người dùng 06/08/2026) — giới hạn theo ngày cũ không chặn
   * được kiểu spam "mỗi ngày đặt riêng 3 lịch nhưng dàn trải nhiều ngày", trong khi giới hạn
   * toàn-thời-gian này chặn triệt để hơn. "Đang hoạt động" = chưa hoàn thành/không đến/đã hủy —
   * hủy (bất kỳ `loai_huy` nào) giải phóng chỗ ngay lập tức. Áp dụng đồng nhất cho mọi loại lịch,
   * kể cả buổi thuộc gói liệu trình (gói vốn đã có luật tuần tự riêng nên hiếm khi chiếm quá 1 chỗ).
   */
  async checkCustomerActiveLimit(khach_hang_id: string | null, so_dien_thoai: string | null): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int as count FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND ch.trang_thai NOT IN (${TERMINAL_STATUSES.map((_, i) => `$${i + 3}`).join(', ')}, 'hoan_thanh')`,
      [khach_hang_id || null, so_dien_thoai || null, ...TERMINAL_STATUSES]
    );
    return (rows[0].count || 0) >= 3;
  }

  /** A12 — chặn đặt buổi Lượng giá mới khi khách đang có lịch treo `cho_tai_luong_gia`. */
  async checkCoLichChoTaiLuongGia(khach_hang_id: string | null, so_dien_thoai: string | null): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;
    const { rows } = await pool.query(
      `SELECT 1 FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND ch.trang_thai = 'cho_tai_luong_gia'
       LIMIT 1`,
      [khach_hang_id || null, so_dien_thoai || null]
    );
    return rows.length > 0;
  }

  /**
   * Cảnh báo MỀM (không chặn) khi khách đã có 1 lịch ĐANG HOẠT ĐỘNG với ĐÚNG dịch vụ này trong
   * CÙNG buổi/ngày — ví dụ đặt "Massage toàn thân" lúc 10h rồi đặt tiếp lúc 11h cùng buổi. Quyết
   * định 09/08/2026: không hợp lý về mặt nghiệp vụ để chặn cứng (khác hẳn "2 buổi Lượng giá cùng
   * ngày" — cái đó bắt buộc chặn vì lãng phí quy trình lâm sàng, còn dịch vụ lẻ trùng có thể là ý
   * định thật của khách), nhưng phải BÁO cho khách biết trước khi họ trả tiền/xác nhận, tránh
   * trường hợp bấm nhầm/double-click gây lãng phí ngân sách phút của ca.
   */
  async checkCustomerHasSameServiceInBuoi(
    khach_hang_id: string | null,
    so_dien_thoai: string | null,
    dichVuId: string,
    dateStr: string,
    buoi: 'sang' | 'chieu'
  ): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;
    if (!dichVuId) return false;
    const { rows } = await pool.query(
      `SELECT 1 FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND ch.goi_dich_vu_id = $3::uuid
       AND ch.ngay_gio_bat_dau::date = $4::date
       AND ch.buoi = $5
       AND ch.trang_thai NOT IN (${TERMINAL_STATUSES.map((_, i) => `$${i + 6}`).join(', ')}, 'hoan_thanh')
       LIMIT 1`,
      [khach_hang_id || null, so_dien_thoai || null, dichVuId, dateStr, buoi, ...TERMINAL_STATUSES]
    );
    return rows.length > 0;
  }

  async updateAppointmentStatus(id: string, data: {
    trang_thai: string;
    bac_si_id?: string | null;
    chuyen_gia_id?: string | null;
    ky_thuat_vien_id?: string | null;
    ngay_gio_bat_dau?: string | null;
    ngay_gio_ket_thuc?: string | null;
    buoi?: 'sang' | 'chieu';
    ghi_chu_noi_bo?: string | null;
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
        if (data.trang_thai === 'da_checkin') {
          const apptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(appt.ngay_gio_bat_dau));
          const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
          if (apptDateStr > todayStr) {
            const formattedDate = new Date(appt.ngay_gio_bat_dau).toLocaleDateString('vi-VN');
            throw new Error(`Lễ tân chỉ được phép Check-in cho các ca hẹn trong ngày hôm nay. Không thể check-in vượt thời gian cho ca hẹn ngày ${formattedDate}.`);
          }
        }
        // B11 (bổ sung 08/08/2026) — ngoại lệ CÓ CHỦ Ý duy nhất xuyên qua khóa `da_checkin`: Lễ tân
        // tự tay chuyển "Không đến" cho khách đã checkin nhưng gọi/đẩy nhiều lần vẫn không xuất hiện,
        // không phải đợi quét tự động cuối buổi (B10). Phải khai báo NGAY Ở ĐÂY — gate dưới đây chạy
        // Tự động chuyển ca đang check-in về 'da_xac_nhan' khi Lễ tân thao tác đổi lịch (ngày/giờ/buổi) để rút khỏi hàng đợi hôm nay
        const isRescheduling = (data.ngay_gio_bat_dau !== undefined && String(data.ngay_gio_bat_dau) !== String(appt.ngay_gio_bat_dau)) ||
                               (data.buoi !== undefined && String(data.buoi) !== String(appt.buoi));
        if (isRescheduling && appt.trang_thai === 'da_checkin') {
          data.trang_thai = 'da_xac_nhan';
        }

        if (isReceptionistLockedStatus(appt.trang_thai)) {
          const err = new Error(
            'Không thể thay đổi lịch hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.'
          ) as any;
          err.statusCode = 403;
          throw err;
        }
        if (data.trang_thai !== appt.trang_thai) {
          const check = checkReceptionistTransition(appt.trang_thai, data.trang_thai, !!appt.nhan_su_id, isRescheduling);
          if (!check.allowed) {
            const err = new Error(check.reason) as any;
            err.statusCode = 403;
            throw err;
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
                if (invoiceStatus !== 'da_thanh_toan') {
                  throw new Error('Gói trị liệu liên kết chưa được thanh toán (đối với trả thẳng). Không thể hoàn thành ca điều trị.');
                }
              }
            } else {
              throw new Error('Gói trị liệu liên kết chưa được đăng ký/thành lập hóa đơn.');
            }
          }
        }
      }

      // Handle Cancel / No-Show Logic
      if (['da_huy', 'khong_den'].includes(data.trang_thai)) {
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
        // Đã xóa cột điểm uy tín khỏi bảng khach_hang
      }

      const final_bac_si_id = data.bac_si_id !== undefined ? data.bac_si_id : (data.chuyen_gia_id !== undefined ? data.chuyen_gia_id : data.ky_thuat_vien_id);
      const isCancelledOrNoShow = ['da_huy', 'khong_den'].includes(finalStatus);
      // Chỉ HỦY mới giải phóng nhân sự/phòng — "không đến" vẫn giữ nguyên nhan_su_id/phong_id vì
      // nhân sự đã bố trí đúng giờ đó, khách không tới không có nghĩa nhân sự hết trách nhiệm với
      // ca này (khác hủy sớm, lúc đó slot thật sự trống lại). Giữ để Bác sĩ/KTV vẫn thấy đúng ca
      // "không đến" của mình trong thống kê, thay vì mất dấu vết ai từng phụ trách ca đó.
      const shouldReleaseAssignment = finalStatus === 'da_huy';

      // ĐÃ BỎ check trùng giờ (checkCustomerOverlap/checkDoctorOverlap) từng chạy ở đây trước mọi
      // đổi trạng thái không-hủy — di sản mô hình slot giờ cũ, và giờ ACTIVELY SAI trong mô hình
      // theo buổi: mọi lịch trong cùng 1 buổi dùng chung đúng 1 cặp ngay_gio_bat_dau/ngay_gio_ket_thuc
      // (mốc buổi danh nghĩa), nên 2 khách bất kỳ cùng nhân sự trong cùng buổi luôn bị báo "trùng
      // giờ" dù đây là tình huống HOÀN TOÀN BÌNH THƯỜNG của mô hình hàng đợi (nhân sự check-in nhiều
      // khách rồi lần lượt gọi vào). Sức chứa đã được kiểm soát đúng chỗ — ở lúc ĐẶT LỊCH bằng ngân
      // sách phút (A1) — không cần và không nên kiểm tra lại "trùng giờ" ở bước đổi trạng thái nữa.
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

      if (data.buoi !== undefined) {
        updates.push(`buoi = $${paramIndex}`);
        values.push(data.buoi);
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
      } else if (shouldReleaseAssignment) {
        updates.push(`phong_id = NULL`);
      }

      if (finalStatus === 'da_checkin') {
        updates.push(`thoi_gian_checkin = NOW()`);
      } else if (finalStatus === 'dang_kham') {
        updates.push(`thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, NOW())`);
      } else if (finalStatus === 'hoan_thanh') {
        updates.push(`thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW())`);
      } else if (finalStatus === 'da_huy') {
        updates.push(`thoi_gian_huy = COALESCE(thoi_gian_huy, NOW())`);
      } else if (finalStatus === 'khong_den') {
        updates.push(`thoi_gian_khong_den = COALESCE(thoi_gian_khong_den, NOW())`);
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
        if (['hoan_thanh', 'khong_den'].includes(finalStatus) && rows[0].phac_do_dieu_tri_id) {
          await updateCompletedSessionsCount(client, rows[0].phac_do_dieu_tri_id);
        }

        // B2/B19/B11/B23 — mỗi lần vào hàng đợi (check-in lần đầu HOẶC check-in lại sau
        // "chờ tái lượng giá") tạo đúng 1 phiên mới trong phien_lam_viec: `lan_thu` tăng dần theo
        // đúng lịch hẹn này (khớp thiết kế "1 lịch hẹn có thể có NHIỀU phiên"), `so_thu_tu_hang_doi`
        // là số thứ tự trong NGÀY, tách riêng theo nhóm vai trò (Lượng giá dùng túi Chuyên viên,
        // dịch vụ lẻ + buổi liệu trình dùng túi KTV — đúng ranh giới ngân sách phút A1 đã chốt),
        // không gộp chung một dãy số cho cả hai. Đặt trong CÙNG transaction với UPDATE cuoc_hen ở
        // trên nên không có khoảng hở giữa 2 lịch check-in cùng lúc bị trùng số.
        if (finalStatus === 'da_checkin') {
          const isKham = String(rows[0].loai || '').toUpperCase().includes('KHAM');
          await client.query(`
            INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_thu_tu_hang_doi, thoi_gian_tao)
            SELECT
              $1::uuid,
              COALESCE((SELECT MAX(lan_thu) FROM phien_lam_viec WHERE cuoc_hen_id = $1::uuid), 0) + 1,
              COALESCE((
                SELECT MAX(pv.so_thu_tu_hang_doi)
                FROM phien_lam_viec pv
                JOIN cuoc_hen c2 ON pv.cuoc_hen_id = c2.id
                WHERE DATE(pv.thoi_gian_tao AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
                  AND (UPPER(c2.loai) LIKE '%KHAM%') = $2::boolean
              ), 0) + 1,
              NOW()
          `, [id, isKham]);
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

  // B11 (bản Lễ tân) — "Đẩy xuống hàng đợi": Lễ tân trực tiếp quan sát khách rời chỗ chờ (đi vệ
  // sinh, bỏ về tạm...), KHÔNG cần đang được gán ca đó (khác `doctorRepository.markPatientAbsent`,
  // vốn đòi ownership vì gọi từ hàng đợi RIÊNG của từng nhân sự). Cùng hiệu ứng: tăng đếm gọi hụt +
  // reset thoi_gian_goi_vao + đẩy thoi_gian_checkin về NOW() để khách tự rơi xuống cuối hàng đợi
  // (sắp theo thoi_gian_checkin) ở CẢ màn hình Lễ tân lẫn màn hình nhân sự. KHÔNG tự chuyển "không
  // đến" dù đếm đạt 2 — Lễ tân luôn phải tự bấm nút "Không đến" riêng để xác nhận, không có gạch
  // đếm tự động nào thay quyền quyết định của con người ở đây.
  async pushBackAppointment(cuocHenId: string): Promise<{ so_lan_goi_khong_co_mat: number }> {
    const { rows: apptRows } = await pool.query(
      `SELECT id FROM cuoc_hen WHERE id = $1 AND trang_thai IN ('da_checkin', 'cho_tai_luong_gia')`,
      [cuocHenId]
    );
    if (apptRows.length === 0) {
      throw new Error('Không tìm thấy lịch hẹn này trong hàng đợi.');
    }

    const { rows: updRows } = await pool.query(
      `UPDATE phien_lam_viec SET so_lan_goi_khong_co_mat = so_lan_goi_khong_co_mat + 1
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)
       RETURNING so_lan_goi_khong_co_mat`,
      [cuocHenId]
    );

    let newCount: number;
    if (updRows.length === 0) {
      await pool.query(
        `INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_lan_goi_khong_co_mat, thoi_gian_tao)
         VALUES ($1, 1, 1, NOW())`,
        [cuocHenId]
      );
      newCount = 1;
    } else {
      newCount = updRows[0].so_lan_goi_khong_co_mat;
    }

    await pool.query(
      `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NULL
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)`,
      [cuocHenId]
    );
    // Nhả nhan_su_id về NULL nếu chỉ đang "giữ tạm" qua Gọi vào (gan_qua_hang_doi=true) — tránh khóa
    // chết khi đúng người vừa gọi hết ca trước khi khách trồi lên hàng đợi lại. Khách chọn đích danh
    // từ lúc đặt lịch (gan_qua_hang_doi=false) thì giữ nguyên, chỉ Admin đổi được (B15).
    await pool.query(
      `UPDATE cuoc_hen
       SET thoi_gian_checkin = NOW(),
           nhan_su_id = CASE WHEN gan_qua_hang_doi THEN NULL ELSE nhan_su_id END,
           gan_qua_hang_doi = FALSE
       WHERE id = $1`,
      [cuocHenId]
    );

    return { so_lan_goi_khong_co_mat: newCount };
  }

  async getCustomerAppointments(customer_id: string) {
    const query = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc as ngay_gio_ket_thuc,
        ch.trang_thai,
        ch.buoi,
        ch.trang_thai_thanh_toan,
        CASE
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.ho_ten AS ten_khach_hang,
        kh.id as khach_hang_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        pddt.tong_so_buoi as tong_so_buoi_goi,
        gdv.ten_goi as ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        nd_ktv.anh_dai_dien AS anh_bac_si,
        ch.nhan_su_id as bac_si_id,
        COALESCE(
          ch.phong_id,
          (
            SELECT lt.phong_id 
            FROM lich_truc_nhan_su lt 
            WHERE lt.nhan_su_id = ch.nhan_su_id 
              AND lt.ngay_truc = ch.ngay_gio_bat_dau::date 
              AND lt.phong_id IS NOT NULL 
            LIMIT 1
          )
        ) as phong_id,
        COALESCE(
          p.ten_phong,
          (
            SELECT p2.ten_phong 
            FROM lich_truc_nhan_su lt 
            JOIN phong_lam_viec p2 ON lt.phong_id = p2.id 
            WHERE lt.nhan_su_id = ch.nhan_su_id 
              AND lt.ngay_truc = ch.ngay_gio_bat_dau::date 
              AND lt.phong_id IS NOT NULL 
            LIMIT 1
          )
        ) as ten_phong,
        nk.chan_doan,
        nk.chong_chi_dinh,
        ch.ghi_chu_khach_hang as ghi_chu,
        ch.ghi_chu_noi_bo as ghi_chu_noi_bo,
        ch.nguoi_tao_id,
        nd_tao.ho_ten AS ten_nguoi_tao,
        ch.thoi_gian_tao as thoi_gian_tao,
        ch.thoi_gian_checkin,
        ch.thoi_gian_bat_dau as thoi_gian_bat_dau_dieu_tri,
        ch.thoi_gian_hoan_thanh,
        ch.thoi_gian_khong_den,
        ch.thoi_gian_huy,
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
      LEFT JOIN nguoi_dung nd_tao ON ch.nguoi_tao_id = nd_tao.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE kh.id = $1
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [customer_id]);
    return rows;
  }

  /**
   * A13/A14 — mô hình hủy 2 trạng thái: câu hỏi DUY NHẤT là "đã thanh toán chưa", thay hẳn bảng 10
   * nhánh cũ (loại dịch vụ × thời điểm hủy × hình thức thanh toán). Xem mục "Hủy & Hoàn tiền" trong
   * kế hoạch tổng — nguyên tắc gốc: tiền đã vào hệ thống thì không tự động đi ra.
   */
  async cancelCustomerAppointment(id: string, customer_id: string, lyDoHuy: string) {
    const checkQuery = 'SELECT * FROM cuoc_hen WHERE id = $1 AND khach_hang_id = $2';
    const checkRes = await pool.query(checkQuery, [id, customer_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }
    const appt = checkRes.rows[0];

    // ĐÃ thanh toán → không có đường tự hủy nào cả (không hoàn tiền tự động, chỉ Lễ tân đổi buổi).
    if (appt.trang_thai_thanh_toan === 'da_thanh_toan') {
      const err: any = new Error('Lịch đã thanh toán không thể tự hủy — vui lòng gọi Hotline để Lễ tân hỗ trợ đổi lịch.');
      err.statusCode = 400;
      throw err;
    }
    // Giao dịch thanh toán đang treo (đã bấm thanh toán, chưa có webhook xác nhận) — khóa hủy để
    // tránh đua với webhook (hủy đúng lúc webhook đang bay sẽ ra da_huy + da_thanh_toan, tiền kẹt).
    if (appt.trang_thai_thanh_toan === 'dang_cho_thanh_toan') {
      const err: any = new Error('Giao dịch thanh toán đang được xử lý, vui lòng đợi xác nhận xong trước khi hủy.');
      err.statusCode = 400;
      throw err;
    }

    // CHƯA thanh toán → cửa sổ 60 phút là VÀ của cả 3 vế, không chỉ mốc thời gian đơn thuần.
    const CANCEL_WINDOW_MS = 60 * 60 * 1000;
    const elapsedMs = Date.now() - new Date(appt.thoi_gian_tao).getTime();
    if (elapsedMs >= CANCEL_WINDOW_MS) {
      const err: any = new Error('Đã quá 60 phút kể từ lúc đặt lịch — không thể tự hủy nữa. Vui lòng gọi Hotline để được hỗ trợ.');
      err.statusCode = 400;
      throw err;
    }
    if (appt.trang_thai !== 'da_xac_nhan') {
      const err: any = new Error('Lịch đã check-in hoặc đang xử lý, không thể tự hủy — vui lòng gọi Hotline để được hỗ trợ.');
      err.statusCode = 400;
      throw err;
    }
    const ngayStr = new Date(appt.ngay_gio_bat_dau).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (appt.buoi && isBuoiDaQua(ngayStr, appt.buoi as Buoi)) {
      const err: any = new Error('Buổi hẹn đã kết thúc, không thể tự hủy nữa. Vui lòng gọi Hotline để được hỗ trợ.');
      err.statusCode = 400;
      throw err;
    }

    // Trần chống lạm dụng — tối đa 3 lần hủy-sớm/7 ngày. Thiếu trần này thì đặt→hủy→đặt lại reset
    // đồng hồ 60 phút vô hạn lần, biến "ô sửa sai" thành "hủy mềm trá hình" không giới hạn.
    const recentCancelsRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM cuoc_hen
       WHERE khach_hang_id = $1 AND loai_huy = 'khach_huy_som' AND thoi_gian_huy >= NOW() - INTERVAL '7 days'`,
      [customer_id]
    );
    if ((recentCancelsRes.rows[0]?.count || 0) >= 3) {
      const err: any = new Error('Bạn đã hủy sớm quá 3 lần trong 7 ngày qua — vui lòng gọi Hotline để được hỗ trợ hủy/đổi lịch.');
      err.statusCode = 400;
      throw err;
    }

    // Hủy sớm trong cửa sổ = xóa MỀM, KHÔNG phạt uy tín — đây là "ô sửa sai" cho người bấm nhầm,
    // khác hẳn Lễ tân/Admin hủy giúp ngoài cửa sổ (updateAppointmentStatus vẫn giữ nguyên
    // resolveNoShowOutcome như cũ, không đụng ở đây).
    const query = `
      UPDATE cuoc_hen
      SET trang_thai = 'da_huy', ghi_chu_noi_bo = $1, loai_huy = 'khach_huy_som', thoi_gian_huy = NOW(),
          nhan_su_id = NULL, phong_id = NULL
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [lyDoHuy, id]);
    return rows[0];
  }

  async rescheduleCustomerAppointment(id: string, customer_id: string, new_date: string, new_buoi: 'sang' | 'chieu', new_staff_id?: number | null) {
    const checkQuery = 'SELECT * FROM cuoc_hen WHERE id = $1 AND khach_hang_id = $2';
    const checkRes = await pool.query(checkQuery, [id, customer_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }
    const appt = checkRes.rows[0];

    // Chỉ cho phép đổi lịch đối với lịch ĐÃ THANH TOÁN
    if (appt.trang_thai_thanh_toan !== 'da_thanh_toan') {
      const err: any = new Error('Chức năng tự đổi lịch online chỉ áp dụng cho lịch đã thanh toán. Đối với lịch chưa thanh toán, quý khách có thể hủy lịch trong vòng 60 phút và đặt lại.');
      err.statusCode = 400;
      throw err;
    }

    // Kiểm tra mốc 50% thời lượng buổi hôm nay
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentApptDateStr = new Date(appt.ngay_gio_bat_dau).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    if (currentApptDateStr === todayStr) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      // Ca sáng (07:30 - 12:00). Mốc 50% là 09:45 (585 phút)
      // Ca chiều (12:00 - 20:00). Mốc 50% là 16:00 (960 phút)
      const cutoffMinutes = appt.buoi === 'sang' ? (7 * 60 + 30 + 135) : (12 * 60 + 240);
      if (nowMinutes >= cutoffMinutes) {
        const err: any = new Error(`Đã quá 50% thời lượng buổi hôm nay (${appt.buoi === 'sang' ? 'sau 09h45' : 'sau 16h00'}). Quý khách không thể tự đổi lịch online nữa, vui lòng liên hệ hotline 0398 655 332 để trung tâm hỗ trợ.`);
        err.statusCode = 400;
        throw err;
      }
    }

    if (appt.trang_thai !== 'da_xac_nhan') {
      const err: any = new Error('Lịch đã check-in hoặc đang làm dịch vụ, không thể tự đổi lịch online.');
      err.statusCode = 400;
      throw err;
    }

    const startHour = new_buoi === 'sang' ? 7 : 12;
    const startMinute = new_buoi === 'sang' ? 30 : 0;
    const duration = Number(appt.thoi_luong_phut) || 30;
    const startIso = `${new_date}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00+07:00`;
    const endDateObj = new Date(new Date(startIso).getTime() + duration * 60 * 1000);
    const endIso = endDateObj.toISOString();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM phien_lam_viec WHERE cuoc_hen_id = $1', [id]);

      const updateRes = await client.query(
        `UPDATE cuoc_hen
         SET ngay_gio_bat_dau = $1,
             ngay_gio_ket_thuc = $2,
             buoi = $3,
             nhan_su_id = $4,
             trang_thai = 'da_xac_nhan',
             gan_qua_hang_doi = false
         WHERE id = $5
         RETURNING *`,
        [startIso, endIso, new_buoi, new_staff_id || null, id]
      );

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async cancelBreakTimeAppointments(): Promise<{ cancelled_count: number }> {
    return { cancelled_count: 0 };
  }

  /**
   * A12 — tối đa 1 buổi Lượng giá (KHAM/KHAM_MOI) / ngày cho 1 khách hàng. Đặt 2 buổi Lượng giá
   * trong cùng 1 ngày là vô nghĩa về nghiệp vụ; giới hạn chung "3 lịch đang hoạt động" (toàn thời
   * gian, không theo ngày) nằm ở `checkCustomerActiveLimit` — hai hàm này KHÔNG thay thế nhau.
   */
  async checkCustomerHasClinicalExamOnDate(khach_hang_id: string | null, so_dien_thoai: string | null, dateStr: string): Promise<boolean> {
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

    const { rows } = await pool.query(
      `SELECT 1 FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI')
       AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den', 'khach_khong_den')
       AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3::date
       LIMIT 1`,
      [khach_hang_id || null, effectivePhone || null, dateStr]
    );
    return rows.length > 0;
  }

  async checkPhoneTakenByOther(phone: string, excludeUserId: string): Promise<boolean> {
    if (!phone || !excludeUserId) return false;
    const res = await pool.query(
      'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
      [phone.trim(), excludeUserId]
    );
    return res.rows.length > 0;
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
    const khach_hang = await adminCustomerRepository.findCustomerByIdOrIdentifier(customer_id);
    if (!khach_hang) return null;

    const realKhachHangId = khach_hang.id;

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
        NULL::timestamptz as khuyen_nghi_han_kich_hoat
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
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.loai IN ('KHAM', 'KHAM_MOI')
        AND ch.trang_thai = 'hoan_thanh'
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const examRes = await pool.query(examQuery, [realKhachHangId]);

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
        pd.han_su_dung,
        hd.id as hoa_don_id,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_phai_tra,
        CAST(hd.so_tien_da_tra AS double precision) as so_tien_da_tra,
        hd.trang_thai as trang_thai_hoa_don,
        hd.hinh_thuc_thanh_toan_goi,
        CAST(hd.tong_tien_goc AS double precision) as tong_tien_goc,
        CAST(hd.so_tien_giam_voucher AS double precision) as so_tien_giam_voucher,
        g.loai_goi
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1::uuid
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST;
    `;
    const packageRes = await pool.query(packageQuery, [realKhachHangId]);

    // 3. Các buổi thuộc gói. Nếu 1 buổi từng "không đến" rồi khách đặt lại và hoàn thành (không mất
    // buổi với tung_buoi, xem resolveNoShowOutcome), DB sẽ có 2 dòng cuoc_hen cùng
    // (phac_do_dieu_tri_id, so_thu_tu_buoi) — dòng không đến cũ vẫn giữ nguyên cho mục đích tra cứu
    // lịch sử ở nơi khác, nhưng trang khách hàng chỉ cần biết trạng thái HIỆN TẠI của từng buổi.
    // DISTINCT ON lấy đúng 1 dòng/buổi, ưu tiên hoàn thành > đang diễn ra/đã đặt lịch > không đến >
    // đã hủy (đồng hạng thì lấy dòng mới nhất).
    const sessionQuery = `
      SELECT DISTINCT ON (ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi)
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
        nk.du_lieu_tri_lieu,
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
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.phac_do_dieu_tri_id IS NOT NULL
      ORDER BY ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi ASC,
        CASE ch.trang_thai
          WHEN 'hoan_thanh' THEN 0
          WHEN 'khong_den' THEN 2
          WHEN 'da_huy' THEN 3
          ELSE 1
        END ASC,
        ch.ngay_gio_bat_dau DESC;
    `;
    const sessionRes = await pool.query(sessionQuery, [realKhachHangId]);

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
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.loai != 'KHAM'
        AND ch.loai != 'KHAM_MOI'
        AND (ch.trang_thai = 'hoan_thanh' OR hd.id IS NOT NULL)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const singleRes = await pool.query(singleQuery, [realKhachHangId]);

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
              OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND hd.hinh_thuc_thanh_toan_goi = 'tra_thang')
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
          WHEN hd.phac_do_dieu_tri_id IS NULL AND hd.tong_tien_goc > COALESCE(dv.don_gia, 0) THEN 0
          WHEN hd.cuoc_hen_id IS NOT NULL THEN COALESCE(dv.don_gia, 0)
          ELSE 0
        END as chi_phi_kham,
        -- CHỈ tính là "đã đóng khám riêng TRƯỚC KHI mua gói" nếu hóa đơn khám đó được tạo TRƯỚC hóa
        -- đơn gói này (sep_hd.ngay_tao < hd.ngay_tao) — mirror đúng fix ở admin.repository.ts, xem
        -- chú thích đầy đủ ở đó.
        (
          SELECT 'HD-' || UPPER(SUBSTRING(sep_hd.id::text FROM 1 FOR 6))
          FROM hoa_don sep_hd
          WHERE sep_hd.cuoc_hen_id = hd.cuoc_hen_id
            AND sep_hd.phac_do_dieu_tri_id IS NULL
            AND sep_hd.trang_thai = 'da_thanh_toan'
            AND sep_hd.tong_tien_phai_tra > 0
            AND sep_hd.id != hd.id
            AND sep_hd.ngay_tao < hd.ngay_tao
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
            AND sep_hd.ngay_tao < hd.ngay_tao
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
      -- Sắp theo lần thanh toán gần nhất — mirror đúng fix ở admin.repository.ts::getInvoices(), xem
      -- chú thích đầy đủ ở đó.
      ORDER BY COALESCE(
        (SELECT MAX(gt.ngay_giao_dich) FROM giao_dich_thanh_toan gt WHERE gt.hoa_don_id = hd.id),
        hd.ngay_tao
      ) DESC
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

}

export default new AppointmentRepository();

