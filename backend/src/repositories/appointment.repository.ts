import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

class AppointmentRepository {
  async getAllAppointments() {
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, 
        ld.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ld.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ld.trang_thai, 'kham_moi' as loai_lich,
        COALESCE(nd_kh.ho_ten, ld.ho_ten_khach) AS ten_khach_hang, 
        COALESCE(nd_kh.so_dien_thoai, ld.so_dien_thoai) AS so_dien_thoai,
        kh.id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ld.ky_thuat_vien_id,
        ld.phong_id,
        p.ten_phong,
        ld.chan_doan,
        ld.chong_chi_dinh,
        ld.khuyen_nghi_dich_vu_id,
        ld.khuyen_nghi_goi_id,
        kn_dv.ten_dich_vu AS khuyen_nghi_ten_dich_vu,
        kn_goi.ten_goi AS khuyen_nghi_ten_goi,
        NULL::integer AS so_thu_tu_buoi,
        NULL::uuid AS goi_dich_vu_id,
        COALESCE(hd.trang_thai, 'chua_thanh_toan') AS trang_thai_thanh_toan,
        ld.ly_do_huy AS ly_do_huy,
        ld.ly_do_kham,
        ld.ghi_chu_dat_lich
      FROM lich_dat ld
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      LEFT JOIN dich_vu kn_dv ON ld.khuyen_nghi_dich_vu_id = kn_dv.id
      LEFT JOIN goi_dich_vu kn_goi ON ld.khuyen_nghi_goi_id = kn_goi.id
      LEFT JOIN lich_dieu_tri ldt ON ldt.lich_dat_id = ld.id
      LEFT JOIN hoa_don hd ON hd.lich_dieu_tri_id = ldt.id
      
      UNION ALL
      
      SELECT 
        btl.id, 'TR' || UPPER(SUBSTRING(btl.id::text FROM 1 FOR 6)) as ma_lich_dat,
        btl.thoi_gian_bat_dau as ngay_gio_bat_dau, 
        btl.thoi_gian_ket_thuc as ngay_gio_ket_thuc, 
        btl.trang_thai, 'dieu_tri' as loai_lich,
        nd_kh.ho_ten AS ten_khach_hang, 
        nd_kh.so_dien_thoai AS so_dien_thoai,
        kh.id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        btl.ky_thuat_vien_id,
        btl.phong_id,
        p.ten_phong,
        ld_goc.chan_doan,
        ld_goc.chong_chi_dinh,
        NULL::uuid AS khuyen_nghi_dich_vu_id,
        ld_goc.khuyen_nghi_goi_id AS khuyen_nghi_goi_id,
        NULL::text AS khuyen_nghi_ten_dich_vu,
        kn_goi.ten_goi AS khuyen_nghi_ten_goi,
        btl.so_thu_tu_buoi,
        ldt.goi_dich_vu_id,
        COALESCE(hd.trang_thai, 'chua_thanh_toan') AS trang_thai_thanh_toan,
        NULL::text AS ly_do_huy,
        NULL::text AS ly_do_kham,
        NULL::text AS ghi_chu_dat_lich
      FROM buoi_tri_lieu btl
      JOIN khach_hang kh ON btl.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON btl.phong_id = p.id
      LEFT JOIN lich_dieu_tri ldt ON btl.lich_dieu_tri_id = ldt.id
      LEFT JOIN lich_dat ld_goc ON ldt.lich_dat_id = ld_goc.id
      LEFT JOIN goi_dich_vu kn_goi ON ld_goc.khuyen_nghi_goi_id = kn_goi.id
      LEFT JOIN hoa_don hd ON hd.lich_dieu_tri_id = btl.lich_dieu_tri_id
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, email, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, loai_lich, dang_ky_goi_id } = data;

    let final_khach_hang_id = khach_hang_id;

