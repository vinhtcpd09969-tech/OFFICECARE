import { pool } from '../config/db';
import prisma from '../config/prisma';
import { calculatePackageCancellationRefund, PACKAGE_ACTIVATION_WINDOW_DAYS } from '../domain/billing';

class AdminRepository {
  constructor() {
    this.initDatabase();
  }

  async initDatabase() {
    // Database schema is already initialized and verified by Prisma migrations
  }

  // --- QUẢN LÝ PHÒNG KHÁM ───────────────────────────────────────────────────
  async getRooms() {
    const { rows } = await pool.query(`
      SELECT id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta
      FROM phong_lam_viec
      ORDER BY id ASC
    `);
    return rows;
  }

  async createRoom(data: any) {
    const { rows } = await pool.query(`
      INSERT INTO phong_lam_viec (ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta
    `, [data.ten_phong, data.ma_phong, data.loai_phong, data.suc_chua || 1, data.trang_thai || 'san_sang', data.mo_ta]);
    return rows[0];
  }

  async updateRoom(id: string | number, data: any) {
    if (data.trang_thai && data.trang_thai !== 'san_sang') {
      await this.checkRoomFutureShifts(Number(id));
    }
    const { rows } = await pool.query(`
      UPDATE phong_lam_viec
      SET ten_phong = $1, ma_phong = $2, loai_phong = $3, suc_chua = $4, trang_thai = $5, mo_ta = $6
      WHERE id = $7
      RETURNING id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta
    `, [data.ten_phong, data.ma_phong, data.loai_phong, data.suc_chua || 1, data.trang_thai || 'san_sang', data.mo_ta, Number(id)]);
    return rows[0];
  }

  async deleteRoom(id: string | number) {
    await this.checkRoomFutureShifts(Number(id));
    const { rows } = await pool.query(`
      DELETE FROM phong_lam_viec
      WHERE id = $1
      RETURNING id, ten_phong, ma_phong, loai_phong
    `, [Number(id)]);
    return rows[0];
  }

  // --- QUẢN LÝ GÓI DỊCH VỤ / KHÁM / LIỆU TRÌNH ────────────────────────────────
  // Dùng Prisma (không phải raw SQL) — khối này không có join phức tạp, và đang phải
  // sửa tay tham số $N để thêm anh_gallery nên tiện thể bỏ luôn kiểu tham số vị trí dễ đếm nhầm.
  async getPackages() {
    const packages = await prisma.goi_dich_vu.findMany({
      where: { trang_thai: { not: 'da_xoa' } },
      orderBy: { ten_goi: 'asc' },
      include: { _count: { select: { cuoc_hen: true } } }
    });

    return packages.map(({ _count, ...pkg }) => ({
      ...pkg,
      danh_muc_id: pkg.danh_muc_goi_id,
      gia_tien: pkg.don_gia,
      gia_goi: pkg.don_gia,
      gia_goc: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut,
      luot_dung: _count.cuoc_hen
    }));
  }

  private async assertDanhMucCompatible(danhMucGoiId: string, loaiGoi: string) {
    const category = await prisma.danh_muc_goi.findUnique({
      where: { id: danhMucGoiId },
      select: { loai_goi_ap_dung: true }
    });
    if (category && category.loai_goi_ap_dung !== loaiGoi) {
      throw new Error('Danh mục chuyên khoa đã chọn không tương thích với loại gói này!');
    }
  }

  async createPackage(data: any) {
    const isAct = data.trang_thai || 'hoat_dong';
    const donGia = data.don_gia ? BigInt(data.don_gia) : BigInt(0);
    const tongSoBuoi = data.tong_so_buoi ? Number(data.tong_so_buoi) : 1;
    const donGiaTheoBuoi = data.don_gia_theo_buoi ? BigInt(data.don_gia_theo_buoi) : BigInt(Math.round(Number(donGia) / tongSoBuoi));

    if (data.danh_muc_goi_id) {
      await this.assertDanhMucCompatible(data.danh_muc_goi_id, data.loai_goi);
    }

    const pkg = await prisma.goi_dich_vu.create({
      data: {
        ten_goi: data.ten_goi,
        loai_goi: data.loai_goi || 'KHAM',
        tong_so_buoi: tongSoBuoi,
        thoi_luong_phut: data.thoi_luong_phut || 30,
        don_gia: donGia,
        don_gia_theo_buoi: donGiaTheoBuoi,
        quy_trinh: data.quy_trinh || null,
        muc_tieu: data.muc_tieu || null,
        trang_thai: isAct,
        anh_goi: data.anh_goi || null,
        anh_gallery: data.anh_gallery || [],
        danh_muc_goi_id: data.danh_muc_goi_id || null
      }
    });

    return {
      ...pkg,
      gia_tien: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut,
      danh_muc_id: pkg.danh_muc_goi_id
    };
  }

  async updatePackage(id: string, data: any) {
    const isAct = data.trang_thai || 'hoat_dong';
    const donGia = data.don_gia ? BigInt(data.don_gia) : BigInt(0);
    const tongSoBuoi = data.tong_so_buoi ? Number(data.tong_so_buoi) : 1;
    const donGiaTheoBuoi = data.don_gia_theo_buoi ? BigInt(data.don_gia_theo_buoi) : BigInt(Math.round(Number(donGia) / tongSoBuoi));

    if (data.danh_muc_goi_id) {
      await this.assertDanhMucCompatible(data.danh_muc_goi_id, data.loai_goi);
    }

    const pkg = await prisma.goi_dich_vu.update({
      where: { id },
      data: {
        ten_goi: data.ten_goi,
        loai_goi: data.loai_goi,
        tong_so_buoi: tongSoBuoi,
        thoi_luong_phut: data.thoi_luong_phut || 30,
        don_gia: donGia,
        don_gia_theo_buoi: donGiaTheoBuoi,
        quy_trinh: data.quy_trinh || null,
        muc_tieu: data.muc_tieu || null,
        trang_thai: isAct,
        anh_goi: data.anh_goi || null,
        anh_gallery: data.anh_gallery || [],
        danh_muc_goi_id: data.danh_muc_goi_id || null
      }
    });

    return {
      ...pkg,
      gia_tien: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut,
      danh_muc_id: pkg.danh_muc_goi_id
    };
  }

