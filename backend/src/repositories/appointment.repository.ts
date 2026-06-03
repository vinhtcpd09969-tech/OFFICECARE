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
        ld.bac_si_id,
        ld.phong_id,
        p.ten_phong,
        hsba.chan_doan,
        hsba.chong_chi_dinh,
        hsba.dich_vu_id AS khuyen_nghi_dich_vu_id,
        hsba.goi_dich_vu_id AS khuyen_nghi_goi_id,
        kn_dv.ten_dich_vu AS khuyen_nghi_ten_dich_vu,
        kn_goi.ten_goi AS khuyen_nghi_ten_goi,
        NULL::integer AS so_thu_tu_buoi,
        NULL::uuid AS goi_dich_vu_id,
        COALESCE(hd.trang_thai, 'chua_thanh_toan') AS trang_thai_thanh_toan
      FROM lich_dat ld
      LEFT JOIN ho_so_benh_an hsba ON hsba.lich_dat_id = ld.id
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.bac_si_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      LEFT JOIN dich_vu kn_dv ON hsba.dich_vu_id = kn_dv.id
      LEFT JOIN goi_dich_vu kn_goi ON hsba.goi_dich_vu_id = kn_goi.id
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
        btl.ky_thuat_vien_id AS bac_si_id,
        btl.phong_id,
        p.ten_phong,
        hsba.chan_doan,
        hsba.chong_chi_dinh,
        NULL::uuid AS khuyen_nghi_dich_vu_id,
        hsba.goi_dich_vu_id AS khuyen_nghi_goi_id,
        NULL::text AS khuyen_nghi_ten_dich_vu,
        kn_goi.ten_goi AS khuyen_nghi_ten_goi,
        btl.so_thu_tu_buoi,
        ldt.goi_dich_vu_id,
        COALESCE(hd.trang_thai, 'chua_thanh_toan') AS trang_thai_thanh_toan
      FROM buoi_tri_lieu btl
      JOIN khach_hang kh ON btl.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN dich_vu dv ON btl.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON btl.phong_id = p.id
      LEFT JOIN lich_dieu_tri ldt ON btl.lich_dieu_tri_id = ldt.id
      LEFT JOIN ho_so_benh_an hsba ON (ldt.ho_so_benh_an_id = hsba.id OR ldt.lich_dat_id = hsba.lich_dat_id)
      LEFT JOIN goi_dich_vu kn_goi ON hsba.goi_dich_vu_id = kn_goi.id
      LEFT JOIN hoa_don hd ON hd.lich_dieu_tri_id = btl.lich_dieu_tri_id
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, email, dich_vu_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, loai_lich, dang_ky_goi_id } = data;
    const bac_si_id = data.bac_si_id || data.chuyen_gia_id || data.ky_thuat_vien_id;
    const ky_thuat_vien_id = bac_si_id; // map back for buoi_tri_lieu if loai_lich === 'dieu_tri'

    // Kiểm tra trùng lịch bác sĩ
    if (bac_si_id) {
      const doctorOverlap = await this.checkDoctorOverlap(bac_si_id, ngay_gio_bat_dau, ngay_gio_ket_thuc);
      if (doctorOverlap) {
        const err: any = new Error('Bác sĩ đã có lịch trong khung giờ này.');
        err.constraint = 'no_overlap_ktv';
        throw err;
      }
    }

    // Kiểm tra trùng lịch phòng
    if (phong_id) {
      const roomOverlap = await this.checkRoomOverlap(phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc);
      if (roomOverlap) {
        const err: any = new Error('Phòng đã được đặt trong khung giờ này.');
        err.constraint = 'no_overlap_phong';
        throw err;
      }
    }

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

      let ldtId = null;
      let target_dich_vu_id = dich_vu_id;

      // Find ho_so_benh_an_id from lich_dat_id
      let hsbaId = null;
      if (data.lich_dat_id) {
        const hsbaRes = await pool.query('SELECT id FROM ho_so_benh_an WHERE lich_dat_id = $1', [data.lich_dat_id]);
        if (hsbaRes.rows.length > 0) {
          hsbaId = hsbaRes.rows[0].id;
        }
      }

      if (dang_ky_goi_id) {
        // Query total sessions from package
        let tong_so_buoi = 1;
        const goiRes = await pool.query('SELECT tong_so_buoi FROM goi_dich_vu WHERE id = $1', [dang_ky_goi_id]);
        if (goiRes.rows.length > 0) {
          tong_so_buoi = goiRes.rows[0].tong_so_buoi;
        }

        const ldtRes = await pool.query(`
          INSERT INTO lich_dieu_tri(khach_hang_id, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, lich_dat_id, ho_ten_khach, so_dien_thoai, ho_so_benh_an_id) 
          VALUES ($1, $2, $3, $4, 0, 'cho_thanh_toan', $5, $6, $7, $8) RETURNING id
        `, [final_khach_hang_id, 'theo_goi', dang_ky_goi_id, tong_so_buoi, data.lich_dat_id || null, ho_ten_khach || null, so_dien_thoai || null, hsbaId]);
        ldtId = ldtRes.rows[0].id;

        if (!target_dich_vu_id) {
          const ktRes = await pool.query('SELECT dich_vu_id FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id = $1 LIMIT 1', [dang_ky_goi_id]);
          if (ktRes.rows.length > 0) {
            target_dich_vu_id = ktRes.rows[0].dich_vu_id;
          }
        }
      } else {
        const ldtRes = await pool.query(`
          INSERT INTO lich_dieu_tri(khach_hang_id, loai_dieu_tri, dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, lich_dat_id, ho_ten_khach, so_dien_thoai, ho_so_benh_an_id) 
          VALUES ($1, $2, $3, 1, 0, 'cho_thanh_toan', $4, $5, $6, $7) RETURNING id
        `, [final_khach_hang_id, 'dich_vu_le', target_dich_vu_id, data.lich_dat_id || null, ho_ten_khach || null, so_dien_thoai || null, hsbaId]);
        ldtId = ldtRes.rows[0].id;
      }

      // First treatment session should be 'cho_xac_nhan' initially, with optional KTV and Room
      const btlRes = await pool.query(`
        INSERT INTO buoi_tri_lieu(lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai, so_thu_tu_buoi)
        VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
        RETURNING *
      `, [ldtId, final_khach_hang_id, ky_thuat_vien_id || null, phong_id || null, target_dich_vu_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, 'cho_xac_nhan']);

      return btlRes.rows[0];
    } else {
      const trang_thai = data.trang_thai || 'cho_xac_nhan';
      const thoi_gian_checkin = trang_thai === 'da_checkin' ? new Date().toISOString() : null;

      const query = `
        INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, bac_si_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, ly_do_kham, nguoi_tao, trang_thai, thoi_gian_checkin)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'le_tan', $13, $14)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        ma_lich_dat, khach_hang_id || null, ho_ten_khach || null, so_dien_thoai || null, gioi_tinh_khach || null, dich_vu_id || null, bac_si_id || null, phong_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich || null, ly_do_kham || null, trang_thai, thoi_gian_checkin
      ]);
      return rows[0];
    }
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const { nguoi_dung_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, trang_thai } = data;

    let khach_hang_id = null;
    if (nguoi_dung_id) {
      const res = await pool.query('SELECT id FROM khach_hang WHERE nguoi_dung_id = $1', [nguoi_dung_id]);
      if (res.rows.length > 0) {
        khach_hang_id = res.rows[0].id;
      }
    }

    const query = `
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, anh_dinh_kem_url, nguoi_tao, trang_thai)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'guest', $10)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, khach_hang_id || null, ho_ten_khach || null, so_dien_thoai || null, gioi_tinh_khach || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham || null, anh_dinh_kem_url || null, trang_thai || 'chua_xac_nhan'
    ]);
    return rows[0];
  }

  // Lấy danh sách giờ đã có lịch (hết chỗ) cho ngày cụ thể - dùng cho trang booking client
  async getBookedSlots(dateStr: string): Promise<string[]> {
    // 1. Lấy danh sách bác sĩ (vai_tro_id = 4) đang hoạt động
    const docQuery = `
      SELECT cg.id AS doctor_id, cg.nguoi_dung_id, nd.ho_ten
      FROM chuyen_gia_y_te cg
      JOIN nguoi_dung nd ON cg.nguoi_dung_id = nd.id
      WHERE nd.vai_tro_id = 4 AND cg.trang_thai = 'hoat_dong'
    `;
    const docRes = await pool.query(docQuery);
    const doctors = docRes.rows;

    // 2. Lấy danh sách ca làm việc (lịch trực) của các bác sĩ trong ngày
    const schedQuery = `
      SELECT nguoi_dung_id, gio_bat_dau, gio_ket_thuc, trang_thai
      FROM lich_lam_viec
      WHERE DATE(ngay) = $1::date AND trang_thai = 'hoat_dong'
    `;
    const schedRes = await pool.query(schedQuery, [dateStr]);
    const schedules = schedRes.rows;

    // 3. Lấy danh sách tất cả các phòng khám sẵn sàng
    const roomQuery = `
      SELECT id FROM phong WHERE trang_thai = 'san_sang'
    `;
    const roomRes = await pool.query(roomQuery);
    const rooms = roomRes.rows;

    // 4. Lấy danh sách tất cả các lịch hẹn/ca trị liệu đang hoạt động của ngày này (đã chuyển sang giờ VN)
    const aptQuery = `
      SELECT 
        id,
        bac_si_id,
        phong_id,
        (ngay_gio_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS bat_dau,
        (ngay_gio_ket_thuc AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS ket_thuc
      FROM lich_dat
      WHERE 
        DATE((ngay_gio_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date
        AND trang_thai NOT IN ('da_huy', 'khong_den')
      
      UNION ALL
      
      SELECT 
        id,
        ky_thuat_vien_id AS bac_si_id,
        phong_id,
        (thoi_gian_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS bat_dau,
        COALESCE((thoi_gian_ket_thuc AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', (thoi_gian_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh' + INTERVAL '30 minutes') AS ket_thuc
      FROM buoi_tri_lieu
      WHERE 
        DATE((thoi_gian_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date
        AND trang_thai NOT IN ('da_huy', 'khong_den')
    `;
    const aptRes = await pool.query(aptQuery, [dateStr]);
    const appointments = aptRes.rows;

    const timeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
      '17:30', '18:00', '18:30', '19:00'
    ];

    const bookedSlots: string[] = [];

    for (const slot of timeSlots) {
      // Dựng mốc thời gian Slot theo múi giờ giả lập UTC (nhằm đồng bộ với cách parse của pg driver)
      const slotStart = new Date(`${dateStr}T${slot}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

      const isOverlapping = (aptStart: any, aptEnd: any) => {
        return slotStart < new Date(aptEnd) && slotEnd > new Date(aptStart);
      };

      // Tìm các ca hẹn bị trùng vào slot này
      const slotApts = appointments.filter(apt => isOverlapping(apt.bat_dau, apt.ket_thuc));
      const occupiedDoctorIds = slotApts.map(apt => apt.bac_si_id).filter(Boolean);
      const occupiedRoomIds = slotApts.map(apt => String(apt.phong_id)).filter(Boolean);

      // Tìm bác sĩ có lịch trực ca phủ kín slot này
      const scheduledDoctors = doctors.filter(doc => {
        const docSched = schedules.find(s => s.nguoi_dung_id === doc.nguoi_dung_id);
        if (!docSched) return false;
        const dutyStart = docSched.gio_bat_dau.substring(0, 5);
        const dutyEnd = docSched.gio_ket_thuc.substring(0, 5);
        return dutyStart <= slot && dutyEnd >= slot;
      });

      // Lọc bác sĩ rảnh và phòng trống
      const freeDoctors = scheduledDoctors.filter(doc => !occupiedDoctorIds.includes(doc.doctor_id));
      const freeRooms = rooms.filter(r => !occupiedRoomIds.includes(String(r.id)));

      // Khung giờ bị coi là HẾT CHỖ chỉ khi không còn bác sĩ nào rảnh HOẶC không còn phòng nào trống
      if (freeDoctors.length === 0 || freeRooms.length === 0) {
        bookedSlots.push(slot);
      }
    }

    return bookedSlots;
  }

  async updateAppointmentStatus(id: string, data: { 
    trang_thai: string; 
    bac_si_id?: string | null; 
    chuyen_gia_id?: string | null; 
    ky_thuat_vien_id?: string | null; 
    phong_id?: string | number | null;
    ngay_gio_bat_dau?: string | null;
    ngay_gio_ket_thuc?: string | null;
  }) {
    const final_bac_si_id = data.bac_si_id !== undefined ? data.bac_si_id : (data.chuyen_gia_id !== undefined ? data.chuyen_gia_id : data.ky_thuat_vien_id);

    // Chỉ kiểm tra trùng lịch nếu trạng thái mới KHÔNG phải là hủy hoặc không đến
    if (data.trang_thai !== 'da_huy' && data.trang_thai !== 'khong_den') {
      // Tìm thông tin lịch hẹn hiện tại để lấy thời gian
      let aptTime = null;
      let isBtl = false;
      
      const ldRes = await pool.query('SELECT ngay_gio_bat_dau, ngay_gio_ket_thuc, bac_si_id, phong_id FROM lich_dat WHERE id = $1', [id]);
      if (ldRes.rows.length > 0) {
        aptTime = ldRes.rows[0];
      } else {
        const btlRes = await pool.query('SELECT thoi_gian_bat_dau as ngay_gio_bat_dau, thoi_gian_ket_thuc as ngay_gio_ket_thuc, ky_thuat_vien_id as bac_si_id, phong_id FROM buoi_tri_lieu WHERE id = $1', [id]);
        if (btlRes.rows.length > 0) {
          aptTime = btlRes.rows[0];
          isBtl = true;
        }
      }

      if (aptTime) {
        const check_bac_si_id = final_bac_si_id !== undefined ? final_bac_si_id : aptTime.bac_si_id;
        const check_phong_id = data.phong_id !== undefined ? data.phong_id : aptTime.phong_id;
        const start = data.ngay_gio_bat_dau ? new Date(data.ngay_gio_bat_dau).toISOString() : new Date(aptTime.ngay_gio_bat_dau).toISOString();
        const end = data.ngay_gio_ket_thuc ? new Date(data.ngay_gio_ket_thuc).toISOString() : (aptTime.ngay_gio_ket_thuc ? new Date(aptTime.ngay_gio_ket_thuc).toISOString() : new Date(new Date(start).getTime() + 30 * 60000).toISOString());

        if (check_bac_si_id) {
          const doctorOverlap = await this.checkDoctorOverlap(
            check_bac_si_id,
            start,
            end,
            isBtl ? undefined : id,
            isBtl ? id : undefined
          );
          if (doctorOverlap) {
            const err: any = new Error('Bác sĩ đã có lịch trong khung giờ này.');
            err.constraint = 'no_overlap_ktv';
            throw err;
          }
        }

        if (check_phong_id) {
          const roomOverlap = await this.checkRoomOverlap(
            check_phong_id,
            start,
            end,
            isBtl ? undefined : id,
            isBtl ? id : undefined
          );
          if (roomOverlap) {
            const err: any = new Error('Phòng đã được đặt trong khung giờ này.');
            err.constraint = 'no_overlap_phong';
            throw err;
          }
        }
      }
    }

    // Try to update lich_dat first
    const ldUpdates = ['trang_thai = $1'];
    const ldValues: any[] = [data.trang_thai];
    let ldParamIndex = 2;

    if (final_bac_si_id !== undefined) {
      ldUpdates.push(`bac_si_id = $${ldParamIndex}`);
      ldValues.push(final_bac_si_id);
      ldParamIndex++;
    }
    if (data.phong_id !== undefined) {
      ldUpdates.push(`phong_id = $${ldParamIndex}`);
      ldValues.push(data.phong_id);
      ldParamIndex++;
    }
    if (data.ngay_gio_bat_dau !== undefined) {
      ldUpdates.push(`ngay_gio_bat_dau = $${ldParamIndex}`);
      ldValues.push(data.ngay_gio_bat_dau);
      ldParamIndex++;
    }
    if (data.ngay_gio_ket_thuc !== undefined) {
      ldUpdates.push(`ngay_gio_ket_thuc = $${ldParamIndex}`);
      ldValues.push(data.ngay_gio_ket_thuc);
      ldParamIndex++;
    }

    ldValues.push(id);
    const ldQuery = `
      UPDATE lich_dat 
      SET ${ldUpdates.join(', ')} 
      WHERE id = $${ldParamIndex} 
      RETURNING *
    `;
    const { rows: ldRows } = await pool.query(ldQuery, ldValues);

    if (ldRows.length > 0) {
      return ldRows[0];
    }

    // If not found in lich_dat, try buoi_tri_lieu
    const btlUpdates = ['trang_thai = $1'];
    const btlValues: any[] = [data.trang_thai];
    let btlParamIndex = 2;

    if (final_bac_si_id !== undefined) {
      btlUpdates.push(`ky_thuat_vien_id = $${btlParamIndex}`);
      btlValues.push(final_bac_si_id);
      btlParamIndex++;
    }
    if (data.phong_id !== undefined) {
      btlUpdates.push(`phong_id = $${btlParamIndex}`);
      btlValues.push(data.phong_id);
      btlParamIndex++;
    }
    if (data.ngay_gio_bat_dau !== undefined) {
      btlUpdates.push(`thoi_gian_bat_dau = $${btlParamIndex}`);
      btlValues.push(data.ngay_gio_bat_dau);
      btlParamIndex++;
    }
    if (data.ngay_gio_ket_thuc !== undefined) {
      btlUpdates.push(`thoi_gian_ket_thuc = $${btlParamIndex}`);
      btlValues.push(data.ngay_gio_ket_thuc);
      btlParamIndex++;
    }

    btlValues.push(id);
    const btlQuery = `
      UPDATE buoi_tri_lieu 
      SET ${btlUpdates.join(', ')} 
      WHERE id = $${btlParamIndex} 
      RETURNING *
    `;
    const { rows: btlRows } = await pool.query(btlQuery, btlValues);

    if (btlRows.length > 0) {
      await this.updateCompletedSessionsCount(id);
      return btlRows[0];
    }

    return null;
  }

  async updateMedicalRecord(id: string, data: { chan_doan?: string, chong_chi_dinh?: string, khuyen_nghi_dich_vu_id?: string | null, khuyen_nghi_goi_id?: string | null }) {
    const query = `
      INSERT INTO ho_so_benh_an (lich_dat_id, chan_doan, chong_chi_dinh, dich_vu_id, goi_dich_vu_id, bac_si_id)
      VALUES ($1, $2, $3, $4, $5, (SELECT bac_si_id FROM lich_dat WHERE id = $1))
      ON CONFLICT (lich_dat_id) DO UPDATE 
      SET chan_doan = EXCLUDED.chan_doan,
          chong_chi_dinh = EXCLUDED.chong_chi_dinh,
          dich_vu_id = EXCLUDED.dich_vu_id,
          goi_dich_vu_id = EXCLUDED.goi_dich_vu_id
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, data.chan_doan || null, data.chong_chi_dinh || null, data.khuyen_nghi_dich_vu_id || null, data.khuyen_nghi_goi_id || null]);
    if (rows.length === 0) {
      throw new Error('Không thể cập nhật hồ sơ bệnh án');
    }
    return {
      lich_dat_id: id,
      chan_doan: rows[0].chan_doan,
      chong_chi_dinh: rows[0].chong_chi_dinh,
      khuyen_nghi_dich_vu_id: rows[0].dich_vu_id,
      khuyen_nghi_goi_id: rows[0].goi_dich_vu_id
    };
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
        ld.bac_si_id,
        ld.phong_id,
        p.ten_phong,
        hsba.chan_doan,
        hsba.chong_chi_dinh,
        ld.ly_do_huy,
        ld.thoi_gian_huy,
        ld.ly_do_kham,
        ld.thoi_gian_tao
      FROM lich_dat ld
      JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      LEFT JOIN ho_so_benh_an hsba ON hsba.lich_dat_id = ld.id
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.bac_si_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      WHERE nd_kh.id = $1
      ORDER BY ld.ngay_gio_bat_dau DESC
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
      SET trang_thai = 'da_huy', ly_do_huy = $1, thoi_gian_huy = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [ly_do_huy, id]);
    return rows[0];
  }

  // Hủy tất cả lịch khám nằm trong giờ nghỉ trưa (12:00–13:00)
  async cancelBreakTimeAppointments(): Promise<{ cancelled_count: number }> {
    const query = `
      UPDATE lich_dat
      SET 
        trang_thai = 'da_huy',
        ly_do_huy = 'Hủy tự động: lịch nằm trong giờ nghỉ trưa (12:00–13:00)',
        thoi_gian_huy = NOW()
      WHERE
        trang_thai NOT IN ('da_huy', 'khong_den')
        AND EXTRACT(HOUR FROM (ngay_gio_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh') = 12
        AND EXTRACT(MINUTE FROM (ngay_gio_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh') < 60
      RETURNING id
    `;
    const { rows } = await pool.query(query);
    return { cancelled_count: rows.length };
  }

  // Kiểm tra trùng lịch bác sĩ
  async checkDoctorOverlap(bac_si_id: string, start: string, end: string, excludeLichDatId?: string, excludeBuoiTriLieuId?: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM (
        SELECT id FROM lich_dat
        WHERE bac_si_id = $1
          AND trang_thai NOT IN ('da_huy', 'khong_den')
          AND ($4::text IS NULL OR id::text != $4::text)
          AND ngay_gio_bat_dau < $3::timestamp
          AND ngay_gio_ket_thuc > $2::timestamp
        
        UNION ALL
        
        SELECT id FROM buoi_tri_lieu
        WHERE ky_thuat_vien_id = $1
          AND trang_thai NOT IN ('da_huy', 'khong_den')
          AND ($5::text IS NULL OR id::text != $5::text)
          AND thoi_gian_bat_dau < $3::timestamp
          AND (thoi_gian_ket_thuc IS NULL OR thoi_gian_ket_thuc > $2::timestamp)
      ) AS overlap_check LIMIT 1
    `;
    const { rows } = await pool.query(query, [bac_si_id, start, end, excludeLichDatId || null, excludeBuoiTriLieuId || null]);
    return rows.length > 0;
  }

  // Kiểm tra trùng lịch phòng
  async checkRoomOverlap(phong_id: string | number, start: string, end: string, excludeLichDatId?: string, excludeBuoiTriLieuId?: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM (
        SELECT id FROM lich_dat
        WHERE phong_id = $1
          AND trang_thai NOT IN ('da_huy', 'khong_den')
          AND ($4::text IS NULL OR id::text != $4::text)
          AND ngay_gio_bat_dau < $3::timestamp
          AND ngay_gio_ket_thuc > $2::timestamp
        
        UNION ALL
        
        SELECT id FROM buoi_tri_lieu
        WHERE phong_id = $1
          AND trang_thai NOT IN ('da_huy', 'khong_den')
          AND ($5::text IS NULL OR id::text != $5::text)
          AND thoi_gian_bat_dau < $3::timestamp
          AND (thoi_gian_ket_thuc IS NULL OR thoi_gian_ket_thuc > $2::timestamp)
      ) AS overlap_check LIMIT 1
    `;
    const { rows } = await pool.query(query, [phong_id, start, end, excludeLichDatId || null, excludeBuoiTriLieuId || null]);
    return rows.length > 0;
  }
}

export default new AppointmentRepository();
