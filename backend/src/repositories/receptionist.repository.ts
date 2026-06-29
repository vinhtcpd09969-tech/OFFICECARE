import { pool } from '../config/db';

class ReceptionistRepository {
  async getTodayAppointments() {
    const { rows } = await pool.query(`
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.trang_thai,
        'kham_moi' as loai_lich,
        kh_table.id as khach_hang_id,
        kh_table.ho_ten as ten_khach_hang, kh_table.so_dien_thoai as sdt_khach_hang,
        dv.ten_dich_vu,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        ld.phong_id, NULL::integer as giuong_so,
        p.ten_phong
      FROM lich_dat ld
      JOIN khach_hang kh_table ON ld.khach_hang_id = kh_table.id
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.bac_si_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      WHERE DATE(ld.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      
      UNION ALL
      
      SELECT 
        btl.id, 'TR' || UPPER(SUBSTRING(btl.id::text FROM 1 FOR 6)) as ma_lich_dat,
        btl.thoi_gian_bat_dau as ngay_gio_bat_dau, btl.thoi_gian_ket_thuc as ngay_gio_ket_thuc, btl.trang_thai,
        'dieu_tri' as loai_lich,
        kh_table.id as khach_hang_id,
        kh_table.ho_ten as ten_khach_hang, kh_table.so_dien_thoai as sdt_khach_hang,
        dv.ten_dich_vu,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        btl.phong_id, btl.giuong_so,
        p.ten_phong
      FROM buoi_tri_lieu btl
      JOIN khach_hang kh_table ON btl.khach_hang_id = kh_table.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON btl.phong_id = p.id
      WHERE DATE(btl.thoi_gian_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      
      ORDER BY ngay_gio_bat_dau ASC
    `);
    return rows;
  }

  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updateQuery = 'UPDATE lich_dat SET trang_thai = $1 WHERE id = $2 RETURNING *';
      let updateValues: any[] = [trang_thai, id];

      if (ghi_chu_noi_bo !== undefined) {
        updateQuery = 'UPDATE lich_dat SET trang_thai = $1, ghi_chu_noi_bo = $2 WHERE id = $3 RETURNING *';
        updateValues = [trang_thai, ghi_chu_noi_bo, id];
      }

      if (trang_thai === 'da_checkin') {
        const { rows: appts } = await client.query('SELECT dich_vu_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, phong_id FROM lich_dat WHERE id = $1', [id]);
        if (appts.length === 0) throw new Error('Không tìm thấy lịch hẹn');
        const appt = appts[0];

        let phongId = appt.phong_id;
        if (!phongId) {
          const { rows: rooms } = await client.query(`
            SELECT p.id 
            FROM phong p
            JOIN dich_vu dv ON dv.id = $1
            JOIN danh_muc_dich_vu dm ON dv.danh_muc_id = dm.id
            WHERE p.trang_thai = 'san_sang'
            AND (
              (dm.ten_danh_muc LIKE '%Khám%' AND p.loai_phong = 'kham_benh') OR
              (dm.ten_danh_muc LIKE '%Trị liệu%' AND (p.loai_phong = 'tri_lieu' OR p.loai_phong = 'phong_tri_lieu_chuan')) OR
              (dm.ten_danh_muc LIKE '%Phục hồi%' AND (p.loai_phong = 'phuc_hoi' OR p.loai_phong = 'phong_tap_phcn'))
            )
            AND NOT EXISTS (
               SELECT 1 FROM lich_dat ld
               WHERE ld.phong_id = p.id
               AND ld.trang_thai NOT IN ('da_huy', 'khong_den', 'hoan_thanh')
               AND (ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc) OVERLAPS ($2::timestamp, $3::timestamp)
            )
            AND NOT EXISTS (
               SELECT 1 FROM buoi_tri_lieu btl
               WHERE btl.phong_id = p.id
               AND btl.trang_thai NOT IN ('da_huy', 'khong_den', 'hoan_thanh')
               AND btl.thoi_gian_bat_dau < $3::timestamp
               AND (btl.thoi_gian_ket_thuc IS NULL OR btl.thoi_gian_ket_thuc > $2::timestamp)
            )
            LIMIT 1
          `, [appt.dich_vu_id, appt.ngay_gio_bat_dau, appt.ngay_gio_ket_thuc]);

          if (rooms.length === 0) {
            throw new Error('ROOM_UNAVAILABLE');
          }
          phongId = rooms[0].id;
        }

        updateQuery = 'UPDATE lich_dat SET trang_thai = $1, thoi_gian_checkin = NOW(), phong_id = $3 WHERE id = $2 RETURNING *';
        updateValues = [trang_thai, id, phongId];
      }