  async deletePackage(id: string) {
    return prisma.goi_dich_vu.update({
      where: { id },
      data: { trang_thai: 'da_xoa' }
    });
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    const { rows } = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro, ktv.id as chuyen_gia_id
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia ktv ON nd.id = ktv.nguoi_dung_id
      WHERE nd.vai_tro_id IN (2, 3, 4, 5, 6)
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
        `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, so_dien_thoai, trang_thai) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, ho_ten, email`,
        [data.ho_ten, data.email, hash, data.vai_tro_id, data.so_dien_thoai || null, data.trang_thai]
      );

      if (data.vai_tro_id === 3 || data.vai_tro_id === 4) {
        await client.query(
          `INSERT INTO ho_so_chuyen_gia (nguoi_dung_id, so_nam_kinh_nghiem, bang_cap_chung_chi) 
           VALUES ($1, 1, $2)`,
          [rows[0].id, data.vai_tro_id === 4 ? 'Bác sĩ Vật lý trị liệu' : 'Kỹ thuật viên Vật lý trị liệu']
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
             now() as created_at
      FROM khach_hang
      ORDER BY ho_ten ASC
    `);
    return rows;
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment(): Promise<any[]> {
    const { rows } = await pool.query(`
      SELECT id, ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu
      FROM thiet_bi
      ORDER BY ten_thiet_bi ASC
    `);
    return rows;
  }

  getRawPool() {
    return pool;
  }

  async createEquipment(ma_thiet_bi: string, data: any): Promise<any> {
    const ma = data.ma_thiet_bi || ma_thiet_bi || ('TB-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const { rows } = await pool.query(`
      INSERT INTO thiet_bi (ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu)
      VALUES ($1, $2, $3::date, $4, $5)
      RETURNING id, ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu
    `, [ma, data.ten_thiet_bi, data.ngay_mua || null, data.trang_thai || 'san_sang', data.ghi_chu]);
    return rows[0];
  }

  async updateEquipment(id: string, data: any): Promise<any> {
    const { rows } = await pool.query(`
      UPDATE thiet_bi
      SET ma_thiet_bi = $1, ten_thiet_bi = $2, ngay_mua = $3::date, trang_thai = $4, ghi_chu = $5
      WHERE id = $6::uuid
      RETURNING id, ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu
    `, [data.ma_thiet_bi, data.ten_thiet_bi, data.ngay_mua || null, data.trang_thai || 'san_sang', data.ghi_chu, id]);
    return rows[0];
  }

  async deleteEquipment(id: string): Promise<any> {
    const { rows } = await pool.query(`
      DELETE FROM thiet_bi
      WHERE id = $1::uuid
      RETURNING id, ma_thiet_bi, ten_thiet_bi
    `, [id]);
    return rows[0];
  }

  // --- QUẢN LÝ LỊCH LÀM VIỆC (MAPPED TO LICH TRUC NHAN SU) ---
  async getSchedules() {
    const { rows } = await pool.query(`
      SELECT lt.id, lt.nhan_su_id as nguoi_dung_id, to_char(lt.ngay_truc, 'YYYY-MM-DD') as ngay, 
             to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, lt.trang_thai,
             nd.ho_ten as ten_nhan_vien, vt.ten_vai_tro as vai_tro,
             lt.phong_id, p.ma_phong, p.ten_phong
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      ORDER BY vt.id, nd.ho_ten, lt.ngay_truc
    `);
    return rows;
  }

  async createSchedule(data: any) {
    if (!data.phong_id) {
      throw new Error('Vui lòng phân phòng làm việc cho ca trực của nhân sự.');
    }

    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();
    if (data.ngay < todayDateStr) {
      throw new Error('Không thể thêm ca trực cho ngày trong quá khứ!');
    }

    const userRes = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [Number(data.nguoi_dung_id)]);
    const isDoc = userRes.rows[0]?.vai_tro_id === 4;

    if (isDoc && data.trang_thai !== 'tam_nghi') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const isMorning = hour < 11;
      
      const checkQuery = `
        SELECT lt.*, nd.ho_ten 
        FROM lich_truc_nhan_su lt
        JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
        WHERE nd.vai_tro_id = 4
          AND lt.ngay_truc = $1::date
          AND lt.trang_thai = 'hoat_dong'
          AND lt.nhan_su_id = $2::integer
          AND ${isMorning ? "lt.gio_bat_dau < '11:00'" : "lt.gio_bat_dau >= '11:00'"}
      `;
      const conflictRes = await pool.query(checkQuery, [data.ngay, Number(data.nguoi_dung_id)]);
      if (conflictRes.rows.length > 0) {
        throw new Error(`Bác sĩ ${conflictRes.rows[0].ho_ten} đã có lịch trực ca này vào ngày ${data.ngay} rồi!`);
      }
    }

    // Validate room capacity constraint
    if (data.phong_id && data.trang_thai === 'hoat_dong') {
      const roomRes = await pool.query('SELECT ten_phong, ma_phong, suc_chua FROM phong_lam_viec WHERE id = $1', [Number(data.phong_id)]);
      if (roomRes.rows.length > 0) {
        const room = roomRes.rows[0];
        const capacity = room.suc_chua || 1;
        
        const startHour = parseInt(data.gio_bat_dau.split(':')[0]);
        const isMorning = startHour < 11;
        
        const countRes = await pool.query(`
          SELECT COUNT(*) as count 
          FROM lich_truc_nhan_su 
          WHERE phong_id = $1 
            AND ngay_truc = $2::date 
            AND trang_thai = 'hoat_dong'
            AND (
              ($3::boolean = true AND gio_bat_dau < '11:00') OR 
              ($3::boolean = false AND gio_bat_dau >= '11:00')
            )
        `, [Number(data.phong_id), data.ngay, isMorning]);
        
        const count = parseInt(countRes.rows[0].count) || 0;
        if (count >= capacity) {
          throw new Error(`Phòng ${room.ten_phong} (${room.ma_phong}) đã đạt sức chứa tối đa (${capacity} người) trong ca trực này.`);
        }
      }
    }

    const caTruc = parseInt(data.gio_bat_dau.split(':')[0]) < 12 ? 'SANG' : 'CHIEU';

    const { rows } = await pool.query(
      `INSERT INTO lich_truc_nhan_su (nhan_su_id, ngay_truc, ca_truc, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id) 
       VALUES ($1, $2, $3, $4::time, $5::time, $6, $7) 
       RETURNING id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, trang_thai, phong_id`,
      [Number(data.nguoi_dung_id), data.ngay, caTruc, data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai, data.phong_id ? Number(data.phong_id) : null]
    );
    if (rows.length > 0) {
      await this.syncShiftAppointments(rows[0].id);
    }
    return rows[0];
  }

  async updateSchedule(id: string, data: any) {
    if (!data.phong_id) {
      throw new Error('Vui lòng phân phòng làm việc cho ca trực của nhân sự.');
    }

    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();

    // Check if the schedule being edited is in the past
    const { rows: currentRows } = await pool.query('SELECT to_char(ngay_truc, \'YYYY-MM-DD\') as ngay FROM lich_truc_nhan_su WHERE id = $1', [id]);
    if (currentRows.length > 0 && currentRows[0].ngay < todayDateStr) {
      throw new Error('Không thể chỉnh sửa ca trực của ngày trong quá khứ!');
    }

    // Check if the new target date is in the past
    if (data.ngay < todayDateStr) {
      throw new Error('Không thể chuyển ca trực sang ngày trong quá khứ!');
    }

    const userRes = await pool.query('SELECT vai_tro_id FROM nguoi_dung WHERE id = $1', [Number(data.nguoi_dung_id)]);
    const isDoc = userRes.rows[0]?.vai_tro_id === 4;

    if (isDoc && data.trang_thai !== 'tam_nghi') {
      const hour = parseInt(data.gio_bat_dau.split(':')[0]);
      const isMorning = hour < 11;
      
      const checkQuery = `
        SELECT lt.*, nd.ho_ten 
        FROM lich_truc_nhan_su lt
        JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
        WHERE nd.vai_tro_id = 4
          AND lt.ngay_truc = $1::date
          AND lt.trang_thai = 'hoat_dong'
          AND lt.nhan_su_id = $2::integer
          AND lt.id != $3::uuid
          AND ${isMorning ? "lt.gio_bat_dau < '11:00'" : "lt.gio_bat_dau >= '11:00'"}
      `;
      const conflictRes = await pool.query(checkQuery, [data.ngay, Number(data.nguoi_dung_id), id]);
      if (conflictRes.rows.length > 0) {
        throw new Error(`Bác sĩ ${conflictRes.rows[0].ho_ten} đã có lịch trực ca này vào ngày ${data.ngay} rồi!`);
      }
    }

    // Validate room capacity constraint (excluding current schedule)
    if (data.phong_id && data.trang_thai === 'hoat_dong') {
      const roomRes = await pool.query('SELECT ten_phong, ma_phong, suc_chua FROM phong_lam_viec WHERE id = $1', [Number(data.phong_id)]);
      if (roomRes.rows.length > 0) {
        const room = roomRes.rows[0];
        const capacity = room.suc_chua || 1;
        
        const startHour = parseInt(data.gio_bat_dau.split(':')[0]);
        const isMorning = startHour < 11;
        
        const countRes = await pool.query(`
          SELECT COUNT(*) as count 
          FROM lich_truc_nhan_su 
          WHERE phong_id = $1 
            AND ngay_truc = $2::date 
            AND trang_thai = 'hoat_dong'
            AND id != $4::uuid
            AND (
              ($3::boolean = true AND gio_bat_dau < '11:00') OR 
              ($3::boolean = false AND gio_bat_dau >= '11:00')
            )
        `, [Number(data.phong_id), data.ngay, isMorning, id]);
        
        const count = parseInt(countRes.rows[0].count) || 0;
        if (count >= capacity) {
          throw new Error(`Phòng ${room.ten_phong} (${room.ma_phong}) đã đạt sức chứa tối đa (${capacity} người) trong ca trực này.`);
        }
      }
    }

    const caTruc = parseInt(data.gio_bat_dau.split(':')[0]) < 12 ? 'SANG' : 'CHIEU';

    const { rows } = await pool.query(
      `UPDATE lich_truc_nhan_su 
       SET ca_truc = $1, gio_bat_dau = $2::time, gio_ket_thuc = $3::time, trang_thai = $4, phong_id = $5, ngay_truc = $6::date
       WHERE id = $7::uuid RETURNING id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, trang_thai, phong_id`,
      [caTruc, data.gio_bat_dau, data.gio_ket_thuc, data.trang_thai, data.phong_id ? Number(data.phong_id) : null, data.ngay, id]
    );
    if (rows.length > 0) {
      await this.syncShiftAppointments(rows[0].id);
    }
    return rows[0];
  }

  async deleteSchedule(id: string) {
    const getLocalVietnamDate = () => {
      const now = new Date();
      const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      return localTime.toISOString().split('T')[0];
    };
    const todayDateStr = getLocalVietnamDate();

    // Check if the schedule being deleted is in the past
    const { rows: currentRows } = await pool.query('SELECT to_char(ngay_truc, \'YYYY-MM-DD\') as ngay FROM lich_truc_nhan_su WHERE id = $1', [id]);
    if (currentRows.length > 0 && currentRows[0].ngay < todayDateStr) {
      throw new Error('Không thể xóa ca trực của ngày trong quá khứ!');
    }

    const { rows } = await pool.query(
      'DELETE FROM lich_truc_nhan_su WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length > 0) {
      const shift = rows[0];
      const dateObj = new Date(shift.ngay_truc);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startTimeStr = String(shift.gio_bat_dau).trim();
      const endTimeStr = String(shift.gio_ket_thuc).trim();

      const startTimestamp = `${dateStr}T${startTimeStr}+07:00`;
      const endTimestamp = `${dateStr}T${endTimeStr}+07:00`;

      // Set matching appointments to null room since the shift is deleted
      await pool.query(`
        UPDATE cuoc_hen
        SET phong_id = NULL
        WHERE nhan_su_id = $1
          AND ngay_gio_bat_dau >= $2::timestamptz
          AND ngay_gio_ket_thuc <= $3::timestamptz
      `, [shift.nhan_su_id, startTimestamp, endTimestamp]);
    }
    return rows[0];
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ (MAPPED TO PHAC DO DIEU TRI) ---
  async getMedicalRecords() {
    // Sync completed treatment plans whose actual completed count >= tong_so_buoi
    await pool.query(`
      UPDATE phac_do_dieu_tri 
      SET trang_thai = 'hoan_thanh' 
      WHERE trang_thai = 'dang_dieu_tri' 
        AND (
          SELECT COUNT(*)::int 
          FROM cuoc_hen 
          WHERE phac_do_dieu_tri_id = phac_do_dieu_tri.id 
            AND trang_thai = 'hoan_thanh' 
            AND loai = 'DIEU_TRI'
        ) >= tong_so_buoi
    `);

    // 1. Lấy danh sách khách hàng
    const { rows: patients } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, trang_thai, diem_uy_tin
      FROM khach_hang
      ORDER BY ho_ten ASC
    `);

    const { rows: plans } = await pool.query(`
      SELECT 
        pd.id, pd.khach_hang_id, pd.goi_dich_vu_id, pd.tong_so_buoi, 
        (
          SELECT COUNT(*)::int 
          FROM cuoc_hen 
          WHERE phac_do_dieu_tri_id = pd.id 
            AND trang_thai = 'hoan_thanh' 
            AND loai = 'DIEU_TRI'
        ) as so_buoi_da_dung, 
        pd.trang_thai, pd.ngay_kich_hoat,
        g.ten_goi, g.loai_goi, g.don_gia as gia_tien,
        nk_kham.chan_doan, nk_kham.chong_chi_dinh, nk_kham.ghi_chu as ghi_chu_kham,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        ch_kham.id as cuoc_hen_id,
        hd.id as hoa_don_id,
        hd.hinh_thuc_thanh_toan_goi,
        hd.tong_tien_phai_tra,
        hd.so_tien_da_tra,
        hd.tong_tien_goc,
        hd.ti_le_giam_gia_goi,
        hd.so_tien_giam_voucher
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN cuoc_hen ch_kham ON ch_kham.phac_do_dieu_tri_id = pd.id AND ch_kham.loai = 'KHAM'
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_kham ON nk_kham.cuoc_hen_id = ch_kham.id
      LEFT JOIN nguoi_dung nd_bs ON ch_kham.nhan_su_id = nd_bs.id
      LEFT JOIN phong_lam_viec p_kham ON ch_kham.phong_id = p_kham.id
      ORDER BY pd.ngay_kich_hoat DESC
    `);

    // 2.2. Lấy danh sách gói chỉ định từ ca khám nhưng chưa thanh toán/kích hoạt (chưa có phác đồ điều trị)
    const { rows: prescribedUnpaid } = await pool.query(`
      SELECT
        ch.khach_hang_id,
        cd.goi_dich_vu_id,
        g.ten_goi,
        g.loai_goi,
        g.don_gia as gia_tien,
        g.tong_so_buoi,
        nk.chan_doan,
        nk.chong_chi_dinh,
        nk.ghi_chu as ghi_chu_kham,
        nd_bs.ho_ten as ten_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        ch.id as cuoc_hen_id,
        ch.ngay_gio_bat_dau as ngay_kham,
        ch.ngay_gio_bat_dau + $1 * INTERVAL '1 day' as han_kich_hoat
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd_bs ON ch.nhan_su_id = nd_bs.id
      LEFT JOIN phong_lam_viec p_kham ON ch.phong_id = p_kham.id
      WHERE ch.loai = 'KHAM'
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.ngay_gio_bat_dau >= NOW() - $1 * INTERVAL '1 day'
    `, [PACKAGE_ACTIVATION_WINDOW_DAYS]);

    const virtualPlans = prescribedUnpaid.map((item: any) => ({
      id: `virtual-${item.cuoc_hen_id}`,
      khach_hang_id: item.khach_hang_id,
      goi_dich_vu_id: item.goi_dich_vu_id,
      tong_so_buoi: item.tong_so_buoi,
      so_buoi_da_dung: 0,
      trang_thai: 'cho_kich_hoat',
      ngay_kich_hoat: null,
      ten_goi: item.ten_goi,
      loai_goi: item.loai_goi,
      gia_tien: item.gia_tien,
      chan_doan: item.chan_doan,
      chong_chi_dinh: item.chong_chi_dinh,
      ghi_chu_kham: item.ghi_chu_kham,
      ten_bac_si: item.ten_bac_si,
      ten_phong_kham: item.ten_phong_kham,
      cuoc_hen_id: item.cuoc_hen_id,
      han_kich_hoat: item.han_kich_hoat
    }));

    const allPlans = [...plans, ...virtualPlans];

    // 3. Lấy toàn bộ lịch sử cuộc hẹn/buổi điều trị kèm nhật ký chi tiết
    const { rows: appointments } = await pool.query(`
      SELECT
        ch.id, ch.khach_hang_id, ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi, ch.goi_dich_vu_id,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.loai, ch.trang_thai, ch.ghi_chu_khach_hang as ghi_chu,
        nd.ho_ten as ten_nhan_su, nd.vai_tro_id, nd.anh_dai_dien as anh_nhan_su,
        p.ten_phong as ten_phong,
        dv.ten_goi as ten_dich_vu, dv.don_gia as gia_dich_vu,
        nk.vas_truoc, nk.vas_sau, nk.ghi_chu as ghi_chu_tri_lieu, nk.chan_doan as chan_doan_tri_lieu, nk.chong_chi_dinh as chong_chi_dinh_tri_lieu
      FROM cuoc_hen ch
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      ORDER BY ch.ngay_gio_bat_dau DESC
    `);

    // Ghép dữ liệu dạng lồng nhau
    const results = patients.map((p: any) => {
      const patientPlans = allPlans.filter((pl: any) => pl.khach_hang_id === p.id);
      const patientApts = appointments.filter((ap: any) => ap.khach_hang_id === p.id);

      return {
        ...p,
        ma_khach_hang: 'KH-' + p.id.substring(0, 8).toUpperCase(),
        plans: patientPlans,
        appointments: patientApts
      };
    }).filter((p: any) => p.plans.length > 0 || p.appointments.length > 0);

    return results;
  }

  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
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
            AND trang_thai = 'hoan_thanh' 
            AND loai = 'DIEU_TRI'
        ) as so_buoi_da_dung,
        pd.tong_so_buoi,
        COALESCE(gdv.loai_goi, dv.loai_goi) as loai_goi,
        COALESCE(gdv.ten_goi, dv.ten_goi, 'Phí khám lâm sàng & Lượng giá') as ten_dich_vu,
        CASE 
          WHEN hd.hinh_thuc_thanh_toan_goi = 'tung_buoi' AND EXISTS (
            SELECT 1 FROM hoa_don exam_hd 
            WHERE exam_hd.cuoc_hen_id = hd.cuoc_hen_id 
              AND exam_hd.phac_do_dieu_tri_id IS NULL 
              AND exam_hd.trang_thai = 'da_thanh_toan'
          ) THEN 0
          WHEN hd.phac_do_dieu_tri_id IS NULL AND hd.tong_tien_goc > COALESCE(dv.don_gia, 200000) THEN 0
          WHEN hd.cuoc_hen_id IS NOT NULL THEN COALESCE(dv.don_gia, 200000)
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
      ORDER BY hd.ngay_tao DESC
    `);
    return rows;
  }

  async getPayments() {
    const { rows } = await pool.query(`
      SELECT
        gt.id, gt.hoa_don_id, gt.so_tien, gt.loai_giao_dich, gt.phuong_thuc, gt.ma_tham_chieu,
        gt.ma_tham_chieu as ma_giao_dich,
        gt.ngay_giao_dich as thoi_gian_giao_dich,
        gt.chi_tiet,
        'HD-' || UPPER(SUBSTRING(hd.id::text FROM 1 FOR 6)) as ma_hoa_don, kh.ho_ten as ten_khach_hang
      FROM giao_dich_thanh_toan gt
      JOIN hoa_don hd ON gt.hoa_don_id = hd.id
      JOIN khach_hang kh ON hd.khach_hang_id = kh.id
      ORDER BY gt.ngay_giao_dich DESC
    `);
    return rows;
  }

  async handleRefund(id: string, ly_do: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: payments } = await client.query('SELECT * FROM giao_dich_thanh_toan WHERE id = $1', [id]);
      if (payments.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy giao dịch', code: 404 };
      }
      const originalPayment = payments[0];

      if (originalPayment.loai_giao_dich === 'HOAN_TIEN') {
        await client.query('ROLLBACK');
        return { error: 'Giao dịch này đã được hoàn tiền trước đó', code: 400 };
      }

      // Tạo giao dịch hoàn tiền số âm với mã tham chiếu ngắn gọn sạch sẽ
      const maRefund = `REF${Math.floor(10000000 + Math.random() * 90000000)}`;
      const chiTietHoanTien = {
        v: 1,
        loai: 'hoan_tien_don_gian',
        giao_dich_goc: originalPayment.ma_tham_chieu,
        so_tien: Number(originalPayment.so_tien),
        ly_do,
      };
      await client.query(
        `INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
         VALUES ($1, $2, 'HOAN_TIEN', $3, $4, $5, NOW(), $6)`,
        [
          originalPayment.hoa_don_id,
          -BigInt(originalPayment.so_tien),
          originalPayment.phuong_thuc,
          maRefund,
          originalPayment.nhan_vien_thuc_hien_id,
          JSON.stringify(chiTietHoanTien)
        ]
      );

      // Cập nhật lại số tiền đã thanh toán của hóa đơn
      const { rows: invoices } = await client.query(
        'UPDATE hoa_don SET trang_thai = \'chua_thanh_toan\', so_tien_da_tra = so_tien_da_tra - $1 WHERE id = $2 RETURNING *',
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

  // --- QUẢN LÝ MARKETING (VOUCHERS) ---
  async getVouchers() {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, 
             don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, so_luong_da_dung,
             ngay_bat_dau, ngay_het_han, dang_kich_hoat,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'vo_hieu' END as trang_thai
      FROM khuyen_mai_voucher
      ORDER BY ngay_bat_dau DESC
    `);
    return rows;
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, 
             don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, so_luong_da_dung,
             ngay_bat_dau, ngay_het_han, dang_kich_hoat,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'vo_hieu' END as trang_thai
      FROM khuyen_mai_voucher
      WHERE ma_code = $1
    `, [code]);
    return rows[0];
  }

  async createVoucher(data: any, userId: string) {
    const isAct = data.trang_thai === 'hoat_dong' || data.trang_thai === 'kich_hoat' || data.trang_thai === true;
    const { rows } = await pool.query(
      `INSERT INTO khuyen_mai_voucher (ma_code, loai_giam_gia, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han, ngay_bat_dau, ngay_het_han, dang_kich_hoat) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat`,
      [
        data.ma_voucher, 
        data.loai_giam, 
        data.gia_tri_giam ? BigInt(data.gia_tri_giam) : BigInt(0), 
        data.giam_toi_da ? BigInt(data.giam_toi_da) : null, 
        data.don_hang_toi_thieu ? BigInt(data.don_hang_toi_thieu) : BigInt(0), 
        data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null, 
        data.ngay_bat_dau, 
        data.ngay_het_han || null, 
        isAct
      ]
    );
    return rows[0];
  }

  async updateVoucher(id: string, data: any) {
    const isAct = data.trang_thai === 'hoat_dong' || data.trang_thai === 'kich_hoat' || data.trang_thai === true;
    const { rows } = await pool.query(
      `UPDATE khuyen_mai_voucher SET 
        ma_code = $1, loai_giam_gia = $2, gia_tri_giam = $3, giam_toi_da = $4, 
        don_hang_toi_thieu = $5, so_luong_gioi_han = $6, 
        ngay_bat_dau = $7, ngay_het_han = $8, dang_kich_hoat = $9
       WHERE id = $10 
       RETURNING id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat`,
      [
        data.ma_voucher,
        data.loai_giam, 
        data.gia_tri_giam ? BigInt(data.gia_tri_giam) : BigInt(0), 
        data.giam_toi_da ? BigInt(data.giam_toi_da) : null, 
        data.don_hang_toi_thieu ? BigInt(data.don_hang_toi_thieu) : BigInt(0), 
        data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null, 
        data.ngay_bat_dau, 
        data.ngay_het_han || null, 
        isAct,
        id
      ]
    );
    return rows[0];
  }

  async deleteVoucher(id: string) {
    const { rows } = await pool.query('DELETE FROM khuyen_mai_voucher WHERE id = $1 RETURNING id', [id]);
    return rows[0];
  }

  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    const { rows } = await pool.query(`
      SELECT dg.id, dg.so_sao, dg.nhan_xet, kh.ho_ten as ten_khach_hang, 
             nd_ktv.ho_ten as ten_ky_thuat_vien, g.ten_goi as ten_dich_vu,
             now() as thoi_gian_danh_gia
      FROM danh_gia_chat_luong dg
      JOIN cuoc_hen ch ON dg.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      ORDER BY dg.so_sao DESC
    `);
    return rows;
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary() {
    const queries = [
      pool.query('SELECT COUNT(*) FROM khach_hang'),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE trang_thai = \'cho_xac_nhan\''),
      pool.query('SELECT COALESCE(SUM(so_tien), 0) AS sum FROM giao_dich_thanh_toan'),
      pool.query('SELECT COUNT(*) FROM nguoi_dung WHERE trang_thai = \'hoat_dong\''),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE nhan_su_id IS NULL AND trang_thai IN (\'cho_xac_nhan\', \'da_xac_nhan\')'),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE phac_do_dieu_tri_id IS NOT NULL AND nhan_su_id IS NULL AND trang_thai NOT IN (\'hoan_thanh\', \'huy\')'),
      pool.query('SELECT id, ngay_gio_bat_dau AS start_time FROM cuoc_hen WHERE nhan_su_id IS NULL AND trang_thai IN (\'cho_xac_nhan\', \'da_xac_nhan\') ORDER BY ngay_gio_bat_dau ASC LIMIT 1'),
      pool.query('SELECT id, ngay_gio_bat_dau AS start_time FROM cuoc_hen WHERE phac_do_dieu_tri_id IS NOT NULL AND nhan_su_id IS NULL AND trang_thai NOT IN (\'hoan_thanh\', \'huy\') ORDER BY ngay_gio_bat_dau ASC LIMIT 1')
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
        TO_CHAR(ngay_giao_dich, 'YYYY-MM') as month,
        SUM(so_tien) as revenue
      FROM giao_dich_thanh_toan
      WHERE ngay_giao_dich >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    return rows;
  }

  async getStaffPerformance() {
    const { rows } = await pool.query(`
      SELECT 
        nd.ho_ten as name,
        COUNT(ch.id) as sessions
      FROM cuoc_hen ch
      JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      WHERE ch.trang_thai = 'hoan_thanh'
        AND ch.ngay_gio_bat_dau >= DATE_TRUNC('month', NOW())
      GROUP BY nd.ho_ten
      ORDER BY sessions DESC
      LIMIT 5
    `);
    return rows;
  }

  async getAvailableStaff(goi_dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    let thoi_luong = 60; // default duration in minutes
    const finalGoiId = goi_dich_vu_id || dang_ky_goi_id;

    if (finalGoiId) {
      const { rows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [finalGoiId]);
      if (rows.length > 0) {
        thoi_luong = rows[0].thoi_luong_phut;
      }
    }

    const query = `
      SELECT 
        ktv.id as chuyen_gia_id, 
        nd.id as nguoi_dung_id, 
        nd.ho_ten, 
        nd.email, 
        nd.so_dien_thoai,
        vt.ten_vai_tro as vai_tro,
        (
          SELECT COALESCE(COUNT(*), 0)::integer
          FROM cuoc_hen ch
          WHERE ch.nhan_su_id = nd.id 
            AND ch.ngay_gio_bat_dau::date = $1::date 
            AND ch.trang_thai NOT IN ('huy', 'khong_den')
        ) as so_ca_trong_ngay
      FROM ho_so_chuyen_gia ktv
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE vt.ma_vai_tro = 'ky_thuat_vien'
        AND nd.trang_thai = 'hoat_dong'
        -- 1. KTV phai co ca truc bao phu ca thoi gian
        AND EXISTS (
          SELECT 1 FROM lich_truc_nhan_su lt
          WHERE lt.nhan_su_id = nd.id
            AND lt.ngay_truc = $1::date
            AND lt.trang_thai = 'hoat_dong'
            AND lt.gio_bat_dau::time <= $2::time
            AND lt.gio_ket_thuc::time >= ($2::time + ($3 || ' minutes')::interval)::time
        )
        -- 2. Khong trung voi bat ky cuoc hen nao
        AND NOT EXISTS (
          SELECT 1 FROM cuoc_hen ch
          WHERE ch.nhan_su_id = nd.id
            AND ch.trang_thai NOT IN ('huy', 'khong_den')
            AND ch.ngay_gio_bat_dau < ($1::date + $2::time + ($3 || ' minutes')::interval)::timestamp
            AND ch.ngay_gio_ket_thuc > ($1::date + $2::time)::timestamp
        )
        -- 3. Khong trung voi bat ky ca giu cho nao
        AND NOT EXISTS (
          SELECT 1 FROM tam_giu_cho t
          WHERE t.nhan_su_id = nd.id
            AND t.thoi_gian_het_han > NOW()
            AND t.ngay_gio_bat_dau < ($1::date + $2::time + ($3 || ' minutes')::interval)::timestamp
            AND t.ngay_gio_ket_thuc > ($1::date + $2::time)::timestamp
        )
      ORDER BY so_ca_trong_ngay ASC, nd.ho_ten ASC
    `;

    const { rows } = await pool.query(query, [ngay, gio_bat_dau, thoi_luong]);
    return rows;
  }

  async checkRoomFutureShifts(roomId: number) {
    const { rows: shiftRows } = await pool.query(`
      SELECT lt.id, lt.ngay_truc, nd.ho_ten, p.ten_phong
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung nd ON lt.nhan_su_id = nd.id
      JOIN phong_lam_viec p ON lt.phong_id = p.id
      WHERE lt.phong_id = $1 
        AND lt.ngay_truc >= CURRENT_DATE
        AND lt.trang_thai = 'hoat_dong'
      LIMIT 1
    `, [roomId]);
    if (shiftRows.length > 0) {
      throw new Error(`Hiện tại đang có nhân viên trực ở phòng này, vui lòng đổi nhân viên sang phòng khác rồi mới được thao tác bảo trì hoặc ngưng sử dụng.`);
    }

    const { rows: apptRows } = await pool.query(`
      SELECT ch.id, ch.ngay_gio_bat_dau, kh.ho_ten as ten_khach_hang
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      WHERE ch.phong_id = $1 
        AND ch.ngay_gio_ket_thuc >= NOW()
        AND ch.trang_thai NOT IN ('da_huy', 'hoan_thanh')
      LIMIT 1
    `, [roomId]);
    if (apptRows.length > 0) {
      const appt = apptRows[0];
      const dateStr = new Date(appt.ngay_gio_bat_dau).toLocaleString('vi-VN');
      throw new Error(`Không thể xóa hoặc chuyển trạng thái phòng này vì đang có cuộc hẹn lúc ${dateStr} của khách hàng ${appt.ten_khach_hang}.`);
    }
  }

  async syncShiftAppointments(shiftId: string) {
    const { rows: shiftRows } = await pool.query(
      'SELECT nhan_su_id, ngay_truc, gio_bat_dau, gio_ket_thuc, phong_id, trang_thai FROM lich_truc_nhan_su WHERE id = $1',
      [shiftId]
    );
    if (shiftRows.length === 0) return;
    const shift = shiftRows[0];

    const targetRoomId = (shift.trang_thai === 'hoat_dong') ? shift.phong_id : null;

    const dateObj = new Date(shift.ngay_truc);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const startTimeStr = String(shift.gio_bat_dau).trim();
    const endTimeStr = String(shift.gio_ket_thuc).trim();

    const startTimestamp = `${dateStr}T${startTimeStr}+07:00`;
    const endTimestamp = `${dateStr}T${endTimeStr}+07:00`;

    await pool.query(`
      UPDATE cuoc_hen
      SET phong_id = $1
      WHERE nhan_su_id = $2
        AND ngay_gio_bat_dau >= $3::timestamptz
        AND ngay_gio_ket_thuc <= $4::timestamptz
    `, [targetRoomId, shift.nhan_su_id, startTimestamp, endTimestamp]);
  }

  async getCategories() {
    const { rows } = await pool.query('SELECT id, ten_danh_muc, mo_ta, loai_goi_ap_dung FROM danh_muc_goi ORDER BY ten_danh_muc ASC');
    return rows.map(r => ({
      ...r,
      loai_danh_muc: 'goi',
      an_hien: true
    }));
  }

  async createCategory(data: any) {
    const { rows } = await pool.query(
      'INSERT INTO danh_muc_goi (ten_danh_muc, mo_ta, loai_goi_ap_dung) VALUES ($1, $2, $3) RETURNING *',
      [data.ten_danh_muc, data.mo_ta || null, data.loai_goi_ap_dung || 'LIEU_TRINH']
    );
    return {
      ...rows[0],
      loai_danh_muc: 'goi',
      an_hien: true
    };
  }

  async updateCategory(id: string, data: any) {
    const { rows } = await pool.query(
      'UPDATE danh_muc_goi SET ten_danh_muc = $1, mo_ta = $2, loai_goi_ap_dung = $3 WHERE id = $4 RETURNING *',
      [data.ten_danh_muc, data.mo_ta || null, data.loai_goi_ap_dung || 'LIEU_TRINH', id]
    );
    return {
      ...rows[0],
      loai_danh_muc: 'goi',
      an_hien: true
    };
  }

  async deleteCategory(id: string) {
    const { rows } = await pool.query('DELETE FROM danh_muc_goi WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  async handlePackageRefund(
    hoa_don_id: string,
    so_buoi_dung: number,
    phi_phat_percent: number,
    ly_do: string,
    nhan_vien_id: number
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get the package invoice details
      const { rows: hdRows } = await client.query(
        'SELECT * FROM hoa_don WHERE id = $1',
        [hoa_don_id]
      );
      if (hdRows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy hóa đơn', code: 404 };
      }
      const hd = hdRows[0];

      if (hd.trang_thai === 'da_hoan_tien') {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này đã được hoàn tiền trước đó', code: 400 };
      }

      // 2. Fetch the associated treatment plan to know the total sessions
      let totalSessions = 10; // fallback
      let ldtId = hd.phac_do_dieu_tri_id;
      if (ldtId) {
        const { rows: pdRows } = await client.query(
          `SELECT pd.tong_so_buoi
           FROM phac_do_dieu_tri pd
           WHERE pd.id = $1`,
          [ldtId]
        );
        if (pdRows.length > 0) {
          totalSessions = pdRows[0].tong_so_buoi || 10;
        }
      }

      // 3. Perform calculations:
      const hasExam = !!hd.cuoc_hen_id;
      let chi_phi_kham = 0;
      let examAppointment: { ngay_gio_bat_dau: Date; ngay_gio_ket_thuc: Date } | null = null;
      if (hasExam && hd.cuoc_hen_id) {
        const examServiceRes = await client.query(
          `SELECT dv.don_gia, ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc
           FROM cuoc_hen ch
           JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
           WHERE ch.id = $1`,
          [hd.cuoc_hen_id]
        );
        if (examServiceRes.rows && examServiceRes.rows.length > 0) {
          chi_phi_kham = Number(examServiceRes.rows[0].don_gia);
          examAppointment = {
            ngay_gio_bat_dau: examServiceRes.rows[0].ngay_gio_bat_dau,
            ngay_gio_ket_thuc: examServiceRes.rows[0].ngay_gio_ket_thuc,
          };
        } else {
          chi_phi_kham = 200000;
        }
      }

      // Check if separate exam was paid
      let hasPaidSeparateExam = false;
      let separateExamInvoice: { id: string; ngay_tao: Date } | null = null;
      if (hasExam && hd.cuoc_hen_id) {
        // tong_tien_phai_tra > 0: chỉ tính là "đã thanh toán riêng" nếu hóa đơn khám đó thực sự
        // thu tiền. Hóa đơn khám 0đ (miễn phí, đánh dấu "đã thanh toán" chỉ để lưu vết) KHÔNG
        // tính — trường hợp đó phải thu hồi ưu đãi qua examFeeToCharge bên dưới.
        const separatePaidExamRes = await client.query(
          `SELECT id, ngay_tao FROM hoa_don
           WHERE cuoc_hen_id = $1
             AND phac_do_dieu_tri_id IS NULL
             AND trang_thai = 'da_thanh_toan'
             AND tong_tien_phai_tra > 0
             AND id != $2`,
          [hd.cuoc_hen_id, hoa_don_id]
        );
        if (separatePaidExamRes.rows && separatePaidExamRes.rows.length > 0) {
          hasPaidSeparateExam = true;
          separateExamInvoice = separatePaidExamRes.rows[0];
        }
      }

      const examTrace = hasExam ? {
        has_separate_invoice: hasPaidSeparateExam,
        invoice_code: separateExamInvoice ? `HD-${separateExamInvoice.id.substring(0, 6).toUpperCase()}` : null,
        invoice_date: separateExamInvoice ? separateExamInvoice.ngay_tao : null,
        appointment_date: examAppointment ? examAppointment.ngay_gio_bat_dau : null,
        appointment_end: examAppointment ? examAppointment.ngay_gio_ket_thuc : null,
      } : null;

      const tong_tien_goc = Number(hd.tong_tien_goc);
      const ti_le_giam = Number(hd.ti_le_giam_gia_goi || 0);
      const so_tien_da_dong = Number(hd.so_tien_da_tra);

      // Công thức chuẩn: docs/BUSINESS_RULES.md mục 5-6 / backend/src/domain/billing.ts
      const refundCalc = calculatePackageCancellationRefund({
        tongTienGoc: tong_tien_goc,
        soTienDaDong: so_tien_da_dong,
        tiLeGiam: ti_le_giam,
        soBuoiDung: so_buoi_dung,
        tongSoBuoi: totalSessions,
        chiPhiKham: chi_phi_kham,
        hasExam,
        hasPaidSeparateExam,
        phiPhatPercent: phi_phat_percent,
      });

      const chi_phi_buoi_dung = refundCalc.chiPhiBuoiDung;
      const phi_phat_thuc_te = refundCalc.phiPhatThucTe;
      const examFeeToCharge = refundCalc.examFeeToCharge;
      const so_tien_hoan_tra = refundCalc.soTienHoanTra;

      // 4. Create a negative transaction log for the refund
      const maRefund = `REF${Math.floor(10000000 + Math.random() * 90000000)}`;

      const chiTietHoanTien = {
        v: 1,
        so_tien_da_dong,
        gia_goc_goi: refundCalc.giaGocGoi,
        gia_thanh_toan_goi: refundCalc.giaThanhToanGoi,
        chi_phi_buoi_dung,
        so_buoi_dung,
        tong_so_buoi: totalSessions,
        phi_phat_percent,
        phi_phat_thuc_te,
        exam_fee_to_charge: examFeeToCharge,
        exam_trace: examTrace,
        so_tien_hoan_tra,
        ly_do,
      };

      await client.query(
        `INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, ngay_giao_dich, nhan_vien_thuc_hien_id, chi_tiet)
         VALUES ($1, $2, 'HOAN_TIEN', 'tien_mat', $3, NOW(), $4, $5)`,
        [
          hoa_don_id,
          -BigInt(so_tien_hoan_tra),
          maRefund,
          nhan_vien_id,
          JSON.stringify(chiTietHoanTien)
        ]
      );

      const keptRevenuePackage = refundCalc.keptRevenuePackage;

      await client.query(
        `UPDATE hoa_don
         SET trang_thai = 'da_hoan_tien',
             so_tien_da_tra = $1
         WHERE id = $2`,
        [
          Math.max(0, keptRevenuePackage),
          hoa_don_id
        ]
      );

      // 6. Update the associated treatment plan status
      if (ldtId) {
        await client.query(
          `UPDATE phac_do_dieu_tri 
           SET trang_thai = 'da_tam_dung'
           WHERE id = $1`,
          [ldtId]
        );
      }

      await client.query('COMMIT');
      
      // Fetch updated invoice to return
      const { rows: updatedHd } = await client.query('SELECT * FROM hoa_don WHERE id = $1', [hoa_don_id]);
      return { success: true, invoice: updatedHd[0], so_tien_hoan_tra };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export default new AdminRepository();
// nodemon restart trigger