    if (loai_lich === 'dieu_tri') {
      if (!final_khach_hang_id && (email || so_dien_thoai)) {
        // 1. Search existing customer by email or phone
        let existCust = null;
        if (email) {
          const res = await pool.query('SELECT kh.id FROM khach_hang kh JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id WHERE nd.email = $1', [email]);
          if (res.rows.length > 0) existCust = res.rows[0];
        }
        if (!existCust && so_dien_thoai) {
          const res = await pool.query('SELECT kh.id FROM khach_hang kh JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id WHERE nd.so_dien_thoai = $1', [so_dien_thoai]);
          if (res.rows.length > 0) existCust = res.rows[0];
        }

        if (existCust) {
          final_khach_hang_id = existCust.id;
        } else {
          // 2. Create new user with password hash (default password '123456')
          const targetEmail = email || `${so_dien_thoai || 'guest_' + Math.floor(Math.random() * 100000)}@physioflow.placeholder`;
          const defaultPassword = '123456';
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(defaultPassword, salt);

          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            const { rows: newUser } = await client.query(`
              INSERT INTO nguoi_dung (ho_ten, so_dien_thoai, email, mat_khau_hash, vai_tro_id, da_xac_thuc_email) 
              VALUES ($1, $2, $3, $4, (SELECT id FROM vai_tro WHERE ma_vai_tro = 'khach_hang'), TRUE) RETURNING id
            `, [ho_ten_khach || 'Khách vãng lai', so_dien_thoai || null, targetEmail, hash]);
            const { rows: newKh } = await client.query(`
              INSERT INTO khach_hang (nguoi_dung_id, gioi_tinh) VALUES ($1, $2) RETURNING id
            `, [newUser[0].id, gioi_tinh_khach || 'khac']);
            await client.query('COMMIT');
            final_khach_hang_id = newKh[0].id;
          } catch (e) {
            await client.query('ROLLBACK');
            throw e;
          } finally {
            client.release();
          }
        }
      }

      // Check if user already has an active/completed session under a trial plan (dang_trai_nghiem)
      if (final_khach_hang_id) {
        const checkRes = await pool.query(
          `SELECT COUNT(*) FROM buoi_tri_lieu btl
           JOIN lich_dieu_tri ldt ON btl.lich_dieu_tri_id = ldt.id
           WHERE ldt.khach_hang_id = $1 AND ldt.trang_thai = 'dang_trai_nghiem' AND btl.trang_thai != 'da_huy'`,
          [final_khach_hang_id]
        );
        const sessionCount = parseInt(checkRes.rows[0].count || '0');
        if (sessionCount >= 1) {
          throw new Error('Gói dùng thử của bạn đã hết lượt trải nghiệm (tối đa 1 buổi). Vui lòng thanh toán gói để tiếp tục đặt lịch.');
        }
      }

      let ldtId = null;
      let target_dich_vu_id = dich_vu_id;

      if (dang_ky_goi_id) {
        // Query total sessions from package
        let tong_so_buoi = 1;
        const goiRes = await pool.query('SELECT tong_so_buoi FROM goi_dich_vu WHERE id = $1', [dang_ky_goi_id]);
        if (goiRes.rows.length > 0) {
          tong_so_buoi = goiRes.rows[0].tong_so_buoi;
        }

        const ldtRes = await pool.query(`
          INSERT INTO lich_dieu_tri(khach_hang_id, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, lich_dat_id, ho_ten_khach, so_dien_thoai) 
          VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8) RETURNING id
        `, [final_khach_hang_id, 'theo_goi', dang_ky_goi_id, tong_so_buoi, 'dang_trai_nghiem', data.lich_dat_id || null, ho_ten_khach || null, so_dien_thoai || null]);
        ldtId = ldtRes.rows[0].id;

        if (!target_dich_vu_id) {
          const ktRes = await pool.query('SELECT dich_vu_id FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id = $1 LIMIT 1', [dang_ky_goi_id]);
          if (ktRes.rows.length > 0) {
            target_dich_vu_id = ktRes.rows[0].dich_vu_id;
          }
        }
      } else {
        const ldtRes = await pool.query(`
          INSERT INTO lich_dieu_tri(khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, lich_dat_id, ho_ten_khach, so_dien_thoai) 
          VALUES ($1, $2, $3, 1, 0, $4, $5, $6, $7) RETURNING id
        `, [final_khach_hang_id, 'dich_vu_le', target_dich_vu_id, 'dang_dieu_tri', data.lich_dat_id || null, ho_ten_khach || null, so_dien_thoai || null]);
        ldtId = ldtRes.rows[0].id;
      }