      let { rows } = await client.query(updateQuery, updateValues);

      if (rows.length === 0) {
        // Try updating buoi_tri_lieu
        const btlQuery = 'UPDATE buoi_tri_lieu SET trang_thai = $1 WHERE id = $2 RETURNING *';
        const btlRes = await client.query(btlQuery, [trang_thai, id]);
        rows = btlRes.rows;

        if (rows.length > 0) {
          await this.updateCompletedSessionsCountInternal(id, client);


        }
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

  async getReceptionistStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE trang_thai = 'da_checkin') as checkin_count,
        COUNT(*) FILTER (WHERE trang_thai IN ('cho_xac_nhan', 'da_xac_nhan')) as waiting_count,
        COUNT(*) as total_today
      FROM lich_dat
      WHERE DATE(ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
    `);
    return rows[0];
  }

  async findCustomerByPhone(phone: string) {
    const { rows } = await pool.query('SELECT id AS khach_hang_id FROM khach_hang WHERE so_dien_thoai = $1', [phone]);
    return rows[0];
  }

  async createWalkInCustomer(ho_ten: string, sdt: string, gioi_tinh: string, ngay_sinh: string | null) {
    const { rows: newKh } = await pool.query(`
      INSERT INTO khach_hang (ho_ten, so_dien_thoai, gioi_tinh, ngay_sinh) VALUES ($1, $2, $3, $4) RETURNING id
    `, [ho_ten, sdt, gioi_tinh || 'khac', ngay_sinh || null]);
    return newKh[0].id;
  }

  async getServiceDuration(dich_vu_id: string) {
    const { rows } = await pool.query('SELECT thoi_luong_phut FROM dich_vu WHERE id = $1', [dich_vu_id]);
    return rows[0]?.thoi_luong_phut || 30;
  }

  async createAppointment(maLichDat: string, khachHangId: string, dich_vu_id: string, ky_thuat_vien_id: string, startTime: Date, endTime: Date) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date();
      const expiryTime = new Date(now.getTime() + 30 * 60000);
      const start = new Date(startTime);
      const han_xac_nhan = expiryTime < start ? expiryTime : start;

      const { rows } = await client.query(`
        INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, bac_si_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, nguoi_tao, han_xac_nhan)
        VALUES ($1, $2, $3, NULL, NULL, $4, $5, 'cho_xac_nhan', 'le_tan', $6) RETURNING id
      `, [maLichDat, khachHangId, dich_vu_id, startTime, endTime, han_xac_nhan]);

      await client.query('COMMIT');
      return rows[0].id;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getAppointmentForBilling(lich_dat_id: string) {
    // 1. Query lich_dat first
    const { rows: ldRows } = await pool.query(`
      SELECT ld.khach_hang_id, ld.dich_vu_id, dv.don_gia 
      FROM lich_dat ld
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      WHERE ld.id = $1 AND ld.trang_thai = 'hoan_thanh'
    `, [lich_dat_id]);
    if (ldRows.length > 0) return ldRows[0];

    // 2. If not found, check if it is a completed buoi_tri_lieu (session 1)
    const { rows: btlRows } = await pool.query(`
      SELECT btl.khach_hang_id, btl.dich_vu_id, dv.don_gia 
      FROM buoi_tri_lieu btl
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      WHERE btl.id = $1 AND btl.trang_thai = 'hoan_thanh'
    `, [lich_dat_id]);
    return btlRows[0];
  }

  async createBilling(maHoaDon: string, khach_hang_id: string, lich_dat_id: string, don_gia: number, dich_vu_id: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if this ID is a buoi_tri_lieu
      const { rows: btlRows } = await client.query(`
        SELECT lich_dieu_tri_id FROM buoi_tri_lieu WHERE id = $1
      `, [lich_dat_id]);

      let ldtId;
      let doctorUserId = null;
      let customerName = 'Khách hàng';

      if (btlRows.length > 0) {
        // Downgrade existing treatment plan
        ldtId = btlRows[0].lich_dieu_tri_id;
        await client.query(`
          UPDATE lich_dieu_tri 
          SET loai_dieu_tri = 'dich_vu_le', tong_so_buoi = 1, trang_thai = 'cho_thanh_toan', goi_dich_vu_id = NULL 
          WHERE id = $1
        `, [ldtId]);

        // Get original consultation and customer details
        const { rows: planDetails } = await client.query(`
          SELECT 
            ldt.lich_dat_id,
            kh.ho_ten as ten_khach_hang
          FROM lich_dieu_tri ldt
          JOIN khach_hang kh ON ldt.khach_hang_id = kh.id
          WHERE ldt.id = $1
        `, [ldtId]);

        if (planDetails.length > 0) {
          customerName = planDetails[0].ten_khach_hang;
          const originalLichDatId = planDetails[0].lich_dat_id;

          if (originalLichDatId) {
            // Update recommendations in original lich_dat
            await client.query(`
              UPDATE lich_dat 
              SET khuyen_nghi_goi_id = NULL, khuyen_nghi_dich_vu_id = $1 
              WHERE id = $2
            `, [dich_vu_id, originalLichDatId]);

            // Get Doctor's user ID
            const { rows: doctorRows } = await client.query(`
              SELECT nd.id as doctor_user_id
              FROM lich_dat ld
              JOIN chuyen_gia_y_te cgyt ON ld.ky_thuat_vien_id = cgyt.id
              JOIN nguoi_dung nd ON cgyt.nguoi_dung_id = nd.id
              WHERE ld.id = $1
            `, [originalLichDatId]);

            if (doctorRows.length > 0) {
              doctorUserId = doctorRows[0].doctor_user_id;
            }
          }
        }
      } else {
        // Create new flexible treatment plan
        // First, check or create ho_so_dieu_tri
        let hsdtId = null;
        if (lich_dat_id) {
          const hsRes = await client.query('SELECT id FROM ho_so_dieu_tri WHERE lich_dat_id = $1', [lich_dat_id]);
          if (hsRes.rows.length > 0) {
            hsdtId = hsRes.rows[0].id;
          }
        }
        if (!hsdtId) {
          const hsRes = await client.query(`
            INSERT INTO ho_so_dieu_tri (chan_doan, chong_chi_dinh, dich_vu_id, ghi_chu)
            VALUES ($1, $2, $3, $4) RETURNING id
          `, ['Khách vãng lai mua dịch vụ lẻ trực tiếp', 'Không có chống chỉ định đặc biệt', dich_vu_id, 'Hồ sơ điều trị khởi tạo tự động khi thanh toán.']);
          hsdtId = hsRes.rows[0].id;
        }

        const maLichDieuTri = `LDT${Math.floor(100000 + Math.random() * 900000)}`;
        const { rows: ldtRows } = await client.query(`
          INSERT INTO lich_dieu_tri (
            khach_hang_id, loai_dieu_tri, tong_so_buoi, 
            so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_so_dieu_tri_id
          ) VALUES ($1, 'dich_vu_le', 1, 0, 'cho_thanh_toan', $2, $3)
          RETURNING id
        `, [khach_hang_id, maLichDieuTri, hsdtId]);
        ldtId = ldtRows[0].id;
      }

      const { rows: hoaDonRows } = await client.query(`
        INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dieu_tri_id, tong_tien_truoc_giam, tong_tien_thanh_toan, trang_thai)
        VALUES ($1, $2, 'dich_vu_don', $3, $4, $4, 'chua_thanh_toan') RETURNING id, ma_hoa_don, tong_tien_thanh_toan
      `, [maHoaDon, khach_hang_id, ldtId, don_gia]);

      await client.query('COMMIT');
      return { hoa_don: hoaDonRows[0], doctorUserId, customerName };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getInvoiceById(id: string) {
    const { rows } = await pool.query('SELECT tong_tien_thanh_toan, da_thanh_toan, loai_thanh_toan, loai_hoa_don, lich_dieu_tri_id FROM hoa_don WHERE id = $1', [id]);
    return rows[0];
  }

  async processPayment(hoa_don_id: string, maGiaoDich: string, tong_tien: number, phuong_thuc: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE hoa_don 
        SET da_thanh_toan = $1, trang_thai = 'da_thanh_toan', ngay_thanh_toan = NOW()
        WHERE id = $2
      `, [tong_tien, hoa_don_id]);

      await client.query(`
        INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai)
        VALUES ($1, $2, $3, $4, 'thanh_cong')
      `, [hoa_don_id, maGiaoDich, tong_tien, phuong_thuc]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getPackageById(id: string) {
    const { rows } = await pool.query(`
      SELECT g.*,
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
      LEFT JOIN goi_dich_vu_chi_tiet ct ON g.id = ct.goi_dich_vu_id
      LEFT JOIN dich_vu dv ON ct.dich_vu_id = dv.id
      WHERE g.id = $1
      GROUP BY g.id
    `, [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getActivePackages() {
    const { rows } = await pool.query(`
      SELECT g.id, g.ten_goi, g.ma_goi, g.mo_ta, g.tong_so_buoi, g.gia_goi, g.gia_goc, g.han_dung_thang,
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
      LEFT JOIN goi_dich_vu_chi_tiet ct ON g.id = ct.goi_dich_vu_id
      LEFT JOIN dich_vu dv ON ct.dich_vu_id = dv.id
      WHERE g.trang_thai = 'hoat_dong'
      GROUP BY g.id
      ORDER BY g.ten_goi ASC
    `);
    return rows;
  }

  async getCompletedAppointments() {
    const { rows } = await pool.query(`
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ngay_gio_bat_dau, ld.trang_thai,
        kh_table.id as khach_hang_id,
        COALESCE(ld.ho_ten_khach, kh_table.ho_ten) as ten_khach_hang, 
        COALESCE(ld.so_dien_thoai, kh_table.so_dien_thoai) as sdt_khach_hang,
        dv.ten_dich_vu, dv.don_gia,
        hsdt.goi_dich_vu_id as khuyen_nghi_goi_id
      FROM lich_dat ld
      JOIN khach_hang kh_table ON ld.khach_hang_id = kh_table.id
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN ho_so_dieu_tri hsdt ON hsdt.lich_dat_id = ld.id
      WHERE ld.trang_thai = 'hoan_thanh'
        AND NOT EXISTS (
          SELECT 1 FROM lich_dieu_tri ldt 
          JOIN ho_so_dieu_tri hsdt2 ON ldt.ho_so_dieu_tri_id = hsdt2.id 
          WHERE hsdt2.lich_dat_id = ld.id
        )

      UNION ALL

      SELECT
        btl.id, 'TR' || UPPER(SUBSTRING(btl.id::text FROM 1 FOR 6)) as ma_lich_dat,
        btl.thoi_gian_bat_dau as ngay_gio_bat_dau, btl.trang_thai,
        kh_table.id as khach_hang_id,
        kh_table.ho_ten as ten_khach_hang, kh_table.so_dien_thoai as sdt_khach_hang,
        dv.ten_dich_vu, dv.don_gia,
        hsba.goi_dich_vu_id as khuyen_nghi_goi_id
      FROM buoi_tri_lieu btl
      JOIN khach_hang kh_table ON btl.khach_hang_id = kh_table.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      JOIN lich_dieu_tri ldt ON btl.lich_dieu_tri_id = ldt.id
      LEFT JOIN ho_so_dieu_tri hsba ON ldt.ho_so_dieu_tri_id = hsba.id
      WHERE btl.so_thu_tu_buoi = 1 
        AND btl.trang_thai = 'hoan_thanh' 
        AND ldt.trang_thai = 'dang_trai_nghiem'
      ORDER BY ngay_gio_bat_dau DESC
    `);
    return rows;
  }

  async getServiceById(id: string) {
    const { rows } = await pool.query('SELECT * FROM dich_vu WHERE id = $1', [id]);
    return rows[0];
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT *
      FROM voucher
      WHERE ma_voucher = $1
    `, [code]);
    return rows[0];
  }

  async countVoucherUsage(voucherId: string) {
    const { rows } = await pool.query('SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1', [voucherId]);
    return parseInt(rows[0].count || '0');
  }

  async getAutoApplyVouchers() {
    const { rows: vouchers } = await pool.query(
      `SELECT * FROM voucher 
       WHERE trang_thai = 'hoat_dong' 
       AND ngay_bat_dau <= CURRENT_DATE 
       AND (ngay_het_han IS NULL OR ngay_het_han >= CURRENT_DATE)
       ORDER BY thoi_gian_tao DESC`
    );
    return vouchers;
  }

  async getCustomerContactInfo(khach_hang_id: string) {
    const { rows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai 
      FROM khach_hang
      WHERE id = $1
    `, [khach_hang_id]);
    return rows[0];
  }

  async createInvoiceDirect(invoiceData: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        khach_hang_id,
        item_type,
        item_id,
        loai_thanh_toan,
        voucher_id,
        so_tien_giam_voucher,
        uu_dai_thanh_toan_id,
        so_tien_giam_phuong_thuc,
        tong_tien_truoc_giam,
        tong_tien_thanh_toan,
        lich_dat_id,
        ten_item,
        so_buoi_goi,
        ho_ten_khach,
        so_dien_thoai
      } = invoiceData;

      // 1. Generate ma_hoa_don
      const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Create treatment plan (lich_dieu_tri) in 'cho_thanh_toan' status (or reuse existing trial plan)
      let ldtId = null;
      const maLichDieuTri = `LDT${Math.floor(100000 + Math.random() * 900000)}`;

      if (lich_dat_id) {
        // First check if the ID points to a buoi_tri_lieu
        const { rows: btlRows } = await client.query(`
          SELECT lich_dieu_tri_id FROM buoi_tri_lieu WHERE id = $1
        `, [lich_dat_id]);

        if (btlRows.length > 0) {
          ldtId = btlRows[0].lich_dieu_tri_id;
        } else {
          // Fall back to checking if it is a lich_dat_id
          const { rows: existingPlans } = await client.query(`
            SELECT id FROM lich_dieu_tri 
            WHERE lich_dat_id = $1 AND trang_thai = 'dang_trai_nghiem'
          `, [lich_dat_id]);
          if (existingPlans.length > 0) {
            ldtId = existingPlans[0].id;
          }
        }

        if (ldtId) {
          await client.query(`
            UPDATE lich_dieu_tri 
            SET trang_thai = 'cho_thanh_toan' 
            WHERE id = $1
          `, [ldtId]);
        }
      }

      if (!ldtId) {
        let hsdtId = null;
        if (lich_dat_id) {
          const hsRes = await client.query('SELECT id FROM ho_so_dieu_tri WHERE lich_dat_id = $1', [lich_dat_id]);
          if (hsRes.rows.length > 0) {
            hsdtId = hsRes.rows[0].id;
          }
        }
        if (!hsdtId) {
          const hsRes = await client.query(`
            INSERT INTO ho_so_dieu_tri (lich_dat_id, chan_doan, chong_chi_dinh, dich_vu_id, goi_dich_vu_id, ghi_chu)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
          `, [
            lich_dat_id || null,
            item_type === 'goi' ? 'Được bác sĩ kê đơn điều trị theo gói' : 'Khách vãng lai mua dịch vụ lẻ trực tiếp',
            'Không có chống chỉ định đặc biệt',
            item_type === 'dich_vu' ? item_id : null,
            item_type === 'goi' ? item_id : null,
            'Khởi tạo tự động khi tạo hóa đơn trực tiếp.'
          ]);
          hsdtId = hsRes.rows[0].id;
        }

        if (item_type === 'goi') {
          const { rows: ldtRows } = await client.query(`
            INSERT INTO lich_dieu_tri (
              khach_hang_id, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, 
              so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_so_dieu_tri_id,
              ho_ten_khach, so_dien_thoai, lich_dat_id
            ) VALUES ($1, $2, $3, $4, 0, 'cho_thanh_toan', $5, $6, $7, $8, $9)
            RETURNING id
          `, [
            khach_hang_id,
            'theo_goi',
            item_id,
            so_buoi_goi || 1,
            maLichDieuTri,
            hsdtId,
            ho_ten_khach || null,
            so_dien_thoai || null,
            lich_dat_id || null
          ]);
          ldtId = ldtRows[0].id;
        } else {
          const { rows: ldtRows } = await client.query(`
            INSERT INTO lich_dieu_tri (
              khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, 
              so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_so_dieu_tri_id,
              ho_ten_khach, so_dien_thoai, lich_dat_id
            ) VALUES ($1, $2, $3, 1, 0, 'cho_thanh_toan', $4, $5, $6, $7, $8)
            RETURNING id
          `, [
            khach_hang_id,
            'dich_vu_le',
            item_id,
            maLichDieuTri,
            hsdtId,
            ho_ten_khach || null,
            so_dien_thoai || null,
            lich_dat_id || null
          ]);
          ldtId = ldtRows[0].id;
        }
      }

      // 3. Create hoa_don
      const { rows: hdRows } = await client.query(`
        INSERT INTO hoa_don (
          ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dieu_tri_id,
          tong_tien_truoc_giam, so_tien_giam, tong_tien_thanh_toan, da_thanh_toan,
          trang_thai, loai_thanh_toan, voucher_id, so_tien_giam_voucher,
          uu_dai_thanh_toan_id, so_tien_giam_phuong_thuc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'chua_thanh_toan', $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        maHoaDon,
        khach_hang_id,
        item_type === 'goi' ? 'goi_dich_vu' : 'dich_vu_don',
        ldtId,
        tong_tien_truoc_giam,
        so_tien_giam_voucher + so_tien_giam_phuong_thuc,
        tong_tien_thanh_toan,
        loai_thanh_toan,
        voucher_id || null,
        so_tien_giam_voucher,
        uu_dai_thanh_toan_id || null,
        so_tien_giam_phuong_thuc
      ]);

      const hoa_don = hdRows[0];

      await client.query('COMMIT');
      return hoa_don;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async processPaymentPartial(
    hoa_don_id: string, 
    maGiaoDich: string, 
    so_tien_nhan: number, 
    da_thanh_toan_moi: number, 
    trang_thai_moi: string, 
    phuong_thuc: string,
    ghi_chu?: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const ngayThanhToanSql = trang_thai_moi === 'da_thanh_toan' ? ', ngay_thanh_toan = NOW()' : '';
      if (ghi_chu) {
        await client.query(`
          UPDATE hoa_don 
          SET da_thanh_toan = $1, trang_thai = $2, ghi_chu = $3 ${ngayThanhToanSql}
          WHERE id = $4
        `, [da_thanh_toan_moi, trang_thai_moi, ghi_chu, hoa_don_id]);
      } else {
        await client.query(`
          UPDATE hoa_don 
          SET da_thanh_toan = $1, trang_thai = $2 ${ngayThanhToanSql}
          WHERE id = $3
        `, [da_thanh_toan_moi, trang_thai_moi, hoa_don_id]);
      }

      await client.query(`
        INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai, ghi_chu)
        VALUES ($1, $2, $3, $4, 'thanh_cong', $5)
      `, [hoa_don_id, maGiaoDich, so_tien_nhan, phuong_thuc, ghi_chu || null]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateTreatmentPlanStatus(id: string, trang_thai: string) {
    await pool.query('UPDATE lich_dieu_tri SET trang_thai = $1 WHERE id = $2', [trang_thai, id]);
  }

  async updateSessionServices(buoi_tri_lieu_id: string, services: any[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const btlRes = await client.query('SELECT ky_thuat_vien_id FROM buoi_tri_lieu WHERE id = $1', [buoi_tri_lieu_id]);
      const defaultKtvId = btlRes.rows.length > 0 ? btlRes.rows[0].ky_thuat_vien_id : null;

      await client.query('DELETE FROM buoi_tri_lieu_dich_vu WHERE buoi_tri_lieu_id = $1', [buoi_tri_lieu_id]);

      for (const item of services) {
        await client.query(`
          INSERT INTO buoi_tri_lieu_dich_vu (
            buoi_tri_lieu_id, dich_vu_id, so_luong, thoi_gian_thuc_hien,
            ktv_id, loai_dich_vu_su_dung, trang_thai, ghi_chu_ly_do, duyet_boi, duyet_luc
          )
          VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
        `, [
          buoi_tri_lieu_id,
          item.dich_vu_id,
          item.so_luong || 1,
          item.ktv_id || defaultKtvId,
          item.loai_dich_vu_su_dung || 'trong_goi',
          item.trang_thai || 'da_duyet',
          item.ghi_chu_ly_do || null,
          item.duyet_boi || null,
          item.duyet_luc ? new Date(item.duyet_luc) : null
        ]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getSessionServices(buoi_tri_lieu_id: string) {
    const { rows } = await pool.query(`
      SELECT bld.*, dv.ten_dich_vu, dv.don_gia
      FROM buoi_tri_lieu_dich_vu bld
      JOIN dich_vu dv ON bld.dich_vu_id = dv.id
      WHERE bld.buoi_tri_lieu_id = $1
    `, [buoi_tri_lieu_id]);
    return rows;
  }

  async updateCompletedSessionsCountInternal(buoi_tri_lieu_id: string, client: any) {
    const btlRes = await client.query('SELECT lich_dieu_tri_id FROM buoi_tri_lieu WHERE id = $1', [buoi_tri_lieu_id]);
    if (btlRes.rows.length === 0) return;
    const ldtId = btlRes.rows[0].lich_dieu_tri_id;
    if (!ldtId) return;

    // Count actual completed buoi_tri_lieu sessions (excluding cancellations/no-shows)
    const countRes = await client.query(
      "SELECT COUNT(*) FROM buoi_tri_lieu WHERE lich_dieu_tri_id = $1 AND trang_thai = 'hoan_thanh'",
      [ldtId]
    );
    const completedCount = parseInt(countRes.rows[0].count || '0');

    // Update lich_dieu_tri.so_buoi_da_dung
    await client.query(
      'UPDATE lich_dieu_tri SET so_buoi_da_dung = $1 WHERE id = $2',
      [completedCount, ldtId]
    );
  }

  async getTreatmentPlanById(id: string) {
    const { rows } = await pool.query('SELECT * FROM lich_dieu_tri WHERE id = $1', [id]);
    return rows[0];
  }

  async confirmTreatmentPlan(planData: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        khach_hang_id,
        item_type,
        item_id,
        lich_dat_id,
        ho_ten_khach,
        so_dien_thoai,
        ghi_chu_noi_bo
      } = planData;

      // 1. Get ho_so_dieu_tri_id and chuyen_gia_id from lich_dat_id
      let hsbaId = null;
      let bacSiId = null;
      if (lich_dat_id) {
        const hsbaRes = await client.query('SELECT id, chuyen_gia_id FROM ho_so_dieu_tri WHERE lich_dat_id = $1', [lich_dat_id]);
        if (hsbaRes.rows.length > 0) {
          hsbaId = hsbaRes.rows[0].id;
          bacSiId = hsbaRes.rows[0].chuyen_gia_id;
        } else {
          const ldRes = await client.query('SELECT bac_si_id FROM lich_dat WHERE id = $1', [lich_dat_id]);
          if (ldRes.rows.length > 0) {
            bacSiId = ldRes.rows[0].bac_si_id;
          }
        }
      }

      // 2. Determine sessions count and initial service
      let tong_so_buoi = 1;
      let target_dich_vu_id = (item_type === 'dich_vu') ? item_id : null;
      let sessionDuration = 60; // default 60 minutes
      if (item_type === 'goi') {
        const pkgRes = await client.query('SELECT tong_so_buoi, thoi_luong_buoi_phut FROM goi_dich_vu WHERE id = $1', [item_id]);
        if (pkgRes.rows.length > 0) {
          tong_so_buoi = pkgRes.rows[0].tong_so_buoi;
          sessionDuration = pkgRes.rows[0].thoi_luong_buoi_phut || 60;
        }
        const svcRes = await client.query('SELECT dich_vu_id FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id = $1 ORDER BY id ASC LIMIT 1', [item_id]);
        if (svcRes.rows.length > 0) {
          target_dich_vu_id = svcRes.rows[0].dich_vu_id;
        }
      } else if (item_type === 'dich_vu') {
        const svcRes = await client.query('SELECT thoi_luong_phut FROM dich_vu WHERE id = $1', [item_id]);
        if (svcRes.rows.length > 0) {
          sessionDuration = svcRes.rows[0].thoi_luong_phut || 60;
        }
      }

      // 3. Insert into lich_dieu_tri
      const maLichDieuTri = `LDT${Math.floor(100000 + Math.random() * 900000)}`;
      const { rows: ldtRows } = await client.query(`
        INSERT INTO lich_dieu_tri (
          khach_hang_id, loai_dieu_tri, tong_so_buoi, 
          so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_so_dieu_tri_id, ghi_chu_noi_bo
        ) VALUES ($1, $2, $3, 0, 'cho_thanh_toan', $4, $5, $6)
        RETURNING *
      `, [
        khach_hang_id,
        item_type === 'goi' ? 'theo_goi' : 'dich_vu_le',
        tong_so_buoi,
        maLichDieuTri,
        hsbaId,
        ghi_chu_noi_bo || null
      ]);
      const ldt = ldtRows[0];

      // 4. Create first session (buoi_tri_lieu 1)
      const ngay_gio_bat_dau = new Date();
      const ngay_gio_ket_thuc = new Date(ngay_gio_bat_dau.getTime() + sessionDuration * 60000);
      await client.query(`
        INSERT INTO buoi_tri_lieu (
          lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, dich_vu_id, 
          thoi_gian_bat_dau, thoi_gian_ket_thuc, so_thu_tu_buoi, trang_thai
        ) VALUES ($1, $2, $3, $4, $5, $6, 1, 'cho_thuc_hien')
      `, [
        ldt.id,
        khach_hang_id,
        bacSiId || null,
        target_dich_vu_id,
        ngay_gio_bat_dau,
        ngay_gio_ket_thuc
      ]);

      await client.query('COMMIT');
      return ldt;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async createInvoiceForTreatmentPlan(invoiceData: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        lich_dieu_tri_id,
        khach_hang_id,
        item_type,
        tong_tien_truoc_giam,
        so_tien_giam_voucher,
        uu_dai_thanh_toan_id,
        so_tien_giam_phuong_thuc,
        tong_tien_thanh_toan,
        loai_thanh_toan,
        voucher_id
      } = invoiceData;

      const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;

      const { rows: hdRows } = await client.query(`
        INSERT INTO hoa_don (
          ma_hoa_don, khach_hang_id, loai_hoa_don, lich_dieu_tri_id,
          tong_tien_truoc_giam, so_tien_giam, tong_tien_thanh_toan, da_thanh_toan,
          trang_thai, loai_thanh_toan, voucher_id, so_tien_giam_voucher,
          uu_dai_thanh_toan_id, so_tien_giam_phuong_thuc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'chua_thanh_toan', $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        maHoaDon,
        khach_hang_id,
        item_type === 'goi' ? 'goi_dich_vu' : 'dich_vu_don',
        lich_dieu_tri_id,
        tong_tien_truoc_giam,
        so_tien_giam_voucher + so_tien_giam_phuong_thuc,
        tong_tien_thanh_toan,
        loai_thanh_toan,
        voucher_id || null,
        so_tien_giam_voucher,
        uu_dai_thanh_toan_id || null,
        so_tien_giam_phuong_thuc
      ]);

      await client.query('COMMIT');
      return hdRows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getTreatmentPlanBySessionId(sessionId: string) {
    const { rows } = await pool.query('SELECT lich_dieu_tri_id FROM buoi_tri_lieu WHERE id = $1', [sessionId]);
    return rows[0] ? rows[0].lich_dieu_tri_id : null;
  }
}

export default new ReceptionistRepository();
