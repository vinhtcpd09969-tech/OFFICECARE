import { pool } from '../config/db';

class AdminRepository {
  constructor() {
    this.initDatabase();
  }

  async initDatabase() {
    try {
      await pool.query(`
        ALTER TABLE danh_muc_dich_vu 
        ADD COLUMN IF NOT EXISTS loai_danh_muc VARCHAR(20) DEFAULT 'dich_vu'
      `);
      console.log('Database verified: loai_danh_muc column exists in danh_muc_dich_vu.');
    } catch (err) {
      console.error('Error verifying/altering database tables:', err);
    }
  }

  // --- QUẢN LÝ DỊCH VỤ & DANH MỤC ---
  async getCategories() {
    const { rows } = await pool.query('SELECT * FROM danh_muc_dich_vu ORDER BY thu_tu_hien_thi ASC, id ASC');
    return rows;
  }

  async getRooms() {
    const { rows } = await pool.query('SELECT * FROM phong ORDER BY id ASC');
    return rows;
  }

  async createRoom(data: any) {
    const isKhamBenh = data.loai_phong === 'kham_benh' || data.loai_phong === 'phong_kham';
    const finalGiuong = isKhamBenh ? 1 : (data.suc_chua !== undefined ? Number(data.suc_chua) : 1);
    
    const { rows } = await pool.query(
      `INSERT INTO phong (ten_phong, ma_phong, loai_phong, mo_ta, trang_thai, suc_chua)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.ten_phong,
        data.ma_phong,
        data.loai_phong || 'phong_tri_lieu_chuan',
        data.mo_ta || null,
        data.trang_thai || 'san_sang',
        finalGiuong
      ]
    );
    return rows[0];
  }

  async updateRoom(id: string | number, data: any) {
    const isKhamBenh = data.loai_phong === 'kham_benh' || data.loai_phong === 'phong_kham';
    const finalGiuong = isKhamBenh ? 1 : (data.suc_chua !== undefined ? Number(data.suc_chua) : 1);

    const { rows } = await pool.query(
      `UPDATE phong 
       SET ten_phong = $1, ma_phong = $2, loai_phong = $3, mo_ta = $4, trang_thai = $5, suc_chua = $6
       WHERE id = $7 RETURNING *`,
      [
        data.ten_phong,
        data.ma_phong,
        data.loai_phong,
        data.mo_ta || null,
        data.trang_thai,
        finalGiuong,
        id
      ]
    );
    return rows[0];
  }

  async deleteRoom(id: string | number) {
    const { rows } = await pool.query('DELETE FROM phong WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  async createCategory(data: any) {
    const an_hien = data.trang_thai !== 'vo_hieu';
    const loai_danh_muc = data.loai_danh_muc || 'dich_vu';
    const thu_tu_hien_thi = data.thu_tu_hien_thi || 0;
    const { rows } = await pool.query(
      'INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta, an_hien, loai_danh_muc, thu_tu_hien_thi) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.ten_danh_muc, data.mo_ta || null, an_hien, loai_danh_muc, thu_tu_hien_thi]
    );
    return rows[0];
  }

  async updateCategory(id: string, data: any) {
    const an_hien = data.trang_thai !== 'vo_hieu';
    const loai_danh_muc = data.loai_danh_muc || 'dich_vu';
    const thu_tu_hien_thi = data.thu_tu_hien_thi || 0;
    const { rows } = await pool.query(
      'UPDATE danh_muc_dich_vu SET ten_danh_muc = $1, mo_ta = $2, an_hien = $3, loai_danh_muc = $4, thu_tu_hien_thi = $5 WHERE id = $6 RETURNING *',
      [data.ten_danh_muc, data.mo_ta || null, an_hien, loai_danh_muc, thu_tu_hien_thi, id]
    );
    return rows[0];
  }

  async deleteCategory(id: string) {
    await pool.query('DELETE FROM danh_muc_dich_vu WHERE id = $1', [id]);
  }

  async getServices() {
    const { rows } = await pool.query(`
      SELECT dv.*, dv.thoi_luong_phut as thoi_gian_uoc_tinh, dm.ten_danh_muc, dm.loai_danh_muc
      FROM dich_vu dv
      JOIN danh_muc_dich_vu dm ON dv.danh_muc_id = dm.id
      ORDER BY dv.danh_muc_id, dv.ten_dich_vu
    `);
    return rows;
  }

  async createService(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, mo_ta, thoi_luong_phut, don_gia, trang_thai, loai_phong_yeu_cau) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *, thoi_luong_phut as thoi_gian_uoc_tinh`,
      [
        data.danh_muc_id,
        data.ten_dich_vu,
        data.mo_ta || null,
        data.thoi_gian_uoc_tinh || null,
        data.don_gia || null,
        data.trang_thai,
        data.loai_phong_yeu_cau || 'phong_tri_lieu'
      ]
    );
    return rows[0];
  }