      // First treatment session should be 'cho_xac_nhan' initially, with optional KTV and Room
      const btlRes = await pool.query(`
        INSERT INTO buoi_tri_lieu(lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [ldtId, final_khach_hang_id, ky_thuat_vien_id || null, phong_id || null, target_dich_vu_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, 'cho_xac_nhan']);

      return btlRes.rows[0];
    } else {
      const query = `
        INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, nguoi_tao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'le_tan')
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        ma_lich_dat, khach_hang_id || null, ho_ten_khach || null, so_dien_thoai || null, gioi_tinh_khach || null, dich_vu_id || null, ky_thuat_vien_id || null, phong_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich || null, ly_do_kham || null
      ]);
      return rows[0];
    }
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const { nguoi_dung_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trieu_chung, anh_dinh_kem_url, trang_thai } = data;

    let khach_hang_id = null;
    if (nguoi_dung_id) {
      const res = await pool.query('SELECT id FROM khach_hang WHERE nguoi_dung_id = $1', [nguoi_dung_id]);
      if (res.rows.length > 0) {
        khach_hang_id = res.rows[0].id;
      }
    }

    const query = `
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, trang_thai, nguoi_tao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'guest')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, khach_hang_id || null, ho_ten_khach || null, so_dien_thoai || null, gioi_tinh_khach || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, trieu_chung || ly_do_kham || null, anh_dinh_kem_url || null, trang_thai || 'cho_xac_nhan'
    ]);
    return rows[0];
  }

  async updateAppointmentStatus(id: string, data: { trang_thai: string; ky_thuat_vien_id?: string | null; phong_id?: string | number | null; ly_do_huy?: string | null }) {
    const updates = ['trang_thai = $1'];
    const values: any[] = [data.trang_thai];
    let paramIndex = 2;

    if (data.ky_thuat_vien_id !== undefined) {
      updates.push(`ky_thuat_vien_id = $${paramIndex}`);
      values.push(data.ky_thuat_vien_id);
      paramIndex++;
    }

    if (data.phong_id !== undefined) {
      updates.push(`phong_id = $${paramIndex}`);
      values.push(data.phong_id);
      paramIndex++;
    }

    if (data.ly_do_huy !== undefined) {
      updates.push(`ly_do_huy = $${paramIndex}`);
      values.push(data.ly_do_huy);
      paramIndex++;
      if (data.trang_thai === 'da_huy' || data.trang_thai === 'cho_huy') {
        updates.push(`thoi_gian_huy = NOW()`);
      }
    } else if (data.trang_thai === 'da_huy') {
      updates.push(`thoi_gian_huy = NOW()`);
    }

    values.push(id);

    let query = `
      UPDATE lich_dat 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    let { rows } = await pool.query(query, values);

    // Nếu không tìm thấy trong lịch đặt (khám mới), có thể nó là buổi trị liệu
    if (rows.length === 0) {
      query = `
        UPDATE buoi_tri_lieu 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      const res = await pool.query(query, values);
      rows = res.rows;

      if (rows.length > 0) {
        await this.updateCompletedSessionsCount(id);
      }
    }

    return rows[0];
  }

  async updateMedicalRecord(id: string, data: { chan_doan?: string, chong_chi_dinh?: string, khuyen_nghi_dich_vu_id?: string | null, khuyen_nghi_goi_id?: string | null }) {
    const query = `
      UPDATE lich_dat 
      SET chan_doan = $1, chong_chi_dinh = $2, khuyen_nghi_dich_vu_id = $3, khuyen_nghi_goi_id = $4
      WHERE id = $5 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [data.chan_doan || null, data.chong_chi_dinh || null, data.khuyen_nghi_dich_vu_id || null, data.khuyen_nghi_goi_id || null, id]);
    if (rows.length === 0) {
      throw new Error('Không tìm thấy lịch khám để cập nhật hồ sơ');
    }
    return rows[0];
  }

  async updateCompletedSessionsCount(buoi_tri_lieu_id: string) {
    const btlRes = await pool.query('SELECT lich_dieu_tri_id FROM buoi_tri_lieu WHERE id = $1', [buoi_tri_lieu_id]);
    if (btlRes.rows.length === 0) return;
    const ldtId = btlRes.rows[0].lich_dieu_tri_id;
    if (!ldtId) return;

    // Count actual completed buoi_tri_lieu sessions (excluding cancellations/no-shows)
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM buoi_tri_lieu WHERE lich_dieu_tri_id = $1 AND trang_thai = 'hoan_thanh'",
      [ldtId]
    );
    const completedCount = parseInt(countRes.rows[0].count || '0');

    // Update lich_dieu_tri.so_buoi_da_dung
    await pool.query(
      'UPDATE lich_dieu_tri SET so_buoi_da_dung = $1 WHERE id = $2',
      [completedCount, ldtId]
    );
  }

  async getCustomerAppointments(nguoi_dung_id: string) {
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, 
        ld.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ld.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ld.trang_thai, 'kham_moi' as loai_lich,
        COALESCE(nd_kh.ho_ten, ld.ho_ten_khach) AS ten_khach_hang, 
        COALESCE(nd_kh.so_dien_thoai, ld.so_dien_thoai) AS so_dien_thoai,
        kh.id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ld.ky_thuat_vien_id,
        ld.phong_id,
        p.ten_phong,
        ld.chan_doan,
        ld.chong_chi_dinh,
        ld.ly_do_huy,
        ld.thoi_gian_huy,
        ld.ly_do_kham,
        ld.thoi_gian_tao
      FROM lich_dat ld
      JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      WHERE nd_kh.id = $1
      ORDER BY ld.thoi_gian_tao DESC, ld.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [nguoi_dung_id]);
    return rows;
  }

  async cancelCustomerAppointment(id: string, nguoi_dung_id: string, ly_do_huy: string) {
    const checkQuery = `
      SELECT ld.id 
      FROM lich_dat ld
      JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      WHERE ld.id = $1 AND kh.nguoi_dung_id = $2
    `;
    const checkRes = await pool.query(checkQuery, [id, nguoi_dung_id]);
    if (checkRes.rows.length === 0) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thuộc quyền quản lý của bạn.');
    }

    const query = `
      UPDATE lich_dat
      SET trang_thai = 'cho_huy', ly_do_huy = $1, thoi_gian_huy = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [ly_do_huy, id]);
    return rows[0];
  }

  async getPublicAppointmentById(id: string) {
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, 
        ld.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ld.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ld.trang_thai,
        ld.ho_ten_khach, 
        ld.so_dien_thoai,
        ld.gioi_tinh_khach,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ld.ky_thuat_vien_id,
        ld.phong_id,
        p.ten_phong,
        ld.chan_doan,
        ld.chong_chi_dinh,
        ld.ly_do_huy,
        ld.thoi_gian_huy,
        ld.ly_do_kham,
        ld.ghi_chu_dat_lich,
        ld.thoi_gian_tao
      FROM lich_dat ld
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      WHERE ld.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  async getCustomerMedicalRecord(nguoi_dung_id: string) {
    const khRes = await pool.query('SELECT id FROM khach_hang WHERE nguoi_dung_id = $1', [nguoi_dung_id]);
    if (khRes.rows.length === 0) return null;
    const khach_hang_id = khRes.rows[0].id;

    const query = `
      SELECT 
        hs.id, 
        ld.ma_lich_dat as ma_danh_gia, 
        hs.thoi_gian_tao as ngay_danh_gia, 
        hs.chan_doan, 
        hs.trang_thai,
        hs.ho_ten_khach as ten_khach_hang, 
        hs.so_dien_thoai,
        hs.trieu_chung,
        hs.ghi_chu,
        hs.phuong_phap_dieu_tri,
        hs.loai_goi,
        hs.ten_goi,
        hs.so_luong_buoi,
        hs.so_luong_goi,
        hs.gia_tien,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham
      FROM ho_so_dieu_tri hs
      LEFT JOIN lich_dat ld ON hs.lich_dat_id = ld.id
      LEFT JOIN chuyen_gia_y_te bs ON hs.bac_si_id = bs.id
      LEFT JOIN nguoi_dung nd_bs ON bs.nguoi_dung_id = nd_bs.id
      LEFT JOIN phong p_kham ON hs.phong_kham_id = p_kham.id
      WHERE hs.khach_hang_id = $1
      ORDER BY hs.thoi_gian_tao DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [khach_hang_id]);
    return rows[0] || null;
  }

  async getCustomerTreatmentSessions(nguoi_dung_id: string) {
    const khRes = await pool.query('SELECT id FROM khach_hang WHERE nguoi_dung_id = $1', [nguoi_dung_id]);
    if (khRes.rows.length === 0) return [];
    const khach_hang_id = khRes.rows[0].id;

    const query = `
      SELECT 
        btl.id,
        btl.so_thu_tu_buoi,
        btl.thoi_gian_bat_dau,
        btl.thoi_gian_ket_thuc,
        btl.trang_thai,
        btl.canh_bao_dac_biet,
        btl.ai_tom_tat_ngan,
        btl.danh_gia_truoc_buoi,
        btl.danh_gia_sau_buoi,
        btl.danh_gia_hieu_qua,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        dv.ten_dich_vu,
        ldt.ten_goi
      FROM buoi_tri_lieu btl
      JOIN lich_dieu_tri ldt ON btl.lich_dieu_tri_id = ldt.id
      LEFT JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      WHERE btl.khach_hang_id = $1
      ORDER BY btl.so_thu_tu_buoi DESC, btl.thoi_gian_bat_dau DESC
    `;
    const { rows } = await pool.query(query, [khach_hang_id]);
    return rows;
  }
}

export default new AppointmentRepository();
