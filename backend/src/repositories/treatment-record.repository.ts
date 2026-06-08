import { pool } from '../config/db';

class TreatmentRecordRepository {
  async createTreatmentRecord(data: any) {
    const query = `
      INSERT INTO ho_so_dieu_tri (
        lich_dat_id, khach_hang_id, ho_ten_khach, so_dien_thoai, trieu_chung,
        bac_si_id, phong_kham_id, ghi_chu, phuong_phap_dieu_tri,
        goi_dich_vu_id, loai_goi, ten_goi, so_luong_buoi, gia_tien,
        chan_doan, so_luong_goi, trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'cho_dieu_phoi')
      RETURNING *
    `;
    const values = [
      data.lich_dat_id || null,
      data.khach_hang_id || null,
      data.ho_ten_khach || null,
      data.so_dien_thoai || null,
      data.trieu_chung || null,
      data.bac_si_id || null,
      data.phong_kham_id || null,
      data.ghi_chu || null,
      data.phuong_phap_dieu_tri || null,
      data.goi_dich_vu_id || null,
      data.loai_goi || null,
      data.ten_goi || null,
      data.so_luong_buoi || null,
      data.gia_tien || null,
      data.chan_doan || null,
      data.so_luong_goi || 1
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async getTreatmentRecords() {
    const query = `
      SELECT 
        hs.*,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        nd_ktv.ho_ten as ten_ky_thuat_vien_hien_tai,
        p_tri.ten_phong as ten_phong_tri_lieu_hien_tai
      FROM ho_so_dieu_tri hs
      LEFT JOIN chuyen_gia_y_te bs ON hs.bac_si_id = bs.id
      LEFT JOIN nguoi_dung nd_bs ON bs.nguoi_dung_id = nd_bs.id
      LEFT JOIN phong p_kham ON hs.phong_kham_id = p_kham.id
      LEFT JOIN chuyen_gia_y_te ktv ON hs.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p_tri ON hs.phong_tri_lieu_id = p_tri.id
      ORDER BY hs.thoi_gian_tao DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async assignTreatmentRecord(id: string, data: { ky_thuat_vien_id: string; phong_tri_lieu_id: string }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Update ho_so_dieu_tri
      const updateQuery = `
        UPDATE ho_so_dieu_tri
        SET ky_thuat_vien_id = $1, phong_tri_lieu_id = $2, trang_thai = 'da_dieu_phoi', thoi_gian_cap_nhat = NOW()
        WHERE id = $3
        RETURNING *
      `;
      const updateRes = await client.query(updateQuery, [data.ky_thuat_vien_id, data.phong_tri_lieu_id, id]);
      if (updateRes.rows.length === 0) {
        throw new Error('Không tìm thấy hồ sơ điều trị');
      }
      const record = updateRes.rows[0];
      
      // 2. Determine package or single service details
      const tong_so_buoi = (record.so_luong_buoi || 1) * (record.so_luong_goi || 1);
      
      let target_dich_vu_id = null;
      if (record.goi_dich_vu_id) {
        const ktRes = await client.query('SELECT dich_vu_id FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id = $1 LIMIT 1', [record.goi_dich_vu_id]);
        if (ktRes.rows.length > 0) {
          target_dich_vu_id = ktRes.rows[0].dich_vu_id;
        }
      }
      
      if (!target_dich_vu_id) {
        const dvRes = await client.query('SELECT id FROM dich_vu WHERE trang_thai = \'hoat_dong\' LIMIT 1');
        if (dvRes.rows.length > 0) {
          target_dich_vu_id = dvRes.rows[0].id;
        }
      }
      
      // 3. Create lich_dieu_tri
      const ldtQuery = `
        INSERT INTO lich_dieu_tri(
          khach_hang_id, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, lich_dat_id, phong_id, ho_ten_khach, so_dien_thoai
        ) VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      const ldtRes = await client.query(ldtQuery, [
        record.khach_hang_id,
        record.goi_dich_vu_id ? 'theo_goi' : 'dich_vu_le',
        record.goi_dich_vu_id || null,
        tong_so_buoi,
        record.goi_dich_vu_id ? 'dang_trai_nghiem' : 'dang_dieu_tri',
        record.lich_dat_id || null,
        data.phong_tri_lieu_id,
        record.ho_ten_khach,
        record.so_dien_thoai
      ]);
      const ldtId = ldtRes.rows[0].id;
      
      // 4. Create first buoi_tri_lieu session starting soon
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour session duration
      
      const btlQuery = `
        INSERT INTO buoi_tri_lieu(
          lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai, so_thu_tu_buoi
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
        RETURNING *
      `;
      const btlRes = await client.query(btlQuery, [
        ldtId,
        record.khach_hang_id,
        data.ky_thuat_vien_id,
        data.phong_tri_lieu_id,
        target_dich_vu_id,
        startTime.toISOString(),
        endTime.toISOString(),
        'dang_thuc_hien'
      ]);
      
      await client.query('COMMIT');
      return { record, session: btlRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new TreatmentRecordRepository();