  async updateService(id: string, data: any) {
    const { rows } = await pool.query(
      `UPDATE dich_vu 
       SET danh_muc_id = $1, ten_dich_vu = $2, mo_ta = $3, thoi_luong_phut = $4, don_gia = $5, trang_thai = $6, loai_phong_yeu_cau = $7
       WHERE id = $8 RETURNING *, thoi_luong_phut as thoi_gian_uoc_tinh`,
      [
        data.danh_muc_id,
        data.ten_dich_vu,
        data.mo_ta || null,
        data.thoi_gian_uoc_tinh || null,
        data.don_gia || null,
        data.trang_thai,
        data.loai_phong_yeu_cau || 'phong_tri_lieu',
        id
      ]
    );
    return rows[0];
  }

  async deleteService(id: string) {
    await pool.query('DELETE FROM dich_vu WHERE id = $1', [id]);
  }

  // --- QUẢN LÝ GÓI ĐIỀU TRỊ ---
  async getPackages() {
    const { rows } = await pool.query(`
      SELECT g.*, g.gia_goi as gia_tien, dm.ten_danh_muc,
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'dich_vu_id', ct.dich_vu_id,
                   'thu_tu_thuc_hien', ct.thu_tu_thuc_hien,
                   'ten_dich_vu', dv.ten_dich_vu,
                   'don_gia', dv.don_gia
                 ) ORDER BY ct.thu_tu_thuc_hien ASC
               ) FILTER (WHERE ct.dich_vu_id IS NOT NULL),
               '[]'::json
             ) as chi_tiet_dich_vu
      FROM goi_dich_vu g
      LEFT JOIN danh_muc_dich_vu dm ON g.danh_muc_id = dm.id
      LEFT JOIN goi_dich_vu_chi_tiet ct ON g.id = ct.goi_dich_vu_id
      LEFT JOIN dich_vu dv ON ct.dich_vu_id = dv.id
      GROUP BY g.id, dm.ten_danh_muc
      ORDER BY g.thoi_gian_tao DESC
    `);
    return rows;
  }

