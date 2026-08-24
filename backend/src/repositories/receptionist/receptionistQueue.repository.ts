import { pool } from '../../config/db';
import { GIO_NHAN_KHACH, NO_SHOW_SWEEP_BUFFER_MINUTES } from '../../domain/capacity';
import appointmentRepository from '../appointments';

export class ReceptionistQueueRepository {
  /**
   * B10 — quét "lười" các lịch đã xác nhận nhưng chưa check-in mà buổi đã kết thúc quá
   * NO_SHOW_SWEEP_BUFFER_MINUTES phút, tự động đánh dấu "không đến".
   */
  async sweepNoShowAppointments(): Promise<number> {
    const { rows } = await pool.query(
      `SELECT id FROM cuoc_hen
       WHERE trang_thai = 'da_xac_nhan'
         AND buoi IS NOT NULL
         AND (
           (DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::text || ' ' ||
             CASE WHEN buoi = 'sang' THEN $1 ELSE $2 END
           )::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
           + ($3 || ' minutes')::interval
           <= NOW()
         )`,
      [GIO_NHAN_KHACH.sang.ketThuc, GIO_NHAN_KHACH.chieu.ketThuc, NO_SHOW_SWEEP_BUFFER_MINUTES]
    );

    let count = 0;
    for (const row of rows) {
      try {
        await this.updateAppointmentStatus(
          row.id,
          'khong_den',
          `Tự động đánh dấu không đến — quá giờ nhận khách ${NO_SHOW_SWEEP_BUFFER_MINUTES} phút, khách chưa check-in.`
        );
        count++;
      } catch (err) {
        console.error(`Lỗi khi tự động đánh dấu không đến cho lịch ${row.id}:`, err);
      }
    }

    // Quét tự động hoàn thành các ca chờ tái lượng giá đã quá hạn
    try {
      await pool.query(`
        WITH expired_reassessments AS (
          UPDATE cuoc_hen
          SET trang_thai = 'hoan_thanh',
              thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW()),
              ghi_chu_noi_bo = COALESCE(ghi_chu_noi_bo || E'\n', '') || 'Tự động hoàn thành — quá hạn tái lượng giá mà khách không quay lại.'
          WHERE trang_thai = 'cho_tai_luong_gia'
            AND han_tai_kham IS NOT NULL
            AND han_tai_kham < NOW()
          RETURNING id
        )
        UPDATE nhat_ky_buoi_dieu_tri nk
        SET ghi_chu = REGEXP_REPLACE(
          nk.ghi_chu,
          '(\\[Hạn tái lượng giá:[^\\]]+)(\\])',
          '\\1 - Đã quá hạn khách không quay lại\\2'
        )
        WHERE nk.cuoc_hen_id IN (SELECT id FROM expired_reassessments)
          AND nk.ghi_chu LIKE '%[Hạn tái lượng giá:%'
          AND nk.ghi_chu NOT LIKE '%Đã quá hạn khách không quay lại%';
      `);

      await pool.query(`
        UPDATE nhat_ky_buoi_dieu_tri
        SET ghi_chu = TRIM(REGEXP_REPLACE(ghi_chu, '\\[Hẹn tái khám hạn:[^\\]]+\\]\\s*', '', 'g'))
        WHERE ghi_chu LIKE '%[Hẹn tái khám hạn:%';
      `);
    } catch (err) {
      console.error('Lỗi khi quét tự động hoàn thành ca chờ tái lượng giá quá hạn:', err);
    }

    return count;
  }

  async getStaffWorkload(targetDate: string) {
    const VAI_TRO_ID_KTV = 3;
    const queryStr = `
      SELECT 
        ns.id as nhan_su_id,
        ns.ho_ten,
        ns.vai_tro_id,
        vt.ten_vai_tro,
        CASE WHEN ns.vai_tro_id = ${VAI_TRO_ID_KTV} THEN 2 ELSE 1 END as so_khach_song_song,
        to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau,
        to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc,
        p.ten_phong,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'dang_kham')::integer as so_ca_dang_lam,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'da_checkin')::integer as so_ca_cho,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'cho_tai_luong_gia')::integer as so_ca_cho_tai_luong_gia,
        MAX(ch.thoi_gian_bat_dau + (COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, 30) || ' minutes')::interval) FILTER (WHERE ch.trang_thai = 'dang_kham') as thoi_gian_xong_du_kien_muon_nhat
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung ns ON lt.nhan_su_id = ns.id
      JOIN vai_tro vt ON ns.vai_tro_id = vt.id
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      LEFT JOIN cuoc_hen ch ON ch.nhan_su_id = ns.id 
          AND ch.trang_thai IN ('dang_kham', 'da_checkin', 'cho_tai_luong_gia') 
          AND (DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date)
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE lt.ngay_truc = $1::date
      GROUP BY ns.id, ns.ho_ten, ns.vai_tro_id, vt.ten_vai_tro, lt.gio_bat_dau, lt.gio_ket_thuc, p.ten_phong
      ORDER BY ns.vai_tro_id DESC, ns.ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [targetDate]);
    return rows;
  }

  async unassignAppointmentStaff(id: string) {
    const queryStr = `
      UPDATE cuoc_hen
      SET nhan_su_id = NULL
      WHERE id = $1::uuid AND trang_thai IN ('da_xac_nhan', 'da_checkin')
      RETURNING id, nhan_su_id, trang_thai;
    `;
    const { rows } = await pool.query(queryStr, [id]);
    return rows[0] || null;
  }

  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    return await appointmentRepository.updateAppointmentStatus(
      id,
      { trang_thai, ghi_chu_noi_bo },
      2
    );
  }
}

export default new ReceptionistQueueRepository();
