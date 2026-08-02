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
      gia_tien: pkg.don_gia,
      gia_goi: pkg.don_gia,
      gia_goc: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut,
      luot_dung: _count.cuoc_hen
    }));
  }

  async createPackage(data: any) {
    const isAct = data.trang_thai || 'hoat_dong';
    const donGia = data.don_gia ? BigInt(data.don_gia) : BigInt(0);
    const tongSoBuoi = data.tong_so_buoi ? Number(data.tong_so_buoi) : 1;
    const donGiaTheoBuoi = data.don_gia_theo_buoi ? BigInt(data.don_gia_theo_buoi) : BigInt(Math.round(Number(donGia) / tongSoBuoi));

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
        han_su_dung_mac_dinh_ngay: data.loai_goi === 'LIEU_TRINH' && data.han_su_dung_mac_dinh_ngay
          ? Number(data.han_su_dung_mac_dinh_ngay)
          : null
      }
    });

    return {
      ...pkg,
      gia_tien: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut
    };
  }

  async updatePackage(id: string, data: any) {
    const isAct = data.trang_thai || 'hoat_dong';
    const donGia = data.don_gia ? BigInt(data.don_gia) : BigInt(0);
    const tongSoBuoi = data.tong_so_buoi ? Number(data.tong_so_buoi) : 1;
    const donGiaTheoBuoi = data.don_gia_theo_buoi ? BigInt(data.don_gia_theo_buoi) : BigInt(Math.round(Number(donGia) / tongSoBuoi));

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
        han_su_dung_mac_dinh_ngay: data.loai_goi === 'LIEU_TRINH' && data.han_su_dung_mac_dinh_ngay
          ? Number(data.han_su_dung_mac_dinh_ngay)
          : null
      }
    });

    return {
      ...pkg,
      gia_tien: pkg.don_gia,
      thoi_luong_buoi_phut: pkg.thoi_luong_phut
    };
  }

  async deletePackage(id: string) {
    return prisma.goi_dich_vu.update({
      where: { id },
      data: { trang_thai: 'ngung_hoat_dong' }
    });
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    const { rows } = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, nd.anh_dai_dien, nd.vai_tro_id, vt.ten_vai_tro as vai_tro,
             ktv.id as chuyen_gia_id, ktv.so_nam_kinh_nghiem, ktv.bang_cap_chung_chi, ktv.mo_ta, ktv.the_manh
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

  async updateStaffDetails(id: string, data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update basic fields in nguoi_dung
      const { rows: userRows } = await client.query(
        `UPDATE nguoi_dung 
         SET ho_ten = $1, so_dien_thoai = $2, vai_tro_id = $3, email = $4
         WHERE id = $5 RETURNING id, ho_ten, email`,
        [data.ho_ten, data.so_dien_thoai || null, Number(data.vai_tro_id), data.email, Number(id)]
      );

      const isExpertRole = [3, 4].includes(Number(data.vai_tro_id));
      if (isExpertRole) {
        // Upsert specialist profile
        await client.query(
          `INSERT INTO ho_so_chuyen_gia (nguoi_dung_id, so_nam_kinh_nghiem, bang_cap_chung_chi, mo_ta, the_manh)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (nguoi_dung_id) DO UPDATE 
           SET so_nam_kinh_nghiem = EXCLUDED.so_nam_kinh_nghiem,
               bang_cap_chung_chi = EXCLUDED.bang_cap_chung_chi,
               mo_ta = EXCLUDED.mo_ta,
               the_manh = EXCLUDED.the_manh`,
          [
            Number(id),
            Number(data.so_nam_kinh_nghiem) || 0,
            data.bang_cap_chung_chi || '',
            data.mo_ta || '',
            data.the_manh || []
          ]
        );
      } else {
        // If role was changed and is no longer doctor or technician, delete ho_so_chuyen_gia
        await client.query('DELETE FROM ho_so_chuyen_gia WHERE nguoi_dung_id = $1', [Number(id)]);
      }

      await client.query('COMMIT');
      return userRows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStaffPassword(id: string, hash: string) {
    const { rows } = await pool.query(
      'UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE id = $2 RETURNING id, ho_ten, email',
      [hash, Number(id)]
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

  async updateCustomer(id: string, data: any) {
    const { ho_ten, so_dien_thoai, email, gioi_tinh, dia_chi, ngay_sinh, diem_uy_tin } = data;
    const { rows } = await pool.query(`
      UPDATE khach_hang
      SET ho_ten = $1, so_dien_thoai = $2, email = $3, gioi_tinh = $4, dia_chi = $5, ngay_sinh = $6, diem_uy_tin = $7
      WHERE id = $8
      RETURNING *
    `, [ho_ten, so_dien_thoai, email, gioi_tinh, dia_chi, ngay_sinh || null, diem_uy_tin || 0, id]);
    return rows[0];
  }

  async updateCustomerLock(id: string, isLocked: boolean) {
    const status = isLocked ? 'vo_hieu' : 'hoat_dong';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('UPDATE khach_hang SET trang_thai = $1 WHERE id = $2 RETURNING *', [status, id]);
      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Không dùng để CHẶN khóa (khóa luôn cho phép thực hiện) — chỉ để hiển thị cảnh báo cho admin biết
  // khách còn lịch/gói gì trước khi xác nhận, vì khóa không tự hủy các bản ghi này (chỉ chặn khách
  // tự đăng nhập, xem auth.service.ts).
  async getCustomerLockImpact(id: string) {
    const [apptResult, planResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM cuoc_hen
         WHERE khach_hang_id = $1
           AND trang_thai IN ('chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham')`,
        [id]
      ),
      pool.query(
        `SELECT pd.id, g.ten_goi, pd.so_buoi_da_dung, pd.tong_so_buoi
         FROM phac_do_dieu_tri pd
         JOIN goi_dich_vu g ON g.id = pd.goi_dich_vu_id
         WHERE pd.khach_hang_id = $1 AND pd.trang_thai = 'dang_dieu_tri' AND pd.so_buoi_da_dung < pd.tong_so_buoi`,
        [id]
      )
    ]);
    return {
      upcomingAppointments: apptResult.rows[0].cnt as number,
      activePlans: planResult.rows as { id: string; ten_goi: string; so_buoi_da_dung: number; tong_so_buoi: number }[]
    };
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
      UPDATE thiet_bi
      SET trang_thai = 'ngung_su_dung'
      WHERE id = $1::uuid
      RETURNING id, ma_thiet_bi, ten_thiet_bi, trang_thai
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
    const isKtv = userRes.rows[0]?.vai_tro_id === 3;

    // Chỉ Bác sĩ/KTV làm việc gắn với 1 phòng khám/trị liệu cụ thể mới bắt buộc chọn phòng — Lễ tân
    // làm việc ở quầy chung, không có khái niệm "phòng" riêng.
    if ((isDoc || isKtv) && data.trang_thai === 'hoat_dong' && !data.phong_id) {
      throw new Error('Vui lòng phân phòng làm việc cho ca trực của nhân sự.');
    }

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
    const isKtv = userRes.rows[0]?.vai_tro_id === 3;

    // Chỉ Bác sĩ/KTV làm việc gắn với 1 phòng khám/trị liệu cụ thể mới bắt buộc chọn phòng — Lễ tân
    // làm việc ở quầy chung, không có khái niệm "phòng" riêng.
    if ((isDoc || isKtv) && data.trang_thai === 'hoat_dong' && !data.phong_id) {
      throw new Error('Vui lòng phân phòng làm việc cho ca trực của nhân sự.');
    }

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

  // --- KHÁCH HÀNG: TỔNG QUAN CRM (mới, dùng cho /admin/customers/overview) ---
  async getCustomersOverview(filters: { page: number; pageSize: number; search: string; status: string[]; repTier?: 'low' | 'mid' | 'high' }) {
    const { page, pageSize, search, status, repTier } = filters;
    const offset = (page - 1) * pageSize;

    // "locked" và "no_record" là 2 trục lọc ĐỘC LẬP (khóa tài khoản, chưa có hồ sơ điều trị) — kết
    // hợp bằng AND, không phải OR (khác bản cũ vốn coi status[] là nhiều lựa chọn CÙNG 1 trục tier).
    const statusClauses: string[] = [];
    if (status.includes('locked')) statusClauses.push("trang_thai = 'vo_hieu'");
    if (status.includes('no_record')) statusClauses.push('NOT has_record');
    const statusWhere = statusClauses.length ? statusClauses.join(' AND ') : 'TRUE';
    // Luôn tham chiếu $1 trong text (kể cả khi search rỗng — '%%' khớp mọi hàng): pg yêu cầu MỌI
    // placeholder $N phải xuất hiện đâu đó trong câu lệnh để suy ra kiểu dữ liệu, thiếu 1 chỗ dùng
    // $1 (như bản có điều kiện trước đây) gây lỗi "could not determine data type of parameter $1".
    const searchWhere = `(ho_ten ILIKE $1 OR so_dien_thoai ILIKE $1 OR email ILIKE $1 OR ('KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))) ILIKE $1)`;
    // Badge uy tín cap hiển thị ở 100 nhưng lọc theo điểm THẬT trong DB (điểm nhập tay có thể >100).
    const REP_CONDITIONS: Record<string, string> = {
      low: 'diem_uy_tin <= 40',
      mid: 'diem_uy_tin > 40 AND diem_uy_tin <= 70',
      high: 'diem_uy_tin > 70'
    };
    const repWhere = repTier && REP_CONDITIONS[repTier] ? REP_CONDITIONS[repTier] : 'TRUE';

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          kh.id, kh.ho_ten, kh.so_dien_thoai, kh.email, kh.trang_thai, kh.diem_uy_tin,
          COALESCE(spend.total, 0)::bigint AS tong_chi_tieu,
          (
            EXISTS (SELECT 1 FROM phac_do_dieu_tri pd WHERE pd.khach_hang_id = kh.id)
            OR EXISTS (
              SELECT 1 FROM chi_dinh_buoi cd
              JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
              JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
              JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
              WHERE ch.khach_hang_id = kh.id AND cd.phac_do_dieu_tri_id IS NULL
                AND g.loai_goi = 'LIEU_TRINH' AND ch.ngay_gio_bat_dau >= NOW() - $4 * INTERVAL '1 day'
            )
            OR EXISTS (
              SELECT 1 FROM cuoc_hen ch_h
              WHERE ch_h.khach_hang_id = kh.id
                AND ch_h.loai IN ('KHAM', 'DICH_VU_LE')
                AND ch_h.trang_thai NOT IN ('da_huy', 'huy')
            )
          ) AS has_record
        FROM khach_hang kh
        -- Tổng thực thu ròng: SUM mọi giao dịch (hoàn tiền đã ghi số âm nên tự trừ ra) — cùng cách
        -- tính với getTopVipCustomers(), không lọc theo trạng thái hóa đơn (đã chốt với người dùng).
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(gd.so_tien), 0) AS total
          FROM hoa_don hd
          JOIN giao_dich_thanh_toan gd ON gd.hoa_don_id = hd.id
          WHERE hd.khach_hang_id = kh.id
        ) spend ON true
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      WHERE ${searchWhere} AND ${statusWhere} AND ${repWhere}
      ORDER BY ho_ten ASC
      LIMIT $2 OFFSET $3
    `, [`%${search}%`, pageSize, offset, PACKAGE_ACTIVATION_WINDOW_DAYS]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => ({
      id: r.id,
      ma_khach_hang: 'KH-' + r.id.substring(0, 8).toUpperCase(),
      ho_ten: r.ho_ten,
      so_dien_thoai: r.so_dien_thoai,
      email: r.email,
      trang_thai: r.trang_thai,
      diem_uy_tin: r.diem_uy_tin,
      tong_chi_tieu: Number(r.tong_chi_tieu || 0),
      has_record: r.has_record
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  // --- KHÁCH HÀNG: DANH SÁCH LIỆU TRÌNH (1 dòng = 1 phac_do_dieu_tri, không gộp theo khách) ---
  // Bổ sung cho getCustomersOverview() ở trên: bảng đó lọc theo "trạng thái chính" của TỪNG KHÁCH
  // (1 khách chỉ 1 tier hiện tại), nên 1 liệu trình đã hủy/hoàn thành cũ có thể bị che bởi hoạt động
  // gần hơn của cùng khách — không có cách nào lọc ra "mọi liệu trình đã hủy/hoàn thành" theo đúng
  // nghĩa đó. Query này phẳng theo phac_do_dieu_tri, filter đúng trang_thai thật của TỪNG gói.
  async getTreatmentPlansOverview(params: { page: number; pageSize: number; search?: string; status?: string }) {
    const { page, pageSize, search, status } = params;
    const offset = (page - 1) * pageSize;

    const STATUS_CONDITIONS: Record<string, string> = {
      dang_dieu_tri: `trang_thai = 'dang_dieu_tri' AND NOT qua_han`,
      qua_han: `qua_han`,
      hoan_thanh: `trang_thai = 'hoan_thanh'`,
      huy: `trang_thai = 'huy'`
    };
    const statusWhere = status && STATUS_CONDITIONS[status] ? STATUS_CONDITIONS[status] : 'TRUE';
    // Search đọc từ CTE "base" (đã đổi tên cột, không còn alias bảng gốc kh./g.) — KHÔNG copy y hệt
    // searchWhere của getCustomersOverview() vì đó là query phẳng trực tiếp trên FROM khach_hang kh.
    const searchWhere = `(ho_ten ILIKE $1 OR so_dien_thoai ILIKE $1 OR ten_goi ILIKE $1 OR ('KH-' || UPPER(SUBSTRING(khach_hang_id::text FROM 1 FOR 8))) ILIKE $1)`;

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          pd.id, pd.khach_hang_id, pd.tong_so_buoi, pd.trang_thai, pd.ngay_kich_hoat, pd.han_su_dung,
          pd.ngay_hoan_thanh, pd.ngay_huy,
          g.ten_goi,
          kh.ho_ten, kh.so_dien_thoai, kh.email,
          (pd.trang_thai = 'dang_dieu_tri' AND pd.han_su_dung IS NOT NULL AND pd.han_su_dung < CURRENT_DATE) AS qua_han,
          (SELECT COUNT(*)::int FROM cuoc_hen WHERE phac_do_dieu_tri_id = pd.id AND trang_thai = 'hoan_thanh' AND loai = 'DIEU_TRI') AS so_buoi_da_dung
        FROM phac_do_dieu_tri pd
        JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
        JOIN khach_hang kh ON pd.khach_hang_id = kh.id
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      WHERE ${searchWhere} AND ${statusWhere}
      ORDER BY COALESCE(ngay_huy, ngay_hoan_thanh, ngay_kich_hoat) DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [`%${search || ''}%`, pageSize, offset]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => ({
      id: r.id,
      khach_hang_id: r.khach_hang_id,
      ma_khach_hang: 'KH-' + r.khach_hang_id.substring(0, 8).toUpperCase(),
      ho_ten: r.ho_ten,
      so_dien_thoai: r.so_dien_thoai,
      email: r.email,
      ten_goi: r.ten_goi,
      status: r.qua_han ? 'qua_han' : r.trang_thai,
      tong_so_buoi: r.tong_so_buoi,
      so_buoi_da_dung: r.so_buoi_da_dung,
      ngay_kich_hoat: r.ngay_kich_hoat,
      han_su_dung: r.han_su_dung,
      ngay_hoan_thanh: r.ngay_hoan_thanh,
      ngay_huy: r.ngay_huy
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  // --- KHÁCH HÀNG: DANH SÁCH CA KHÁM LẺ HOÀN THÀNH (không lọc — chỉ 1 trạng thái duy nhất) ---
  // Khối bổ sung cho tab "Hồ sơ điều trị" bên cạnh getTreatmentPlansOverview() — phần "hồ sơ" của
  // khách không có gói liệu trình nào (chỉ khám/dùng dịch vụ lẻ) vẫn cần xem được ở đây.
  async getCompletedSingleVisits(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          ch.id, ch.khach_hang_id, ch.loai, ch.ngay_gio_bat_dau,
          kh.ho_ten AS ten_khach_hang,
          g.ten_goi AS ten_dich_vu,
          nd.ho_ten AS ten_nhan_su
        FROM cuoc_hen ch
        JOIN khach_hang kh ON ch.khach_hang_id = kh.id
        LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
        LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
        WHERE ch.loai IN ('KHAM', 'DICH_VU_LE') AND ch.trang_thai = 'hoan_thanh'
      )
      SELECT *, COUNT(*) OVER()::int AS full_count
      FROM base
      ORDER BY ngay_gio_bat_dau DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);

    const total = rows[0]?.full_count ? Number(rows[0].full_count) : 0;
    const data = rows.map((r: any) => ({
      id: r.id,
      khach_hang_id: r.khach_hang_id,
      ho_ten: r.ten_khach_hang,
      loai: r.loai,
      ten_dich_vu: r.ten_dich_vu,
      ngay_gio_bat_dau: r.ngay_gio_bat_dau,
      ten_nhan_su: r.ten_nhan_su
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    };
  }

  // --- KHÁCH HÀNG: HỒ SƠ CHI TIẾT 1 KHÁCH (mới, dùng cho /admin/customers/:id/emr) ---
  // Tái dùng đúng cấu trúc dữ liệu của getMedicalRecords() nhưng lọc theo 1 khách hàng thay vì tải
  // toàn bộ hệ thống (lazy-load) — KHÔNG sửa getMedicalRecords() gốc (trang mồ côi ManageMedicalRecords
  // vẫn cần payload đầy đủ).
  async getCustomerEmr(khachHangId: string) {
    const { rows: patientRows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, trang_thai, diem_uy_tin, ngay_sinh, gioi_tinh, dia_chi
      FROM khach_hang WHERE id = $1
    `, [khachHangId]);
    if (patientRows.length === 0) return null;
    const patient = patientRows[0];

    const { rows: plans } = await pool.query(`
      SELECT
        pd.id, pd.khach_hang_id, pd.goi_dich_vu_id, pd.tong_so_buoi,
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
        pd.trang_thai, pd.ngay_kich_hoat, pd.han_su_dung,
        g.ten_goi, g.loai_goi, g.don_gia as gia_tien,
        nk_kham.chan_doan, nk_kham.chong_chi_dinh, nk_kham.ghi_chu as ghi_chu_kham,
        nd_bs.ho_ten as ten_bac_si, nd_bs.anh_dai_dien as anh_bac_si, nd_bs.vai_tro_id as vai_tro_bac_si,
        p_kham.ten_phong as ten_phong_kham,
        ch_kham.id as cuoc_hen_id, ch_kham.ngay_gio_bat_dau as ngay_gio_kham, ch_kham.ngay_gio_ket_thuc as ngay_gio_ket_thuc_kham,
        hd.id as hoa_don_id,
        hd.hinh_thuc_thanh_toan_goi,
        hd.tong_tien_phai_tra,
        hd.so_tien_da_tra,
        hd.tong_tien_goc,
        hd.ti_le_giam_gia_goi,
        hd.so_tien_giam_voucher,
        hd.trang_thai as hoa_don_trang_thai
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      LEFT JOIN LATERAL (
        SELECT hd_inner.*
        FROM hoa_don hd_inner
        WHERE hd_inner.phac_do_dieu_tri_id = pd.id
        ORDER BY (hd_inner.tong_tien_phai_tra > 0) DESC, hd_inner.ngay_tao DESC
        LIMIT 1
      ) hd ON TRUE
      LEFT JOIN chi_dinh_buoi cd_kham ON cd_kham.phac_do_dieu_tri_id = pd.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_kham ON nk_kham.id = cd_kham.nhat_ky_id
      LEFT JOIN cuoc_hen ch_kham ON ch_kham.id = nk_kham.cuoc_hen_id
      LEFT JOIN nguoi_dung nd_bs ON ch_kham.nhan_su_id = nd_bs.id
      LEFT JOIN phong_lam_viec p_kham ON ch_kham.phong_id = p_kham.id
      WHERE pd.khach_hang_id = $1
      ORDER BY pd.ngay_kich_hoat DESC
    `, [khachHangId]);

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
        ch.ngay_gio_bat_dau + $2 * INTERVAL '1 day' as han_kich_hoat
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd_bs ON ch.nhan_su_id = nd_bs.id
      LEFT JOIN phong_lam_viec p_kham ON ch.phong_id = p_kham.id
      WHERE ch.loai = 'KHAM'
        AND cd.phac_do_dieu_tri_id IS NULL
        AND ch.khach_hang_id = $1
        AND ch.ngay_gio_bat_dau >= NOW() - $2 * INTERVAL '1 day'
    `, [khachHangId, PACKAGE_ACTIVATION_WINDOW_DAYS]);

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

    // Lịch sử cuộc hẹn/buổi điều trị + trạng thái thanh toán mới nhất của hóa đơn liên quan (phục vụ
    // Tab "Khám & Dịch vụ lẻ" — cần biết đã thanh toán hay chưa, không chỉ biết đã hoàn thành hay chưa).
    const { rows: appointments } = await pool.query(`
      SELECT
        ch.id, ch.khach_hang_id, ch.phac_do_dieu_tri_id, ch.so_thu_tu_buoi, ch.goi_dich_vu_id,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.loai, ch.trang_thai, ch.ghi_chu_khach_hang as ghi_chu,
        ch.ghi_chu_khach_hang as ly_do_kham, ch.anh_dinh_kem_url,
        nd.ho_ten as ten_nhan_su, nd.vai_tro_id, nd.anh_dai_dien as anh_nhan_su,
        p.ten_phong as ten_phong,
        dv.ten_goi as ten_dich_vu, dv.don_gia as gia_dich_vu,
        nk.vas_truoc, nk.vas_sau, nk.ghi_chu as ghi_chu_tri_lieu, nk.chan_doan as chan_doan_tri_lieu, nk.chong_chi_dinh as chong_chi_dinh_tri_lieu,
        hd_pay.trang_thai as trang_thai_thanh_toan, hd_pay.tong_tien_phai_tra, hd_pay.so_tien_da_tra
      FROM cuoc_hen ch
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT hd2.trang_thai, hd2.tong_tien_phai_tra, hd2.so_tien_da_tra
        FROM hoa_don hd2
        WHERE hd2.cuoc_hen_id = ch.id
        ORDER BY hd2.ngay_tao DESC LIMIT 1
      ) hd_pay ON true
      WHERE ch.khach_hang_id = $1 AND ch.trang_thai NOT IN ('da_huy', 'huy')
      ORDER BY ch.ngay_gio_bat_dau DESC
    `, [khachHangId]);

    // Dữ liệu thô cho banner nhắc nhở — service tính ngày/giờ còn lại và ghép câu chữ.
    const pendingActivation = prescribedUnpaid[0]
      ? { ten_goi: prescribedUnpaid[0].ten_goi, han_kich_hoat: prescribedUnpaid[0].han_kich_hoat }
      : null;
    const activePlanId = plans.find((p: any) => p.trang_thai === 'dang_dieu_tri')?.id;
    const lastActiveSession = activePlanId
      ? appointments.find((a: any) => a.phac_do_dieu_tri_id === activePlanId && a.trang_thai === 'hoan_thanh')
      : null;

    return {
      ...patient,
      ma_khach_hang: 'KH-' + patient.id.substring(0, 8).toUpperCase(),
      plans: allPlans,
      appointments,
      reminder_raw: {
        pending_activation: pendingActivation,
        last_active_session_at: lastActiveSession?.ngay_gio_bat_dau || null,
        active_plan_name: activePlanId ? plans.find((p: any) => p.id === activePlanId)?.ten_goi : null
      }
    };
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ (MAPPED TO PHAC DO DIEU TRI) ---
  async getMedicalRecords() {
    // Sync completed treatment plans whose actual completed count >= tong_so_buoi.
    // "Không đến" cũng tính là buổi đã tiêu thụ đối với gói Nhóm B (trả thẳng/trả góp — đã trả
    // trước) — khớp công thức so_buoi_da_dung ở updateCompletedSessionsCount (appointment.repository.ts).
    await pool.query(`
      UPDATE phac_do_dieu_tri
      SET trang_thai = 'hoan_thanh', ngay_hoan_thanh = COALESCE(ngay_hoan_thanh, NOW())
      WHERE trang_thai = 'dang_dieu_tri'
        AND (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = phac_do_dieu_tri.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (
                trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat')
                AND (SELECT hinh_thuc_thanh_toan_goi FROM hoa_don WHERE phac_do_dieu_tri_id = phac_do_dieu_tri.id LIMIT 1)
                    IN ('tra_thang', 'tra_gop')
              )
            )
            AND loai = 'DIEU_TRI'
        ) >= tong_so_buoi
    `);

    // 1. Lấy danh sách khách hàng
    const { rows: patients } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, trang_thai, diem_uy_tin, ngay_sinh, gioi_tinh, dia_chi
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
            AND (
              trang_thai = 'hoan_thanh'
              OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND hd.hinh_thuc_thanh_toan_goi IN ('tra_thang', 'tra_gop'))
            )
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
        hd.so_tien_giam_voucher,
        hd.trang_thai as hoa_don_trang_thai
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      -- LATERAL + LIMIT 1: một phác đồ có thể dính nhiều hóa đơn (vd lễ tân lập lại hóa đơn gói).
      -- LEFT JOIN thẳng sẽ nhân bản hàng -> cùng một gói hiện 2 dòng trong danh sách hồ sơ.
      -- Ưu tiên hóa đơn gói THỰC (còn giá trị tiền), mới nhất.
      LEFT JOIN LATERAL (
        SELECT hd_inner.*
        FROM hoa_don hd_inner
        WHERE hd_inner.phac_do_dieu_tri_id = pd.id
        ORDER BY (hd_inner.tong_tien_phai_tra > 0) DESC, hd_inner.ngay_tao DESC
        LIMIT 1
      ) hd ON TRUE
      LEFT JOIN chi_dinh_buoi cd_kham ON cd_kham.phac_do_dieu_tri_id = pd.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_kham ON nk_kham.id = cd_kham.nhat_ky_id
      LEFT JOIN cuoc_hen ch_kham ON ch_kham.id = nk_kham.cuoc_hen_id
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
        AND cd.phac_do_dieu_tri_id IS NULL
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
      -- Giữ lại 'khong_den' (khác 'da_huy'/'huy'): buổi không đến vẫn phải xuất hiện trong danh
      -- sách buổi điều trị của phác đồ để "Các buổi điều trị" (PatientEmrDetail.tsx) khóa/không
      -- cho đặt lại đúng buổi đó với gói Nhóm B đã trả trước — xem resolveNoShowOutcome().
      WHERE ch.trang_thai NOT IN ('da_huy', 'huy')
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
    });

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
        -- Phí khám của hóa đơn này = số đã snapshot lúc bán gói (hd.phi_kham_ap_dung).
        -- dv.don_gia là giá khám HIỆN HÀNH, chỉ dùng làm fallback cho hóa đơn cũ tạo trước khi có
        -- cột snapshot — nếu lấy giá hiện hành thì admin đổi giá khám sẽ làm lệch cả màn hình xem
        -- trước hoàn tiền lẫn số tiền thực truy thu (xem handlePackageRefund + examFeeToCharge).
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
        -- CHỈ tính là "đã đóng khám riêng TRƯỚC KHI mua gói" nếu hóa đơn khám đó được tạo TRƯỚC hóa
        -- đơn gói này (sep_hd.ngay_tao < hd.ngay_tao). Thiếu điều kiện này, hóa đơn khám do
        -- handlePackageRefund() TỰ TÁCH RA SAU khi hủy gói (thu hồi phí khám đã miễn — cùng
        -- cuoc_hen_id) sẽ bị nhầm là "đã đóng riêng lúc mua", khiến panel "Phân tích chi tiết hóa đơn
        -- lúc mua" kể sai câu chuyện (số tiền vẫn đúng, chỉ narrative sai — snapshot ghi_chu lúc
        -- checkout ở receptionist.service.ts không bị ảnh hưởng, vẫn đúng).
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
      -- Sắp theo lần THANH TOÁN GẦN NHẤT (không phải ngay_tao) — hóa đơn trả từng buổi chỉ tạo 1 lần
      -- rồi cập nhật qua nhiều buổi, nếu sắp theo ngay_tao thì hóa đơn vừa thu tiền hôm nay vẫn nằm
      -- im ở vị trí cũ. Hóa đơn chưa có giao dịch nào (chưa thanh toán) vẫn sắp theo ngay_tao như cũ.
      ORDER BY COALESCE(
        (SELECT MAX(gt.ngay_giao_dich) FROM giao_dich_thanh_toan gt WHERE gt.hoa_don_id = hd.id),
        hd.ngay_tao
      ) DESC
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

      // Chặn hoàn tiền 2 lần cho cùng 1 giao dịch gốc — chi_tiet.giao_dich_goc lưu mã tham chiếu
      // của giao dịch THANH_TOAN đã bị hoàn (không có FK cứng, tra theo mã tham chiếu).
      const { rows: existingRefunds } = await client.query(
        `SELECT id FROM giao_dich_thanh_toan
         WHERE loai_giao_dich = 'HOAN_TIEN' AND chi_tiet->>'giao_dich_goc' = $1`,
        [originalPayment.ma_tham_chieu]
      );
      if (existingRefunds.length > 0) {
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
      SELECT id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da,
             don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da,
             ngay_bat_dau, ngay_het_han, dang_kich_hoat, yeu_cau_thanh_toan,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'tam_dung' END as trang_thai
      FROM khuyen_mai_voucher
      ORDER BY ngay_bat_dau DESC
    `);
    return rows;
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da,
             don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da,
             ngay_bat_dau, ngay_het_han, dang_kich_hoat, yeu_cau_thanh_toan,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'tam_dung' END as trang_thai
      FROM khuyen_mai_voucher
      WHERE ma_code = $1
    `, [code]);
    return rows[0];
  }

  async createVoucher(data: any, userId: string) {
    const isAct = data.trang_thai === 'hoat_dong' || data.trang_thai === 'kich_hoat' || data.trang_thai === true;
    const { rows } = await pool.query(
      `INSERT INTO khuyen_mai_voucher (ma_code, ten_chien_dich, loai_giam_gia, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han, ngay_bat_dau, ngay_het_han, dang_kich_hoat, yeu_cau_thanh_toan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat, yeu_cau_thanh_toan`,
      [
        data.ma_voucher,
        data.ten_chien_dich || '',
        data.loai_giam,
        data.gia_tri_giam ? BigInt(data.gia_tri_giam) : BigInt(0),
        data.giam_toi_da ? BigInt(data.giam_toi_da) : null,
        data.don_hang_toi_thieu ? BigInt(data.don_hang_toi_thieu) : BigInt(0),
        data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
        data.ngay_bat_dau,
        data.ngay_het_han || null,
        isAct,
        data.yeu_cau_thanh_toan?.length ? data.yeu_cau_thanh_toan : ['tat_ca']
      ]
    );
    return rows[0];
  }

  async updateVoucher(id: string, data: any) {
    const isAct = data.trang_thai === 'hoat_dong' || data.trang_thai === 'kich_hoat' || data.trang_thai === true;
    const { rows } = await pool.query(
      `UPDATE khuyen_mai_voucher SET
        ma_code = $1, ten_chien_dich = $2, loai_giam_gia = $3, gia_tri_giam = $4, giam_toi_da = $5,
        don_hang_toi_thieu = $6, so_luong_gioi_han = $7,
        ngay_bat_dau = $8, ngay_het_han = $9, dang_kich_hoat = $10, yeu_cau_thanh_toan = $11
       WHERE id = $12
       RETURNING id, ma_code as ma_voucher, ten_chien_dich, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, dang_kich_hoat, yeu_cau_thanh_toan`,
      [
        data.ma_voucher,
        data.ten_chien_dich || '',
        data.loai_giam,
        data.gia_tri_giam ? BigInt(data.gia_tri_giam) : BigInt(0),
        data.giam_toi_da ? BigInt(data.giam_toi_da) : null,
        data.don_hang_toi_thieu ? BigInt(data.don_hang_toi_thieu) : BigInt(0),
        data.so_luong_toi_da ? Number(data.so_luong_toi_da) : null,
        data.ngay_bat_dau,
        data.ngay_het_han || null,
        isAct,
        data.yeu_cau_thanh_toan?.length ? data.yeu_cau_thanh_toan : ['tat_ca'],
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
      SELECT 
        id,
        so_sao_tong,
        so_sao_ktv,
        nhan_xet,
        ten_khach_hang,
        ten_ky_thuat_vien,
        ten_dich_vu,
        thoi_gian_danh_gia,
        phan_hoi_nhan_xet,
        ten_nguoi_phan_hoi,
        ngay_phan_hoi,
        loai_danh_gia,
        cam_xuc,
        do_tin_cay,
        ly_do_cam_xuc,
        de_xuat_hanh_dong,
        de_xuat_phan_hoi
      FROM (
        SELECT
          dg.id,
          dg.so_sao as so_sao_tong,
          NULL::integer as so_sao_ktv,
          dg.nhan_xet,
          kh.ho_ten as ten_khach_hang,
          COALESCE(nd_ktv.ho_ten, '-') as ten_ky_thuat_vien,
          g.ten_goi as ten_dich_vu,
          dg.ngay_cap_nhat as thoi_gian_danh_gia,
          dg.phan_hoi_nhan_xet,
          nd_ph.ho_ten as ten_nguoi_phan_hoi,
          dg.ngay_phan_hoi,
          'service' as loai_danh_gia,
          dg.cam_xuc,
          dg.do_tin_cay,
          dg.ly_do_cam_xuc,
          dg.de_xuat_hanh_dong,
          dg.de_xuat_phan_hoi
        FROM danh_gia dg
        JOIN khach_hang kh ON dg.khach_hang_id = kh.id
        LEFT JOIN goi_dich_vu g ON dg.goi_dich_vu_id = g.id
        LEFT JOIN cuoc_hen ch ON dg.cuoc_hen_id = ch.id
        LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
        LEFT JOIN nguoi_dung nd_ph ON dg.nguoi_phan_hoi_id = nd_ph.id
        WHERE dg.loai_danh_gia = 'GOI_DICH_VU'

        UNION ALL

        SELECT
          dg.id,
          NULL::integer as so_sao_tong,
          dg.so_sao as so_sao_ktv,
          dg.nhan_xet,
          kh.ho_ten as ten_khach_hang,
          nd_ktv.ho_ten as ten_ky_thuat_vien,
          COALESCE(g.ten_goi, '-') as ten_dich_vu,
          dg.ngay_cap_nhat as thoi_gian_danh_gia,
          dg.phan_hoi_nhan_xet,
          nd_ph.ho_ten as ten_nguoi_phan_hoi,
          dg.ngay_phan_hoi,
          'staff' as loai_danh_gia,
          dg.cam_xuc,
          dg.do_tin_cay,
          dg.ly_do_cam_xuc,
          dg.de_xuat_hanh_dong,
          dg.de_xuat_phan_hoi
        FROM danh_gia dg
        JOIN khach_hang kh ON dg.khach_hang_id = kh.id
        JOIN nguoi_dung nd_ktv ON dg.nhan_su_id = nd_ktv.id
        LEFT JOIN cuoc_hen ch ON dg.cuoc_hen_id = ch.id
        LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
        LEFT JOIN nguoi_dung nd_ph ON dg.nguoi_phan_hoi_id = nd_ph.id
        WHERE dg.loai_danh_gia = 'NHAN_SU'
      ) combined
      ORDER BY thoi_gian_danh_gia DESC
    `);
    return rows;
  }

  async replyServiceFeedback(id: string, phanHoi: string, staffId: number) {
    return prisma.danh_gia.update({
      where: { id },
      data: {
        phan_hoi_nhan_xet: phanHoi,
        nguoi_phan_hoi_id: staffId,
        ngay_phan_hoi: new Date()
      }
    });
  }

  async replyStaffFeedback(id: string, phanHoi: string, staffId: number) {
    return prisma.danh_gia.update({
      where: { id },
      data: {
        phan_hoi_nhan_xet: phanHoi,
        nguoi_phan_hoi_id: staffId,
        ngay_phan_hoi: new Date()
      }
    });
  }

  async getFeedbackReviewText(id: string) {
    return prisma.danh_gia.findUnique({ where: { id }, select: { nhan_xet: true, so_sao: true } });
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary(range?: string, startDate?: string, endDate?: string) {
    // Whitelist nghiêm ngặt YYYY-MM-DD trước khi nối chuỗi vào SQL — revWhere/aptWhere được tái sử
    // dụng thô (không tham số hóa) ở nhiều câu query độc lập bên dưới, nên validate ở đây là lớp
    // chặn injection duy nhất cho startDate/endDate (đến từ query string của client).
    const isValidDate = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const hasCustomRange = isValidDate(startDate) && isValidDate(endDate);

    let revWhere = '';
    let aptWhere = '';
    if (hasCustomRange) {
      revWhere = ` WHERE ngay_giao_dich::date >= '${startDate}'::date AND ngay_giao_dich::date <= '${endDate}'::date`;
      aptWhere = ` WHERE ngay_gio_bat_dau::date >= '${startDate}'::date AND ngay_gio_bat_dau::date <= '${endDate}'::date`;
    } else if (range === 'today') {
      revWhere = ' WHERE ngay_giao_dich >= CURRENT_DATE';
      aptWhere = ' WHERE ngay_gio_bat_dau >= CURRENT_DATE';
    } else if (range === 'week') {
      revWhere = " WHERE ngay_giao_dich >= NOW() - INTERVAL '7 days'";
      aptWhere = " WHERE ngay_gio_bat_dau >= NOW() - INTERVAL '7 days'";
    } else if (range === 'month') {
      revWhere = " WHERE ngay_giao_dich >= DATE_TRUNC('month', NOW())";
      aptWhere = " WHERE ngay_gio_bat_dau >= DATE_TRUNC('month', NOW())";
    } else if (range === 'quarter') {
      revWhere = " WHERE ngay_giao_dich >= DATE_TRUNC('quarter', NOW())";
      aptWhere = " WHERE ngay_gio_bat_dau >= DATE_TRUNC('quarter', NOW())";
    } else if (range === 'year') {
      revWhere = " WHERE ngay_giao_dich >= DATE_TRUNC('year', NOW())";
      aptWhere = " WHERE ngay_gio_bat_dau >= DATE_TRUNC('year', NOW())";
    }

    const queries = [
      pool.query('SELECT COUNT(*) FROM khach_hang'),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE trang_thai = \'cho_xac_nhan\''),
      pool.query(`SELECT COALESCE(SUM(so_tien), 0) AS sum FROM giao_dich_thanh_toan ${revWhere}`),
      pool.query('SELECT COUNT(*) FROM nguoi_dung WHERE trang_thai = \'hoat_dong\''),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE phac_do_dieu_tri_id IS NULL AND nhan_su_id IS NULL AND trang_thai IN (\'cho_xac_nhan\', \'da_xac_nhan\')'),
      pool.query('SELECT COUNT(*) FROM cuoc_hen WHERE phac_do_dieu_tri_id IS NOT NULL AND nhan_su_id IS NULL AND trang_thai NOT IN (\'hoan_thanh\', \'huy\', \'da_huy\', \'khong_den\', \'khach_khong_den\', \'khach_khong_den_phat\', \'da_huy_phat\')'),
      pool.query('SELECT id, ngay_gio_bat_dau AS start_time FROM cuoc_hen WHERE phac_do_dieu_tri_id IS NULL AND nhan_su_id IS NULL AND trang_thai IN (\'cho_xac_nhan\', \'da_xac_nhan\') ORDER BY ngay_gio_bat_dau ASC LIMIT 1'),
      pool.query('SELECT id, ngay_gio_bat_dau AS start_time FROM cuoc_hen WHERE phac_do_dieu_tri_id IS NOT NULL AND nhan_su_id IS NULL AND trang_thai NOT IN (\'hoan_thanh\', \'huy\', \'da_huy\', \'khong_den\', \'khach_khong_den\', \'khach_khong_den_phat\', \'da_huy_phat\') ORDER BY ngay_gio_bat_dau ASC LIMIT 1'),
      pool.query(`SELECT COUNT(*)::integer FROM khach_hang WHERE ngay_dong_y_dieu_khoan >= DATE_TRUNC('month', NOW())`),
      pool.query(`SELECT COUNT(*)::integer FROM khach_hang WHERE ngay_dong_y_dieu_khoan >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND ngay_dong_y_dieu_khoan < DATE_TRUNC('month', NOW())`),
      // 'huy' là tên trạng thái hủy CŨ trước khi domain đổi thành 'da_huy'/'da_huy_phat' (xem
      // appointmentStatus.ts::CANCELLED_STATUSES) — vẫn còn dữ liệu cũ mang tên này nên đếm cả 3,
      // nếu chỉ đếm đúng 'huy' như bản gốc thì lịch hủy thật (da_huy/da_huy_phat) sẽ không được tính.
      pool.query(`SELECT (COUNT(CASE WHEN trang_thai IN ('huy', 'da_huy', 'da_huy_phat') THEN 1 END)::float / GREATEST(COUNT(*), 1) * 100)::numeric(5,2) as rate FROM cuoc_hen ${aptWhere}`),
      pool.query(`SELECT COUNT(*)::integer FROM cuoc_hen WHERE trang_thai = 'hoan_thanh' ${aptWhere ? aptWhere.replace('WHERE', 'AND') : ''}`),
      // Gói liệu trình theo trạng thái thật trong phac_do_dieu_tri (chưa bao giờ có 'cho_kich_hoat' ở
      // đây — bảng này chỉ tạo dòng khi đã kích hoạt, xem receptionist.repository.ts). "quá hạn" tách
      // riêng khỏi "đang điều trị" (dang_dieu_tri kỹ thuật vẫn là trạng thái DB, nhưng han_su_dung đã
      // trôi qua) — nuôi chip filter khối "Gói liệu trình" ở tab "Hồ sơ điều trị".
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE trang_thai = 'dang_dieu_tri' AND NOT (han_su_dung IS NOT NULL AND han_su_dung < CURRENT_DATE))::int AS dang_dieu_tri,
          COUNT(*) FILTER (WHERE trang_thai = 'dang_dieu_tri' AND han_su_dung IS NOT NULL AND han_su_dung < CURRENT_DATE)::int AS qua_han,
          COUNT(*) FILTER (WHERE trang_thai = 'hoan_thanh')::int AS hoan_thanh,
          COUNT(*) FILTER (WHERE trang_thai = 'huy')::int AS huy
        FROM phac_do_dieu_tri
      `),
      // "Chờ kích hoạt" là trạng thái ẢO: gói liệu trình đã được bác sĩ chỉ định (chi_dinh_buoi) từ
      // 1 ca khám nhưng khách chưa thanh toán/kích hoạt, còn trong hạn PACKAGE_ACTIVATION_WINDOW_DAYS
      // — cùng logic với getBlockingLieuTrinh() ở doctor.repository.ts.
      pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM chi_dinh_buoi cd
        JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
        JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
        JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
        WHERE cd.phac_do_dieu_tri_id IS NULL
          AND g.loai_goi = 'LIEU_TRINH'
          AND ch.ngay_gio_bat_dau >= NOW() - $1 * INTERVAL '1 day'
      `, [PACKAGE_ACTIVATION_WINDOW_DAYS]),
      // Đếm khách CHƯA có hồ sơ điều trị nào (chưa từng khám/dùng dịch vụ lẻ/có liệu trình) — dùng
      // đúng 3 EXISTS y hệt has_record trong getCustomersOverview() (không được lệch định nghĩa
      // "có hồ sơ" giữa 2 nơi), cho 2 card tĩnh ở tab "Theo khách hàng".
      pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM khach_hang kh
        WHERE NOT (
          EXISTS (SELECT 1 FROM phac_do_dieu_tri pd WHERE pd.khach_hang_id = kh.id)
          OR EXISTS (
            SELECT 1 FROM chi_dinh_buoi cd
            JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
            JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
            JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
            WHERE ch.khach_hang_id = kh.id AND cd.phac_do_dieu_tri_id IS NULL
              AND g.loai_goi = 'LIEU_TRINH' AND ch.ngay_gio_bat_dau >= NOW() - $1 * INTERVAL '1 day'
          )
          OR EXISTS (
            SELECT 1 FROM cuoc_hen ch_h
            WHERE ch_h.khach_hang_id = kh.id AND ch_h.loai IN ('KHAM', 'DICH_VU_LE')
              AND ch_h.trang_thai NOT IN ('da_huy', 'huy')
          )
        )
      `, [PACKAGE_ACTIVATION_WINDOW_DAYS])
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
      earliest_pending: earliestPending,
      customers_this_month: results[8].rows[0].count || 0,
      customers_prev_month: results[9].rows[0].count || 0,
      cancellation_rate: parseFloat(results[10].rows[0].rate || '0'),
      completed_appointments: results[11].rows[0].count || 0,
      // Hồ sơ điều trị = khái niệm chung cho mọi khách đã từng khám, dùng dịch vụ lẻ, hoặc có liệu
      // trình. lieu_trinh nuôi chip filter khối "Gói liệu trình" (tab Hồ sơ điều trị);
      // customers_without_record nuôi 2 card tĩnh (tab Theo khách hàng).
      emr_stats: {
        lieu_trinh: {
          dang_dieu_tri: results[12].rows[0]?.dang_dieu_tri || 0,
          qua_han: results[12].rows[0]?.qua_han || 0,
          hoan_thanh: results[12].rows[0]?.hoan_thanh || 0,
          huy: results[12].rows[0]?.huy || 0,
          cho_kich_hoat: results[13].rows[0]?.cnt || 0,
          tong: (results[12].rows[0]?.dang_dieu_tri || 0) + (results[12].rows[0]?.qua_han || 0)
            + (results[12].rows[0]?.hoan_thanh || 0) + (results[12].rows[0]?.huy || 0) + (results[13].rows[0]?.cnt || 0)
        },
        customers_without_record: results[14].rows[0]?.cnt || 0
      }
    };
  }

  // startDate/endDate + bucket (day/month/year) đến từ đúng 1 bộ lọc 3 chế độ Ngày/Tháng/Năm ở
  // header (cùng nguồn với getDashboardSummary) — chế độ nào quyết định luôn độ chia của biểu đồ,
  // không suy đoán qua độ dài khoảng ngày. range (cũ) giữ lại làm fallback, không còn dùng từ FE mới.
  async getRevenueStats(range?: string, startDate?: string, endDate?: string, bucket?: string) {
    const isValidDate = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const hasCustomRange = isValidDate(startDate) && isValidDate(endDate);

    let formatStr = 'YYYY-MM-DD';
    let startD = startDate || '';
    let endD = endDate || '';

    if (hasCustomRange) {
      formatStr = bucket === 'year' ? 'YYYY' : bucket === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    } else {
      const now = new Date();
      endD = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 6 * 86400000);
      startD = sevenDaysAgo.toISOString().split('T')[0];
      bucket = 'day';
      formatStr = 'YYYY-MM-DD';
    }

    // 1. Fetch actual database revenue grouped by label
    const { rows } = await pool.query(`
      SELECT TO_CHAR(ngay_giao_dich, '${formatStr}') as label, SUM(so_tien) as revenue
      FROM giao_dich_thanh_toan
      WHERE ngay_giao_dich::date >= '${startD}'::date AND ngay_giao_dich::date <= '${endD}'::date
      GROUP BY label
      ORDER BY label ASC
    `);

    const realMap: Record<string, number> = {};
    rows.forEach((r) => {
      realMap[r.label] = Number(r.revenue || 0);
    });

    // 2. Generate complete timeline bucket array between startD and endD
    const timelineLabels: string[] = [];
    const sDate = new Date(`${startD}T00:00:00`);
    const eDate = new Date(`${endD}T00:00:00`);

    if (bucket === 'year') {
      const sYear = sDate.getFullYear();
      const eYear = eDate.getFullYear();
      for (let y = sYear; y <= eYear; y++) {
        timelineLabels.push(`${y}`);
      }
    } else if (bucket === 'month') {
      const curr = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
      const endMonth = new Date(eDate.getFullYear(), eDate.getMonth(), 1);
      while (curr <= endMonth) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        timelineLabels.push(`${y}-${m}`);
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      // day
      const curr = new Date(sDate);
      while (curr <= eDate) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        timelineLabels.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    }

    // 3. 100% REAL DATABASE DATA: If label exists in DB, use real revenue; otherwise exactly 0!
    return timelineLabels.map((label) => ({
      label,
      revenue: realMap[label] || 0
    }));
  }

  async getStaffPerformance() {
    const { rows } = await pool.query(`
      SELECT
        nd.ho_ten as name,
        nd.anh_dai_dien as avatar,
        vt.ten_vai_tro as role,
        COUNT(ch.id)::integer as sessions
      FROM cuoc_hen ch
      JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE ch.trang_thai = 'hoan_thanh'
        AND ch.ngay_gio_bat_dau >= DATE_TRUNC('month', NOW())
      GROUP BY nd.ho_ten, nd.anh_dai_dien, vt.ten_vai_tro
      ORDER BY sessions DESC
      LIMIT 5
    `);
    return rows;
  }

  // Bó lại 12 tháng gần nhất (rolling window, không phải all-time) — 2 lý do: (1) xếp hạng "top"
  // phản ánh đúng nhà vô địch HIỆN TẠI thay vì đóng băng vĩnh viễn theo dữ liệu từ nhiều năm trước,
  // (2) chặn query quét toàn bộ lịch sử phình dần theo năm vận hành. KHÔNG đồng bộ với bộ lọc range
  // ở header (today/week/...) vì khung ngắn sẽ làm bảng gần như trống, mất hết ý nghĩa xếp hạng.
  async getTopPackages() {
    const { rows } = await pool.query(`
      SELECT name, COUNT(*)::integer as count
      FROM (
        SELECT gdv.ten_goi as name, pddt.khach_hang_id
        FROM phac_do_dieu_tri pddt
        JOIN goi_dich_vu gdv ON pddt.goi_dich_vu_id = gdv.id
        WHERE pddt.ngay_kich_hoat >= NOW() - INTERVAL '12 months'
        UNION ALL
        SELECT gdv.ten_goi as name, ch.khach_hang_id
        FROM cuoc_hen ch
        JOIN goi_dich_vu gdv ON ch.goi_dich_vu_id = gdv.id
        WHERE ch.phac_do_dieu_tri_id IS NULL
          AND ch.ngay_gio_bat_dau >= NOW() - INTERVAL '12 months'
      ) combined
      GROUP BY name
      ORDER BY count DESC
      LIMIT 5
    `);
    return rows;
  }

  async getTopVipCustomers() {
    const { rows } = await pool.query(`
      SELECT
        kh.id,
        kh.ho_ten as name,
        kh.so_dien_thoai as phone,
        COALESCE(SUM(gd.so_tien), 0)::bigint as total_paid
      FROM khach_hang kh
      LEFT JOIN hoa_don hd ON kh.id = hd.khach_hang_id
      LEFT JOIN giao_dich_thanh_toan gd ON hd.id = gd.hoa_don_id
        AND gd.ngay_giao_dich >= NOW() - INTERVAL '12 months'
      GROUP BY kh.id, kh.ho_ten, kh.so_dien_thoai
      ORDER BY total_paid DESC
      LIMIT 5
    `);
    return rows.map(r => ({
      ...r,
      total_paid: Number(r.total_paid || 0)
    }));
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
            AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
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
            AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den')
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
        AND ch.trang_thai NOT IN ('da_huy', 'hoan_thanh', 'khong_den')
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

      if (['da_hoan_tien', 'da_huy'].includes(hd.trang_thai)) {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này đã được xử lý (hủy/hoàn tiền) trước đó', code: 400 };
      }

      // 2. Fetch the associated treatment plan to know the total sessions
      let totalSessions = 10; // fallback
      let ldtId = hd.phac_do_dieu_tri_id;
      if (ldtId) {
        const { rows: pdRows } = await client.query(
          `SELECT pd.tong_so_buoi,
                  (pd.trang_thai = 'dang_dieu_tri' AND pd.han_su_dung IS NOT NULL AND pd.han_su_dung < CURRENT_DATE) as qua_han
           FROM phac_do_dieu_tri pd
           WHERE pd.id = $1`,
          [ldtId]
        );
        if (pdRows.length > 0) {
          totalSessions = pdRows[0].tong_so_buoi || 10;
          // Gói đã quá hạn sử dụng phải đi qua đúng luồng expirePackageNoRefund() (giữ nguyên toàn
          // bộ đã thu, không hoàn tiền) — KHÔNG được áp dụng công thức phạt 10% + hoàn phần dư của
          // hủy giữa chừng thông thường ở đây (docs/BUSINESS_RULES.md mục 6b).
          if (pdRows[0].qua_han) {
            await client.query('ROLLBACK');
            return { error: 'Gói đã quá hạn sử dụng. Vui lòng dùng thao tác "Hủy do quá hạn sử dụng" (giữ nguyên số tiền đã thu, không hoàn tiền) thay vì hủy hoàn tiền thông thường.', code: 400 };
          }
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
          examAppointment = {
            ngay_gio_bat_dau: examServiceRes.rows[0].ngay_gio_bat_dau,
            ngay_gio_ket_thuc: examServiceRes.rows[0].ngay_gio_ket_thuc,
          };
        }

        // Ưu tiên tuyệt đối phí khám đã snapshot vào hóa đơn lúc bán gói: đó mới là số tiền thực sự
        // đã miễn cho khách. `goi_dich_vu.don_gia` là giá khám HIỆN HÀNH — admin đổi giá khám sau đó
        // sẽ khiến truy thu sai (hụt hoặc quá tay). Chỉ fallback về giá hiện hành cho hóa đơn cũ
        // tạo trước khi có cột snapshot; không tìm thấy dịch vụ thì để 0, không truy thu số tự bịa.
        chi_phi_kham = Number(hd.phi_kham_ap_dung || 0);
        if (chi_phi_kham === 0 && examServiceRes.rows && examServiceRes.rows.length > 0) {
          chi_phi_kham = Number(examServiceRes.rows[0].don_gia);
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

      // examFeeToCharge > 0 nghĩa là khám được miễn phí gộp vào giá gói (chưa từng có hóa đơn khám
      // riêng) và giờ gói bị hủy giữa chừng — phí này được thu hồi NGAY TRÊN hóa đơn gói (gộp vào
      // keptRevenuePackage ở calculatePackageCancellationRefund()), KHÔNG tách hóa đơn khám riêng
      // nữa. Từng thử tách hóa đơn riêng để "phí không biến mất khỏi hoa_don", nhưng cách đó lại đẻ
      // ra hóa đơn không tương ứng giao dịch thu tiền thật nào (badge "Tự động" phải dán thêm để giải
      // thích), khiến "Tổng tiền" cộng dồn giữa các hóa đơn của cùng khách lệch nhau tùy thứ tự thanh
      // toán khám trước/sau — gộp thẳng vào hóa đơn gói đơn giản hơn và không mất gì (không có báo
      // cáo nào tách bạch "doanh thu khám" riêng khỏi "doanh thu gói" đang dùng tới sự tách đó).
      // examTrace giữ nguyên has_separate_invoice=false cho trường hợp này — panel "Phân tích chi
      // tiết giao dịch hoàn tiền" tự chuyển sang mô tả theo ca khám (ngày/giờ) thay vì mã hóa đơn.

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

      // tong_tien_phai_tra KHÔNG được đổi sau khi tạo — đây là sự kiện lịch sử "lúc mua" (giống hệt
      // tong_tien_goc, ti_le_giam_gia_goi — luôn bất biến), các nơi hiển thị "chi tiết hóa đơn lúc
      // mua" (InvoiceDetailModal.tsx cả Admin lẫn Khách hàng) đọc thẳng field này để dựng lại đúng
      // bối cảnh lúc bán, đổi ngược ở đây sẽ khiến nó tự mâu thuẫn với ghi_chú snapshot cùng lúc tạo
      // (vd "Được miễn phí khám..." nhưng Tổng cần thu lại tụt đúng bằng giá khám).
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
      // Hủy gói + hoàn tiền là hành động KHÔNG đảo ngược -> phác đồ phải là 'huy' (giá trị dùng
      // thống nhất ở receptionist.repository), không phải 'da_tam_dung' (tạm dừng, còn tiếp tục được).
      if (ldtId) {
        await client.query(
          `UPDATE phac_do_dieu_tri
           SET trang_thai = 'huy', ngay_huy = COALESCE(ngay_huy, NOW())
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

  /**
   * Hủy gói KHÔNG hoàn tiền khi phác đồ đã quá hạn sử dụng và khách không còn liên lạc được —
   * khác hẳn `handlePackageRefund` (hủy chủ động, có công thức phạt 10% + hoàn phần dư).
   * Giữ nguyên toàn bộ `so_tien_da_tra` vào doanh thu, không hoàn, không thu thêm, không phân biệt
   * hình thức thanh toán (xem docs/BUSINESS_RULES.md).
   */
  async expirePackageNoRefund(hoa_don_id: string, ly_do: string | undefined, nhan_vien_id: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // FOR UPDATE: khóa dòng hóa đơn ngay từ đầu — tránh race condition với 1 lần thu tiền
      // (processPaymentPartial) chạy song song vừa lúc admin bấm xác nhận hủy.
      const { rows: hdRows } = await client.query('SELECT * FROM hoa_don WHERE id = $1 FOR UPDATE', [hoa_don_id]);
      if (hdRows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy hóa đơn', code: 404 };
      }
      const hd = hdRows[0];

      if (['da_hoan_tien', 'da_huy'].includes(hd.trang_thai)) {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này đã được xử lý (hủy/hoàn tiền) trước đó', code: 400 };
      }

      if (!hd.phac_do_dieu_tri_id) {
        await client.query('ROLLBACK');
        return { error: 'Hóa đơn này không gắn với gói liệu trình nào', code: 400 };
      }

      const { rows: pdRows } = await client.query(
        `SELECT id, han_su_dung, trang_thai,
                (han_su_dung IS NOT NULL AND han_su_dung < CURRENT_DATE) as qua_han
         FROM phac_do_dieu_tri WHERE id = $1 FOR UPDATE`,
        [hd.phac_do_dieu_tri_id]
      );
      if (pdRows.length === 0) {
        await client.query('ROLLBACK');
        return { error: 'Không tìm thấy phác đồ điều trị liên kết', code: 404 };
      }
      const pd = pdRows[0];

      // Backend tự re-validate, không tin tuyệt đối vào việc frontend chỉ hiện nút đúng lúc.
      if (!pd.qua_han) {
        await client.query('ROLLBACK');
        return { error: 'Gói chưa quá hạn sử dụng, không thể hủy theo hình thức này.', code: 400 };
      }

      // Gói đã hoàn thành/hủy trước đó (dù han_su_dung đã trôi qua) KHÔNG được coi là "quá hạn
      // mất liên lạc" — tránh biến 1 hồ sơ điều trị THÀNH CÔNG thành "hủy do mất liên lạc".
      if (['hoan_thanh', 'huy'].includes(pd.trang_thai)) {
        await client.query('ROLLBACK');
        return { error: 'Phác đồ đã hoàn thành hoặc đã hủy trước đó, không thể hủy theo hình thức quá hạn sử dụng.', code: 400 };
      }

      const soTienGiuLai = Number(hd.so_tien_da_tra);
      const hanStr = new Date(pd.han_su_dung).toLocaleDateString('vi-VN');
      const { rows: nvRows } = await client.query('SELECT ho_ten FROM nguoi_dung WHERE id = $1', [nhan_vien_id]);
      const tenNhanVien = nvRows[0]?.ho_ten || `NV#${nhan_vien_id}`;
      const ghiChuMoi = `Hủy do quá hạn sử dụng gói (hạn ${hanStr}), khách không phản hồi. ${tenNhanVien} xác nhận, chốt sổ tại số tiền đã thu (${soTienGiuLai.toLocaleString('vi-VN')}đ), không hoàn/không thu thêm.${ly_do ? ` Lý do: ${ly_do}` : ''}`;

      // Không tạo giao_dich_thanh_toan — không có tiền di chuyển (không hoàn, không thu thêm),
      // và nhan_vien_thuc_hien_id là NOT NULL trong khi hành động này không cần gắn giao dịch tiền.
      // trang_thai hóa đơn set 'da_thanh_toan' (không phải 'da_huy') — đúng bản chất TÀI CHÍNH của
      // hóa đơn (đã thu đủ, không nợ, không hoàn), KHÔNG phải trạng thái "hóa đơn bị hủy". Việc gói
      // liệu trình bị chấm dứt do quá hạn là chuyện của phac_do_dieu_tri.trang_thai ('huy') — nơi
      // canRefundPackage()/remainingDebt (frontend) đọc để biết gói đã hết cửa hoàn tiền, không dựa
      // vào trang_thai của hóa đơn nữa (tránh lẫn 2 khái niệm "tiền" và "gói" vào cùng 1 field).
      await client.query(
        `UPDATE hoa_don
         SET trang_thai = 'da_thanh_toan',
             tong_tien_phai_tra = so_tien_da_tra,
             ghi_chu = COALESCE(ghi_chu || ' | ', '') || $1
         WHERE id = $2`,
        [ghiChuMoi, hoa_don_id]
      );

      // Hủy do quá hạn cũng KHÔNG đảo ngược -> 'huy' (giống hủy hoàn tiền), không phải 'da_tam_dung'.
      await client.query(
        `UPDATE phac_do_dieu_tri SET trang_thai = 'huy', ngay_huy = COALESCE(ngay_huy, NOW()) WHERE id = $1`,
        [pd.id]
      );

      await client.query('COMMIT');

      const { rows: updatedHd } = await pool.query('SELECT * FROM hoa_don WHERE id = $1', [hoa_don_id]);
      return { success: true, invoice: updatedHd[0], so_tien_giu_lai: soTienGiuLai };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Quét "lười" (lazy sweep) — chạy hiệu ứng Y HỆT expirePackageNoRefund() nhưng KHÔNG cần Admin
   * bấm nút: mọi gói còn 'dang_dieu_tri' đã quá han_su_dung tự động chuyển 'huy' + chốt hóa đơn
   * giữ nguyên số đã thu (không hoàn/không thu thêm), gói đã 'hoan_thanh' không bị đụng tới. Gọi
   * lười ở middleware mỗi request (xem index.ts) thay vì cron thật — không cần thêm hạ tầng
   * scheduler, chấp nhận độ trễ tối đa bằng chu kỳ throttle của middleware.
   */
  async sweepExpiredPackages() {
    const { rows } = await pool.query(`
      WITH newly_expired AS (
        UPDATE phac_do_dieu_tri
        SET trang_thai = 'huy', ngay_huy = NOW()
        WHERE trang_thai = 'dang_dieu_tri'
          AND han_su_dung IS NOT NULL
          AND han_su_dung < CURRENT_DATE
        RETURNING id, han_su_dung
      )
      UPDATE hoa_don hd
      SET trang_thai = 'da_thanh_toan',
          tong_tien_phai_tra = hd.so_tien_da_tra,
          ghi_chu = COALESCE(hd.ghi_chu || ' | ', '') ||
            'Hệ thống tự động hủy do quá hạn sử dụng (hạn ' || to_char(ne.han_su_dung, 'DD/MM/YYYY') ||
            '), không hoàn/không thu thêm. Chốt sổ tại số tiền đã thu (' ||
            to_char(hd.so_tien_da_tra, 'FM999,999,999') || 'đ).'
      FROM newly_expired ne
      WHERE hd.phac_do_dieu_tri_id = ne.id
        AND hd.trang_thai NOT IN ('da_hoan_tien', 'da_huy')
      RETURNING hd.id
    `);
    return rows.length;
  }
}

export default new AdminRepository();
// nodemon restart trigger