  async createPackage(data: any) {
    const ma_goi = data.ma_goi || 'GDT-' + Math.floor(1000 + Math.random() * 9000);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO goi_dich_vu (ten_goi, ma_goi, mo_ta, tong_so_buoi, thoi_luong_buoi_phut, gia_goi, gia_goc, han_dung_thang, trang_thai, danh_muc_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *, gia_goi as gia_tien`,
        [
          data.ten_goi, 
          ma_goi, 
          data.mo_ta || null, 
          data.tong_so_buoi, 
          data.thoi_luong_buoi_phut || 60,
          data.gia_tien, 
          data.gia_goc || null,
          data.han_dung_thang || 6, 
          data.trang_thai, 
          data.danh_muc_id || null
        ]
      );
      const packageId = rows[0].id;

      if (data.chi_tiet_dich_vu && Array.isArray(data.chi_tiet_dich_vu)) {
        for (const item of data.chi_tiet_dich_vu) {
          await client.query(
            `INSERT INTO goi_dich_vu_chi_tiet (goi_dich_vu_id, dich_vu_id, thu_tu_thuc_hien) 
             VALUES ($1, $2, $3)`,
            [
              packageId, 
              item.dich_vu_id, 
              item.thu_tu_thuc_hien || 0
            ]
          );
        }
      }

      await client.query('COMMIT');
      rows[0].chi_tiet_dich_vu = data.chi_tiet_dich_vu || [];
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updatePackage(id: string, data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE goi_dich_vu 
         SET ten_goi = $1, ma_goi = $2, mo_ta = $3, tong_so_buoi = $4, thoi_luong_buoi_phut = $5, 
             gia_goi = $6, gia_goc = $7, han_dung_thang = $8, trang_thai = $9, danh_muc_id = $10
         WHERE id = $11 RETURNING *, gia_goi as gia_tien`,
        [
          data.ten_goi, 
          data.ma_goi, 
          data.mo_ta || null, 
          data.tong_so_buoi, 
          data.thoi_luong_buoi_phut || 60,
          data.gia_tien, 
          data.gia_goc || null,
          data.han_dung_thang || 6, 
          data.trang_thai, 
          data.danh_muc_id || null, 
          id
        ]
      );

      // Xóa các chi tiết cũ
      await client.query('DELETE FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id = $1', [id]);

      // Thêm lại chi tiết mới
      if (data.chi_tiet_dich_vu && Array.isArray(data.chi_tiet_dich_vu)) {
        for (const item of data.chi_tiet_dich_vu) {
          await client.query(
            `INSERT INTO goi_dich_vu_chi_tiet (goi_dich_vu_id, dich_vu_id, thu_tu_thuc_hien) 
             VALUES ($1, $2, $3)`,
            [
              id, 
              item.dich_vu_id, 
              item.thu_tu_thuc_hien || 0
            ]
          );
        }
      }

      await client.query('COMMIT');
      rows[0].chi_tiet_dich_vu = data.chi_tiet_dich_vu || [];
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async deletePackage(id: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id = $1', [id]);
      const { rows } = await client.query('DELETE FROM goi_dich_vu WHERE id = $1 RETURNING *', [id]);
      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    const { rows } = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, vt.ten_hien_thi as vai_tro, ktv.id as chuyen_gia_id
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN chuyen_gia_y_te ktv ON nd.id = ktv.nguoi_dung_id
      WHERE nd.vai_tro_id IN (2, 3, 4, 5, 6) AND nd.deleted_at IS NULL
      ORDER BY nd.vai_tro_id, nd.ho_ten
    `);
    return rows;
  }

  async findUserByEmail(email: string) {
    const { rows } = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [email]);
    return rows[0];
  }

  async createStaff(data: any, hash: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, so_dien_thoai, trang_thai, da_xac_thuc_email) 
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, ho_ten, email`,
        [data.ho_ten, data.email, hash, data.vai_tro_id, data.so_dien_thoai || null, data.trang_thai]
      );

      if (data.vai_tro_id === 3 || data.vai_tro_id === 4) {
        const ma_nhan_vien = 'NV-' + Math.floor(1000 + Math.random() * 9000);
        const chuyen_mon_chinh = data.vai_tro_id === 4 ? 'Bác sĩ chuyên khoa' : 'Vật lý trị liệu';
        await client.query(
          `INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem, trang_thai) 
           VALUES ($1, $2, $3, 1, 'hoat_dong')`,
          [rows[0].id, ma_nhan_vien, chuyen_mon_chinh]
        );
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStaffStatus(id: string, status: string) {
    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET trang_thai = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  }

  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    const { rows } = await pool.query(`
      SELECT id as khach_hang_id, ngay_sinh, gioi_tinh, dia_chi,
             id as nguoi_dung_id, 
             COALESCE(ho_ten, 'Khách vãng lai') as ho_ten, 
             email, 
             so_dien_thoai, 
             trang_thai, 
             thoi_gian_tao as created_at
      FROM khach_hang
      WHERE deleted_at IS NULL
      ORDER BY thoi_gian_tao DESC
    `);
    return rows;
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment() {
    const { rows } = await pool.query(`
      SELECT 
        tb.id,
        tb.ma_thiet_bi,
        tb.ten_thiet_bi,
        tb.ngay_mua,
        tb.trang_thai,
        tb.ghi_chu,
        tb.thoi_gian_tao,
        tb.danh_muc_thiet_bi_id,
        dm.ten_thiet_bi AS loai_thiet_bi,
        dm.ten_danh_muc AS ten_danh_muc
      FROM thiet_bi_y_te tb
      LEFT JOIN danh_muc_thiet_bi dm ON tb.danh_muc_thiet_bi_id = dm.id
      ORDER BY tb.thoi_gian_tao DESC
    `);
    return rows;
  }

  getRawPool() {
    return pool;
  }

  async createEquipment(ma_thiet_bi: string, data: any) {
    const { rows } = await pool.query(
      `INSERT INTO thiet_bi_y_te (
         ma_thiet_bi, ten_thiet_bi, ngay_mua,
         trang_thai, ghi_chu, danh_muc_thiet_bi_id
       ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        ma_thiet_bi,
        data.ten_thiet_bi,
        data.ngay_mua || null,
        data.trang_thai || 'san_sang',
        data.ghi_chu || null,
        data.danh_muc_thiet_bi_id ? Number(data.danh_muc_thiet_bi_id) : null
      ]
    );
    return rows[0];
  }

  async updateEquipment(id: string, data: any) {
    // 1. Lấy thông tin thiết bị hiện tại trước khi cập nhật
    const { rows: current } = await pool.query(
      'SELECT * FROM thiet_bi_y_te WHERE id = $1',
      [id]
    );
    
    if (current.length === 0) {
      const err: any = new Error('Không tìm thấy thiết bị cần cập nhật.');
      err.statusCode = 404;
      throw err;
    }

    const cur = current[0];
    const curCode = cur.ma_thiet_bi;
    const curName = cur.ten_thiet_bi;
    const curStatus = cur.trang_thai;
    const curBuyDate = cur.ngay_mua;
    const curNote = cur.ghi_chu;

    const targetTypeId = data.danh_muc_thiet_bi_id !== undefined ? (data.danh_muc_thiet_bi_id ? Number(data.danh_muc_thiet_bi_id) : null) : cur.danh_muc_thiet_bi_id;

    const { rows } = await pool.query(
      `UPDATE thiet_bi_y_te 
       SET ma_thiet_bi = $1,
           ten_thiet_bi = $2, 
           ngay_mua = $3, 
           trang_thai = $4, 
           ghi_chu = $5,
           danh_muc_thiet_bi_id = $6
       WHERE id = $7 RETURNING *`,
      [
        data.ma_thiet_bi !== undefined ? data.ma_thiet_bi : curCode,
        data.ten_thiet_bi !== undefined ? data.ten_thiet_bi : curName,
        data.ngay_mua !== undefined ? data.ngay_mua : curBuyDate,
        data.trang_thai !== undefined ? data.trang_thai : curStatus,
        data.ghi_chu !== undefined ? data.ghi_chu : curNote,
        targetTypeId,
        id
      ]
    );
    return rows[0];
  }

  async deleteEquipment(id: string) {
    const { rows } = await pool.query(
      "UPDATE thiet_bi_y_te SET trang_thai = 'ngung_su_dung' WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  }

  // --- QUẢN LÝ DANH MỤC THIẾT BỊ (EQUIPMENT CATEGORIES) ---
  async getEquipmentTypes() {
    const { rows } = await pool.query('SELECT id, ten_danh_muc, ten_thiet_bi FROM danh_muc_thiet_bi ORDER BY ten_danh_muc ASC, ten_thiet_bi ASC');
    return rows;
  }

  async getEquipmentTypeById(id: number) {
    const { rows } = await pool.query('SELECT id, ten_danh_muc, ten_thiet_bi FROM danh_muc_thiet_bi WHERE id = $1', [id]);
    return rows[0];
  }

  async createEquipmentType(data: { ten_danh_muc: string; ten_thiet_bi: string }) {
    const { rows } = await pool.query(
      'INSERT INTO danh_muc_thiet_bi (ten_danh_muc, ten_thiet_bi) VALUES ($1, $2) RETURNING id, ten_danh_muc, ten_thiet_bi',
      [data.ten_danh_muc, data.ten_thiet_bi]
    );
    return rows[0];
  }

  async updateEquipmentType(id: number, data: { ten_danh_muc: string; ten_thiet_bi: string }) {
    const originalType = await this.getEquipmentTypeById(id);
    if (!originalType) {
      const err: any = new Error('Không tìm thấy danh mục thiết bị cần cập nhật.');
      err.statusCode = 404;
      throw err;
    }

    const { rows } = await pool.query(
      'UPDATE danh_muc_thiet_bi SET ten_danh_muc = $1, ten_thiet_bi = $2 WHERE id = $3 RETURNING id, ten_danh_muc, ten_thiet_bi',
      [data.ten_danh_muc, data.ten_thiet_bi, id]
    );
    return rows[0];
  }

  async deleteEquipmentType(id: number) {
    const { rows: eqCount } = await pool.query(
      'SELECT COUNT(*)::int as count FROM thiet_bi_y_te WHERE danh_muc_thiet_bi_id = $1',
      [id]
    );
    if (eqCount[0].count > 0) {
      const err: any = new Error(`Không thể xóa danh mục này vì đang có ${eqCount[0].count} thiết bị y tế trực thuộc. Vui lòng chuyển các thiết bị đó sang danh mục khác trước.`);
      err.statusCode = 400;
      throw err;
    }
    const { rows } = await pool.query('DELETE FROM danh_muc_thiet_bi WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }


  // --- QUẢN LÝ LỊCH LÀM VIỆC ---
  async getSchedules() {
    const { rows } = await pool.query(`
      SELECT llv.id, llv.nguoi_dung_id, to_char(llv.ngay, 'YYYY-MM-DD') as ngay, 
             llv.gio_bat_dau, llv.gio_ket_thuc, llv.trang_thai,
             nd.ho_ten as ten_nhan_vien, vt.ten_hien_thi as vai_tro,
             llv.phong_id, llv.giuong_so, p.ma_phong, p.ten_phong
      FROM lich_lam_viec llv
      JOIN nguoi_dung nd ON llv.nguoi_dung_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN phong p ON llv.phong_id = p.id
      ORDER BY vt.id, nd.ho_ten, llv.ngay
    `);
    return rows;
  }

  async createSchedule(data: any) {
    // Check if staff member is a Doctor (role_id = 4)
    const userRes = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [data.nguoi_dung_id]);
    const isDoc = userRes.rows[0]?.vai_tro_id === 4;

    if (isDoc && data.trang_thai !== 'tam_nghi') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const isMorning = hour < 11;
      
      const checkQuery = `
        SELECT llv.*, nd.ho_ten 
        FROM lich_lam_viec llv
        JOIN nguoi_dung nd ON llv.nguoi_dung_id = nd.id
        WHERE nd.vai_tro_id = 4
          AND llv.ngay = $1::date
          AND llv.trang_thai = 'hoat_dong'
          AND llv.nguoi_dung_id != $2
          AND ${isMorning ? "llv.gio_bat_dau < '11:00'" : "llv.gio_bat_dau >= '11:00'"}
      `;
      const conflictRes = await pool.query(checkQuery, [data.ngay, data.nguoi_dung_id]);
      if (conflictRes.rows.length > 0) {
        throw new Error(`Bác sĩ ${conflictRes.rows[0].ho_ten} đã trực ca này vào ngày ${data.ngay} rồi! Mỗi ca trực chỉ phân công tối đa 1 bác sĩ.`);
      }
    }

    const phongIdVal = data.phong_id && data.phong_id !== '' ? BigInt(data.phong_id) : null;
    const giuongSoVal = data.giuong_so && data.giuong_so !== '' ? Number(data.giuong_so) : null;

    const { rows } = await pool.query(
      `INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id, giuong_so) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nguoi_dung_id, to_char(ngay, 'YYYY-MM-DD') as ngay, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id, giuong_so`,
      [data.nguoi_dung_id, data.ngay, data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai, phongIdVal, giuongSoVal]
    );
    return rows[0];
  }

  async updateSchedule(id: string, data: any) {
    // Check if staff member is a Doctor (role_id = 4)
    const userRes = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [data.nguoi_dung_id]);
    const isDoc = userRes.rows[0]?.vai_tro_id === 4;

    if (isDoc && data.trang_thai !== 'tam_nghi') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const isMorning = hour < 11;
      
      const checkQuery = `
        SELECT llv.*, nd.ho_ten 
        FROM lich_lam_viec llv
        JOIN nguoi_dung nd ON llv.nguoi_dung_id = nd.id
        WHERE nd.vai_tro_id = 4
          AND llv.ngay = $1::date
          AND llv.trang_thai = 'hoat_dong'
          AND llv.nguoi_dung_id != $2
          AND llv.id != $3
          AND ${isMorning ? "llv.gio_bat_dau < '11:00'" : "llv.gio_bat_dau >= '11:00'"}
      `;
      const conflictRes = await pool.query(checkQuery, [data.ngay, data.nguoi_dung_id, id]);
      if (conflictRes.rows.length > 0) {
        throw new Error(`Bác sĩ ${conflictRes.rows[0].ho_ten} đã trực ca này vào ngày ${data.ngay} rồi! Mỗi ca trực chỉ phân công tối đa 1 bác sĩ.`);
      }
    }

    const phongIdVal = data.phong_id && data.phong_id !== '' ? BigInt(data.phong_id) : null;
    const giuongSoVal = data.giuong_so && data.giuong_so !== '' ? Number(data.giuong_so) : null;

    const { rows } = await pool.query(
      `UPDATE lich_lam_viec 
       SET gio_bat_dau = $1, gio_ket_thuc = $2, trang_thai = $3, phong_id = $4, giuong_so = $5
       WHERE id = $6 RETURNING id, nguoi_dung_id, to_char(ngay, 'YYYY-MM-DD') as ngay, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id, giuong_so`,
      [data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai, phongIdVal, giuongSoVal, id]
    );
    return rows[0];
  }

  async deleteSchedule(id: string) {
    const { rows } = await pool.query(
      'DELETE FROM lich_lam_viec WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ ---
  async getMedicalRecords() {
    const { rows } = await pool.query(`
      SELECT 
        hs.id, 
        ld.ma_lich_dat as ma_danh_gia, 
        hs.thoi_gian_tao as ngay_danh_gia, 
        hs.chan_doan, 
        ld.trang_thai,
        COALESCE(kh.ho_ten, ld.ho_ten_khach, 'Khách vãng lai') as ten_khach_hang, 
        COALESCE(kh.so_dien_thoai, ld.so_dien_thoai) as so_dien_thoai,
        COALESCE('KH-' || SUBSTRING(kh.id::text, 1, 8), 'KH-VL') as ma_khach_hang,
        ld.ly_do_kham as trieu_chung,
        hs.ghi_chu,
        dv.ten_dich_vu as phuong_phap_dieu_tri,
        NULL::text AS loai_goi,
        g.ten_goi,
        g.tong_so_buoi as so_luong_buoi,
        1 as so_luong_goi,
        g.gia_goi as gia_tien,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        p_tri.ten_phong as ten_phong_tri_lieu
      FROM ho_so_dieu_tri hs
      LEFT JOIN lich_dat ld ON hs.lich_dat_id = ld.id
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN chuyen_gia_y_te bs ON hs.chuyen_gia_id = bs.id
      LEFT JOIN nguoi_dung nd_bs ON bs.nguoi_dung_id = nd_bs.id
      LEFT JOIN phong p_kham ON ld.phong_id = p_kham.id
      LEFT JOIN dich_vu dv ON hs.dich_vu_id = dv.id
      LEFT JOIN goi_dich_vu g ON hs.goi_dich_vu_id = g.id
      LEFT JOIN lich_dieu_tri ldt ON ldt.ho_so_dieu_tri_id = hs.id
      LEFT JOIN phong p_tri ON ldt.phong_id = p_tri.id
      LEFT JOIN LATERAL (
        SELECT cg_ktv.id
        FROM buoi_tri_lieu btl
        JOIN chuyen_gia_y_te cg_ktv ON btl.ky_thuat_vien_id = cg_ktv.id
        WHERE btl.lich_dieu_tri_id = ldt.id
        ORDER BY btl.thoi_gian_bat_dau DESC
        LIMIT 1
      ) last_btl ON TRUE
      LEFT JOIN chuyen_gia_y_te ktv ON last_btl.id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      ORDER BY hs.thoi_gian_tao DESC
    `);
    return rows;
  }


  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
    const { rows } = await pool.query(`
      SELECT hd.*, kh.ho_ten as ten_khach_hang, kh.so_dien_thoai
      FROM hoa_don hd
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      ORDER BY hd.ngay_tao DESC
    `);
    return rows;
  }

  async getPayments() {
    const { rows } = await pool.query(`
      SELECT tt.*, hd.ma_hoa_don, kh.ho_ten as ten_khach_hang
      FROM thanh_toan tt
      JOIN hoa_don hd ON tt.hoa_don_id = hd.id
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      ORDER BY tt.thoi_gian_giao_dich DESC
    `);
    return rows;
  }

  async handleRefund(id: string, ly_do: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: payments } = await client.query('SELECT * FROM thanh_toan WHERE id = $1', [id]);
      if (payments.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy giao dịch', code: 404 };
      }
      const originalPayment = payments[0];

      if (originalPayment.trang_thai === 'da_hoan_tien') {
        await client.query('ROLLBACK');
        return { error: 'Giao dịch này đã được hoàn tiền trước đó', code: 400 };
      }

      await client.query('UPDATE thanh_toan SET trang_thai = \'da_hoan_tien\', ghi_chu = $1 WHERE id = $2',
        [`Hoàn tiền: ${ly_do}`, id]);

      const { rows: invoices } = await client.query(
        'UPDATE hoa_don SET trang_thai = \'da_hoan_tien\', da_thanh_toan = da_thanh_toan - $1 WHERE id = $2 RETURNING *',
        [originalPayment.so_tien, originalPayment.hoa_don_id]
      );

      await client.query('COMMIT');
      return { success: true, invoice: invoices[0], originalAmount: originalPayment.so_tien };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // --- QUẢN LÝ MARKETING ---
  async getVouchers() {
    const { rows } = await pool.query(`
      SELECT v.*
      FROM voucher v
      ORDER BY v.thoi_gian_tao DESC
    `);
    return rows;
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT v.*
      FROM voucher v
      WHERE v.ma_voucher = $1
    `, [code]);
    return rows[0];
  }

  async createVoucher(data: any, userId: string) {
    const { rows } = await pool.query(
      `INSERT INTO voucher (ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_toi_da, ngay_bat_dau, ngay_het_han, trang_thai, tao_boi, yeu_cau_thanh_toan) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        data.ma_voucher, 
        data.ten_chien_dich, 
        data.loai_giam, 
        data.gia_tri_giam, 
        data.giam_toi_da, 
        data.don_hang_toi_thieu, 
        data.so_luong_toi_da, 
        data.ngay_bat_dau, 
        data.ngay_het_han, 
        data.trang_thai, 
        userId,
        data.yeu_cau_thanh_toan || 'tat_ca'
      ]
    );
    return rows[0];
  }

  async updateVoucher(id: string, data: any) {
    const { rows } = await pool.query(
      `UPDATE voucher SET 
        ma_voucher = $1, ten_chien_dich = $2, loai_giam = $3, gia_tri_giam = $4, giam_toi_da = $5, 
        don_hang_toi_thieu = $6, so_luong_toi_da = $7, 
        ngay_bat_dau = $8, ngay_het_han = $9, trang_thai = $10,
        yeu_cau_thanh_toan = $11
       WHERE id = $12 RETURNING *`,
      [
        data.ma_voucher,
        data.ten_chien_dich, 
        data.loai_giam, 
        data.gia_tri_giam, 
        data.giam_toi_da, 
        data.don_hang_toi_thieu, 
        data.so_luong_toi_da, 
        data.ngay_bat_dau, 
        data.ngay_het_han, 
        data.trang_thai, 
        data.yeu_cau_thanh_toan || 'tat_ca',
        id
      ]
    );
    return rows[0];
  }

  async deleteVoucher(id: string) {
    const { rows } = await pool.query('DELETE FROM voucher WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }



  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    const { rows } = await pool.query(`
      SELECT dg.*, kh.ho_ten as ten_khach_hang, nd_ktv.ho_ten as ten_ky_thuat_vien, dv.ten_dich_vu
      FROM danh_gia_dich_vu dg
      JOIN buoi_tri_lieu btl ON dg.buoi_tri_lieu_id = btl.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      JOIN chuyen_gia_y_te ktv ON dg.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      ORDER BY dg.thoi_gian_danh_gia DESC
    `);
    return rows;
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary() {
    const queries = [
      pool.query('SELECT COUNT(*) FROM khach_hang'),
      pool.query('SELECT COUNT(*) FROM lich_dat WHERE trang_thai = \'cho_xac_nhan\''),
      pool.query('SELECT SUM(da_thanh_toan) FROM hoa_don'),
      pool.query('SELECT COUNT(*) FROM chuyen_gia_y_te WHERE trang_thai = \'hoat_dong\''),
      pool.query('SELECT COUNT(*) FROM lich_dat WHERE bac_si_id IS NULL AND trang_thai IN (\'cho_xac_nhan\', \'da_xac_nhan\')'),
      pool.query('SELECT COUNT(*) FROM buoi_tri_lieu WHERE ky_thuat_vien_id IS NULL AND trang_thai NOT IN (\'hoan_thanh\', \'da_huy\', \'khong_den\')'),
      pool.query('SELECT id, ngay_gio_bat_dau AS start_time FROM lich_dat WHERE bac_si_id IS NULL AND trang_thai IN (\'cho_xac_nhan\', \'da_xac_nhan\') ORDER BY ngay_gio_bat_dau ASC LIMIT 1'),
      pool.query('SELECT id, thoi_gian_bat_dau AS start_time FROM buoi_tri_lieu WHERE ky_thuat_vien_id IS NULL AND trang_thai NOT IN (\'hoan_thanh\', \'da_huy\', \'khong_den\') ORDER BY thoi_gian_bat_dau ASC LIMIT 1')
    ];
    const results = await Promise.all(queries);

    const aptTime = results[6].rows[0]?.start_time;
    const treatTime = results[7].rows[0]?.start_time;
    let earliestPending = null;

    if (aptTime && treatTime) {
      if (new Date(aptTime) <= new Date(treatTime)) {
        earliestPending = { id: results[6].rows[0].id, type: 'appointment', ngay_gio_bat_dau: aptTime };
      } else {
        earliestPending = { id: results[7].rows[0].id, type: 'treatment', ngay_gio_bat_dau: treatTime };
      }
    } else if (aptTime) {
      earliestPending = { id: results[6].rows[0].id, type: 'appointment', ngay_gio_bat_dau: aptTime };
    } else if (treatTime) {
      earliestPending = { id: results[7].rows[0].id, type: 'treatment', ngay_gio_bat_dau: treatTime };
    }

    return {
      total_customers: results[0].rows[0].count,
      pending_appointments: results[1].rows[0].count,
      total_revenue: results[2].rows[0].sum || 0,
      active_staff: results[3].rows[0].count,
      pending_appointments_need_assign: results[4].rows[0].count,
      pending_treatments: results[5].rows[0].count,
      earliest_pending: earliestPending
    };
  }

  async getRevenueStats() {
    const { rows } = await pool.query(`
      SELECT 
        TO_CHAR(thoi_gian_giao_dich, 'YYYY-MM') as month,
        SUM(so_tien) as revenue
      FROM thanh_toan
      WHERE trang_thai = 'thanh_cong'
        AND thoi_gian_giao_dich >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    return rows;
  }

  async getStaffPerformance() {
    const { rows } = await pool.query(`
      SELECT 
        nd.ho_ten as name,
        COUNT(btl.id) as sessions
      FROM buoi_tri_lieu btl
      JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      WHERE btl.trang_thai = 'hoan_thanh'
        AND btl.thoi_gian_bat_dau >= DATE_TRUNC('month', NOW())
      GROUP BY nd.ho_ten
      ORDER BY sessions DESC
      LIMIT 5
    `);
    return rows;
  }

  async getAvailableStaff(dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    let thoi_luong = 60; // default duration in minutes
    let finalDichVuId = dich_vu_id;

    if (finalDichVuId) {
      const { rows } = await pool.query('SELECT thoi_luong_phut FROM dich_vu WHERE id = $1', [finalDichVuId]);
      if (rows.length > 0) {
        thoi_luong = rows[0].thoi_luong_phut;
      }
    } else if (dang_ky_goi_id) {
      const { rows } = await pool.query(
        `SELECT SUM(dv.thoi_luong_phut) as tong_thoi_luong, MAX(dv.id) as dich_vu_id
         FROM goi_dich_vu_chi_tiet gdvct
         JOIN dich_vu dv ON gdvct.dich_vu_id = dv.id
         WHERE gdvct.goi_dich_vu_id = $1`,
        [dang_ky_goi_id]
      );
      if (rows.length > 0 && rows[0].tong_thoi_luong) {
        finalDichVuId = rows[0].dich_vu_id;
        thoi_luong = parseInt(rows[0].tong_thoi_luong);
      }
    }

    const query = `
      SELECT 
        ktv.id as chuyen_gia_id, 
        nd.id as nguoi_dung_id, 
        nd.ho_ten, 
        nd.email, 
        nd.so_dien_thoai,
        vt.ten_hien_thi as vai_tro,
        (
          SELECT COALESCE(COUNT(*), 0)::integer
          FROM (
            SELECT id FROM lich_dat WHERE ky_thuat_vien_id = ktv.id AND ngay_gio_bat_dau::date = $1::date AND trang_thai NOT IN ('da_huy', 'khong_den')
            UNION ALL
            SELECT id FROM buoi_tri_lieu WHERE ky_thuat_vien_id = ktv.id AND thoi_gian_bat_dau::date = $1::date AND trang_thai NOT IN ('da_huy')
          ) as daily_activities
        ) as so_ca_trong_ngay
      FROM chuyen_gia_y_te ktv
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE vt.ma_vai_tro = 'ky_thuat_vien'
        AND nd.trang_thai = 'hoat_dong'
        AND nd.deleted_at IS NULL
        -- 1. KTV phai co ca lam viec bao phu ca thoi gian
        AND EXISTS (
          SELECT 1 FROM lich_lam_viec llv
          WHERE llv.nguoi_dung_id = nd.id
            AND llv.ngay = $1::date
            AND llv.trang_thai = 'hoat_dong'
            AND llv.gio_bat_dau <= $2::time
            AND llv.gio_ket_thuc >= ($2::time + ($3 || ' minutes')::interval)::time
        )
        -- 2. Khong trung voi bat ky lich dat nao
        AND NOT EXISTS (
          SELECT 1 FROM lich_dat ld
          WHERE ld.bac_si_id = ktv.id
            AND ld.trang_thai NOT IN ('da_huy', 'khong_den')
            AND ld.ngay_gio_bat_dau < ($1::date + $2::time + ($3 || ' minutes')::interval)::timestamp
            AND ld.ngay_gio_ket_thuc > ($1::date + $2::time)::timestamp
        )
        -- 3. Khong trung voi bat ky buoi tri lieu nao
        AND NOT EXISTS (
          SELECT 1 FROM buoi_tri_lieu btl
          WHERE btl.ky_thuat_vien_id = ktv.id
            AND btl.trang_thai NOT IN ('da_huy', 'hoan_thanh')
            AND btl.thoi_gian_bat_dau < ($1::date + $2::time + ($3 || ' minutes')::interval)::timestamp
            AND btl.thoi_gian_ket_thuc > ($1::date + $2::time)::timestamp
        )
      ORDER BY so_ca_trong_ngay ASC, nd.ho_ten ASC
    `;

    const { rows } = await pool.query(query, [ngay, gio_bat_dau, thoi_luong]);
    return rows;
  }
}

export default new AdminRepository();

