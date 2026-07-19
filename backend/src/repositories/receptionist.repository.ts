import { pool } from '../config/db';
import { calculateDiscountPercent, resolveNoShowOutcome, PaymentTransactionDetail, PACKAGE_ACTIVATION_WINDOW_DAYS } from '../domain/billing';
import { HinhThucThanhToanGoi } from '../domain/types';
import appointmentRepository from './appointment.repository';

class ReceptionistRepository {
  async getTodayAppointments() {
    const { rows } = await pool.query(`
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc, 
        ch.trang_thai,
        ch.phac_do_dieu_tri_id as phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        hd_goi.trang_thai as trang_thai_hoa_don_goi,
        hd_goi.so_tien_da_tra as so_tien_da_tra_goi,
        hd_goi.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd_goi.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi,
        hd_goi.id as hoa_don_goi_id,
        CASE 
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, 
        kh.so_dien_thoai as sdt_khach_hang,
        dv.ten_goi as ten_dich_vu,
        ch.nhan_su_id,
        nd_ktv.ho_ten as ten_ky_thuat_vien,
        ch.phong_id as phong_id,
        p.ten_phong as ten_phong,
        COALESCE(
          (
            SELECT created_at 
            FROM otp_codes 
            WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
            ORDER BY created_at DESC 
            LIMIT 1
          ), 
          ch.ngay_gio_bat_dau
        ) as thoi_gian_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN hoa_don hd_goi ON pd.id = hd_goi.phac_do_dieu_tri_id
      WHERE DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND (
          ch.trang_thai != 'chua_xac_nhan'
          OR NOT EXISTS (
            SELECT 1 FROM otp_codes 
            WHERE email = COALESCE(kh.email, (kh.so_dien_thoai || '@officecare.placeholder')) 
              AND expires_at > CURRENT_TIMESTAMP
          )
        )
      ORDER BY ch.ngay_gio_bat_dau ASC
    `);
    return rows;
  }

  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch the appointment first to check types and previous records
      const apptRes = await client.query('SELECT * FROM cuoc_hen WHERE id = $1', [id]);
      if (apptRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn');
      }
      const appt = apptRes.rows[0];

      if (trang_thai === 'hoan_thanh') {
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

      let finalStatus = trang_thai;

      // Handle Cancel / No-Show Logic
      if (['da_huy', 'khong_den', 'khach_khong_den'].includes(trang_thai)) {
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

        const outcome = resolveNoShowOutcome(trang_thai as 'da_huy' | 'khong_den' | 'khach_khong_den', hinhThuc, isPackageSession);
        finalStatus = outcome.finalStatus;
        if (outcome.reputationPenalty > 0) {
          await client.query(
            'UPDATE khach_hang SET diem_uy_tin = GREATEST(0, diem_uy_tin - $1) WHERE id = $2',
            [outcome.reputationPenalty, appt.khach_hang_id]
          );
        }
      }

      const updates = [];
      const values = [finalStatus];
      let paramIndex = 2;

      if (ghi_chu_noi_bo !== undefined) {
        updates.push(`ghi_chu_noi_bo = $${paramIndex}`);
        values.push(ghi_chu_noi_bo);
        paramIndex++;
      }

      if (finalStatus === 'da_huy') {
        updates.push(`thoi_gian_huy = NOW()`);
      }

      // Chỉ HỦY mới giải phóng nhân sự/phòng — "không đến" giữ nguyên (xem giải thích tương tự ở
      // appointment.repository.ts::updateAppointmentStatus) để Bác sĩ/KTV vẫn thấy đúng ca "không
      // đến" thuộc trách nhiệm của mình.
      if (finalStatus === 'da_huy') {
        updates.push(`nhan_su_id = NULL`);
        updates.push(`phong_id = NULL`);
      }

      const updateQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = $1${updates.length > 0 ? ', ' + updates.join(', ') : ''} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      values.push(id);

      const { rows } = await client.query(updateQuery, values);

      if (rows.length > 0) {
        const updatedAppt = rows[0];
        // Buổi "không đến" cũng có thể tiêu thụ 1 buổi (Nhóm B) — gọi lại cả khi finalStatus='khong_den',
        // không chỉ hoan_thanh. Công thức đếm bên dưới tự quyết định có tính buổi đó hay không.
        if (['hoan_thanh', 'khong_den', 'khach_khong_den'].includes(finalStatus) && updatedAppt.phac_do_dieu_tri_id) {
          // Đếm buổi đã TIÊU THỤ: hoan_thanh luôn tính; "không đến" CHỈ tính khi gói Nhóm B (trả
          // thẳng/trả góp). Hủy không bao giờ tính. Xem updateCompletedSessionsCount ở appointment.repository.ts.
          const countRes = await client.query(
            `SELECT COUNT(*)::int as count FROM cuoc_hen
             WHERE phac_do_dieu_tri_id = $1
               AND loai = 'DIEU_TRI'
               AND (
                 trang_thai = 'hoan_thanh'
                 OR (
                   trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat')
                   AND (SELECT hinh_thuc_thanh_toan_goi FROM hoa_don WHERE phac_do_dieu_tri_id = $1 LIMIT 1)
                       IN ('tra_thang', 'tra_gop')
                 )
               )`,
            [updatedAppt.phac_do_dieu_tri_id]
          );
          const completedCount = countRes.rows[0].count || 0;
          const pdRes = await client.query('SELECT tong_so_buoi, trang_thai FROM phac_do_dieu_tri WHERE id = $1', [updatedAppt.phac_do_dieu_tri_id]);
          if (pdRes.rows.length > 0) {
            const { tong_so_buoi, trang_thai } = pdRes.rows[0];
            const statusToSet = completedCount >= tong_so_buoi ? 'hoan_thanh' : (trang_thai === 'hoan_thanh' ? 'dang_dieu_tri' : trang_thai);
            await client.query(
              'UPDATE phac_do_dieu_tri SET so_buoi_da_dung = $1, trang_thai = $2 WHERE id = $3',
              [completedCount, statusToSet, updatedAppt.phac_do_dieu_tri_id]
            );
          }
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

  async getReceptionistStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE trang_thai = 'da_checkin') as checkin_count,
        COUNT(*) FILTER (WHERE trang_thai IN ('cho_xac_nhan', 'da_xac_nhan')) as waiting_count,
        COUNT(*) as total_today
      FROM cuoc_hen
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

  async getServiceDuration(goi_dich_vu_id: string) {
    const { rows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
    return rows[0]?.thoi_luong_phut || 30;
  }

  async createAppointment(maLichDat: string, khachHangId: string, goi_dich_vu_id: string, ky_thuat_vien_id: string, startTime: Date, endTime: Date) {
    // Đặt lịch tại quầy (walk-in) trước đây INSERT thẳng, không hề qua checkCustomerOverlap/
    // checkDoctorOverlap như 2 luồng đặt lịch còn lại (public/客户 và TreatmentBookingModal của
    // Admin/Lễ tân) — áp lại đúng 2 lớp chặn trùng lịch đó cho nhất quán, tránh Lễ tân double-book
    // khách hàng hoặc nhân sự qua đúng cửa này.
    const customerOverlap = await appointmentRepository.checkCustomerOverlap(khachHangId, null, startTime.toISOString(), endTime.toISOString());
    if (customerOverlap) {
      throw new Error('Khách hàng đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này.');
    }
    if (ky_thuat_vien_id) {
      const staffOverlap = await appointmentRepository.checkDoctorOverlap(ky_thuat_vien_id, startTime.toISOString(), endTime.toISOString());
      if (staffOverlap) {
        throw new Error('Nhân sự được chọn đã có lịch trong khung giờ này.');
      }
    }

    const { rows } = await pool.query(`
      INSERT INTO cuoc_hen (khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai)
      VALUES ($1, $2, $3, $4, $5, 'DICH_VU_LE', 'cho_xac_nhan') RETURNING id
    `, [khachHangId, goi_dich_vu_id, ky_thuat_vien_id ? parseInt(ky_thuat_vien_id, 10) : null, startTime, endTime]);
    return rows[0].id;
  }

  async getAppointmentForBilling(lich_dat_id: string) {
    const { rows } = await pool.query(`
      SELECT ch.khach_hang_id, ch.goi_dich_vu_id, g.don_gia 
      FROM cuoc_hen ch
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE ch.id = $1 AND ch.trang_thai = 'hoan_thanh'
    `, [lich_dat_id]);
    return rows[0];
  }

  async createBilling(maHoaDon: string, khach_hang_id: string, lich_dat_id: string, don_gia: number, goi_dich_vu_id: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the cuoc_hen row to prevent concurrent race conditions
      await client.query(`
        SELECT id FROM cuoc_hen WHERE id = $1 FOR UPDATE
      `, [lich_dat_id]);

      // Check if there is already an existing invoice for this cuoc_hen_id to prevent duplicates
      const { rows: existingInvoice } = await client.query(`
        SELECT id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra, so_tien_da_tra, trang_thai
        FROM hoa_don
        WHERE cuoc_hen_id = $1
      `, [lich_dat_id]);

      if (existingInvoice.length > 0) {
        let doctorUserId = null;
        let customerName = 'Khách hàng';

        const { rows: custDetails } = await client.query(`
          SELECT ho_ten FROM khach_hang WHERE id = $1
        `, [khach_hang_id]);
        if (custDetails.length > 0) {
          customerName = custDetails[0].ho_ten;
        }

        const { rows: docRows } = await client.query(`
          SELECT nhan_su_id FROM cuoc_hen WHERE id = $1
        `, [lich_dat_id]);
        if (docRows.length > 0) {
          doctorUserId = docRows[0].nhan_su_id;
        }

        let tenItem = 'Khám lâm sàng / Dịch vụ y tế';
        let soBuoiGoi = 1;
        if (goi_dich_vu_id) {
          const { rows: pkgRows } = await client.query('SELECT ten_goi, tong_so_buoi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
          if (pkgRows.length > 0) {
            tenItem = pkgRows[0].ten_goi;
            soBuoiGoi = pkgRows[0].tong_so_buoi || 1;
          }
        }

        await client.query('COMMIT');
        return {
          hoa_don: {
            id: existingInvoice[0].id,
            ma_hoa_don: existingInvoice[0].ma_hoa_don,
            khach_hang_id,
            loai_hoa_don: 'dich_vu_don',
            tong_tien_truoc_giam: Number(existingInvoice[0].tong_tien_phai_tra),
            tong_tien_thanh_toan: Number(existingInvoice[0].tong_tien_phai_tra),
            so_tien_da_tra: Number(existingInvoice[0].so_tien_da_tra),
            trang_thai: existingInvoice[0].trang_thai,
            ten_item: tenItem,
            so_buoi_goi: soBuoiGoi,
            isNew: false
          },
          doctorUserId,
          customerName
        };
      }
      
      // Check if this ID is a cuoc_hen
      const { rows: apptRows } = await client.query(`
        SELECT phac_do_dieu_tri_id, loai FROM cuoc_hen WHERE id = $1
      `, [lich_dat_id]);

      let phacDoId = null;
      let doctorUserId = null;
      let customerName = 'Khách hàng';
      const isExam = apptRows.length > 0 && (apptRows[0].loai === 'KHAM' || apptRows[0].loai === 'KHAM_MOI');

      if (apptRows.length > 0 && apptRows[0].phac_do_dieu_tri_id) {
        phacDoId = apptRows[0].phac_do_dieu_tri_id;
        // Cập nhật phác đồ
        await client.query(`
          UPDATE phac_do_dieu_tri 
          SET trang_thai = 'huy', tong_so_buoi = 1 
          WHERE id = $1
        `, [phacDoId]);

        const { rows: custDetails } = await client.query(`
          SELECT ho_ten FROM khach_hang WHERE id = $1
        `, [khach_hang_id]);
        if (custDetails.length > 0) {
          customerName = custDetails[0].ho_ten;
        }

        const { rows: docRows } = await client.query(`
          SELECT nhan_su_id FROM cuoc_hen WHERE id = $1
        `, [lich_dat_id]);
        if (docRows.length > 0) {
          doctorUserId = docRows[0].nhan_su_id;
        }
      } else if (!isExam) {
        // Tạo phác đồ lẻ 1 buổi (Chỉ tạo nếu không phải là cuộc hẹn khám)
        const { rows: pdRows } = await client.query(`
          INSERT INTO phac_do_dieu_tri (
            khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
          ) VALUES ($1, $2, 1, 0, 'dang_dieu_tri', NOW())
          RETURNING id
        `, [khach_hang_id, goi_dich_vu_id]);
        phacDoId = pdRows[0].id;
      }

      // Tạo hóa đơn
      let insertHoaDonQuery = '';
      let insertParams = [];
      if (isExam) {
        insertHoaDonQuery = `
          INSERT INTO hoa_don (khach_hang_id, cuoc_hen_id, tong_tien_phai_tra, so_tien_da_tra, trang_thai)
          VALUES ($1, $2, $3, 0, 'chua_thanh_toan') 
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra as tong_tien_thanh_toan
        `;
        insertParams = [khach_hang_id, lich_dat_id, don_gia];
      } else {
        insertHoaDonQuery = `
          INSERT INTO hoa_don (khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_phai_tra, so_tien_da_tra, trang_thai)
          VALUES ($1, $2, $3, $4, 0, 'chua_thanh_toan') 
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don, tong_tien_phai_tra as tong_tien_thanh_toan
        `;
        insertParams = [khach_hang_id, phacDoId, lich_dat_id, don_gia];
      }

      const { rows: hoaDonRows } = await client.query(insertHoaDonQuery, insertParams);

      let tenItem = 'Khám lâm sàng / Dịch vụ y tế';
      let soBuoiGoi = 1;
      if (goi_dich_vu_id) {
        const { rows: pkgRows } = await client.query('SELECT ten_goi, tong_so_buoi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
        if (pkgRows.length > 0) {
          tenItem = pkgRows[0].ten_goi;
          soBuoiGoi = pkgRows[0].tong_so_buoi || 1;
        }
      }

      await client.query('COMMIT');
      return { 
        hoa_don: {
          id: hoaDonRows[0].id,
          ma_hoa_don: hoaDonRows[0].ma_hoa_don,
          khach_hang_id,
          loai_hoa_don: 'dich_vu_don',
          tong_tien_truoc_giam: Number(don_gia),
          tong_tien_thanh_toan: Number(don_gia),
          so_tien_da_tra: 0,
          trang_thai: 'chua_thanh_toan',
          ten_item: tenItem,
          so_buoi_goi: soBuoiGoi,
          isNew: true
        }, 
        doctorUserId, 
        customerName 
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getInvoiceById(id: string) {
    const { rows } = await pool.query(`
      SELECT 
        hd.id,
        hd.khach_hang_id,
        hd.trang_thai,
        hd.tong_tien_phai_tra as tong_tien_thanh_toan, 
        hd.so_tien_da_tra as da_thanh_toan, 
        CASE WHEN hd.phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don, 
        hd.phac_do_dieu_tri_id,
        hd.phac_do_dieu_tri_id as lich_dieu_tri_id,
        hd.cuoc_hen_id,
        hd.tong_tien_goc,
        hd.ghi_chu,
        hd.hinh_thuc_thanh_toan_goi as loai_thanh_toan,
        hd.hinh_thuc_thanh_toan_goi,
        hd.ti_le_giam_gia_goi,
        hd.so_tien_giam_voucher,
        hd.ngay_tao,
        COALESCE(pd.tong_so_buoi, 1) as so_buoi_goi,
        ch.ngay_gio_bat_dau as ngay_kham,
        ch.ngay_gio_ket_thuc as ngay_kham_ket_thuc,
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
        END as chi_phi_kham
      FROM hoa_don hd
      LEFT JOIN phac_do_dieu_tri pd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN cuoc_hen ch ON hd.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      WHERE hd.id = $1
    `, [id]);
    return rows[0];
  }

  async getAppointmentWithServicePrice(id: string) {
    const { rows } = await pool.query(`
      SELECT
        ch.id,
        ch.goi_dich_vu_id,
        ch.khach_hang_id,
        ch.ngay_gio_bat_dau as ngay_kham,
        COALESCE(g.don_gia, 0) as don_gia
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE ch.id = $1
    `, [id]);
    return rows[0];
  }

  async processPayment(hoa_don_id: string, maGiaoDich: string, tong_tien: number, phuong_thuc: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE hoa_don 
        SET so_tien_da_tra = $1, trang_thai = 'da_thanh_toan', ngay_thanh_toan = NOW()
        WHERE id = $2
      `, [tong_tien, hoa_don_id]);

      await client.query(`
        INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich)
        VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW())
      `, [hoa_don_id, tong_tien, phuong_thuc, maGiaoDich]);

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
      SELECT *, don_gia as gia_goi, '[]'::json as chi_tiet_dich_vu
      FROM goi_dich_vu
      WHERE id = $1
    `, [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getActivePackages() {
    const { rows } = await pool.query(`
      SELECT id, ten_goi, muc_tieu as mo_ta, tong_so_buoi, don_gia, don_gia as gia_goi, don_gia as gia_goc,
             loai_goi, thoi_luong_phut, han_su_dung_mac_dinh_ngay,
             '[]'::json as chi_tiet_dich_vu
      FROM goi_dich_vu
      WHERE trang_thai = 'hoat_dong'
      ORDER BY ten_goi ASC
    `);
    return rows;
  }

  async getServiceById(id: string) {
    const { rows } = await pool.query('SELECT *, ten_goi as ten_dich_vu, don_gia as don_gia FROM goi_dich_vu WHERE id = $1', [id]);
    return rows[0];
  }

  async getActiveVouchers(khachHangId: string) {
    const { rows } = await pool.query(`
      SELECT v.id, v.ma_code as ma_voucher, v.loai_giam_gia as loai_giam, v.gia_tri_giam, v.giam_toi_da,
             v.don_hang_toi_thieu, v.so_luong_gioi_han as so_luong_toi_da, v.ngay_het_han, v.yeu_cau_thanh_toan
      FROM khuyen_mai_voucher v
      LEFT JOIN hoa_don hd ON hd.voucher_id = v.id AND hd.khach_hang_id = $1
      WHERE v.dang_kich_hoat = true
        AND v.ngay_bat_dau <= NOW()
        AND (v.ngay_het_han IS NULL OR v.ngay_het_han >= NOW())
      GROUP BY v.id
      HAVING v.so_luong_gioi_han IS NULL OR COUNT(hd.id) < v.so_luong_gioi_han
      ORDER BY v.ngay_bat_dau DESC
    `, [khachHangId]);
    return rows;
  }

  async getVoucherByCode(code: string) {
    const { rows } = await pool.query(`
      SELECT id, ma_code as ma_voucher, loai_giam_gia as loai_giam, gia_tri_giam, giam_toi_da,
             don_hang_toi_thieu, so_luong_gioi_han as so_luong_toi_da, ngay_bat_dau, ngay_het_han,
             dang_kich_hoat, yeu_cau_thanh_toan,
             CASE WHEN dang_kich_hoat = true THEN 'hoat_dong' ELSE 'vo_hieu' END as trang_thai
      FROM khuyen_mai_voucher
      WHERE ma_code = $1
    `, [code]);
    return rows[0];
  }

  // Đếm số lượt khach_hang_id NÀY đã dùng voucher này — giới hạn so_luong_gioi_han tính riêng
  // theo từng khách, không phải tổng toàn hệ thống.
  async countVoucherUsage(voucherId: string, khachHangId?: string) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1 AND khach_hang_id = $2',
      [voucherId, khachHangId || null]
    );
    return parseInt(rows[0].count || '0');
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
        so_buoi_goi,
        phi_kham_ap_dung,
        ho_ten_khach,
        so_dien_thoai,
        ghi_chu
      } = invoiceData;

      const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;

      let phacDoId = null;
      // item_type 'goi' KHÔNG đồng nghĩa "là 1 liệu trình nhiều buổi" — frontend route cả dịch vụ
      // lẻ (LE) qua item_type='goi' chỉ để dùng chung pipeline áp voucher (tab 'single' không hỗ
      // trợ voucher). Chỉ tạo phác đồ khi item thực sự là gói LIỆU_TRÌNH (cần theo dõi nhiều buổi
      // sau này) — dịch vụ lẻ tự đủ trong chính 1 lượt khám/trị liệu, không cần phác đồ.
      let shouldCreatePhacDo = false;
      if (item_type === 'goi' && item_id) {
        const { rows: goiRows } = await client.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [item_id]);
        shouldCreatePhacDo = goiRows[0]?.loai_goi === 'LIEU_TRINH';
      }

      // Khóa dòng cuộc hẹn để chặn 2 lượt tạo hóa đơn chạy song song cho cùng 1 lịch (race condition).
      let existingHoaDonId: string | null = null;
      let loaiLichDat = '';
      if (lich_dat_id) {
        const { rows: apptRows } = await client.query(`
          SELECT phac_do_dieu_tri_id, loai FROM cuoc_hen WHERE id = $1 FOR UPDATE
        `, [lich_dat_id]);
        if (apptRows.length > 0) {
          phacDoId = apptRows[0].phac_do_dieu_tri_id;
          loaiLichDat = (apptRows[0].loai || '').toUpperCase();
          // Buổi thuộc 1 liệu trình đang chạy (DIEU_TRI) luôn cần gắn/tạo phác đồ để theo dõi tiến
          // độ nhiều buổi — không tính dịch vụ lẻ (DICH_VU_LE, 1 lượt độc lập) hay khám (KHAM/KHAM_MOI).
          if (loaiLichDat === 'DIEU_TRI') {
            shouldCreatePhacDo = true;
          }
        }

        // Chặn hóa đơn "ma": nếu lễ tân bấm thanh toán, hóa đơn nháp được tạo nhưng bước ghi nhận
        // tiền bị ngắt giữa chừng (thoát trang, mất mạng...), hóa đơn đó treo mãi ở "chưa thanh
        // toán". Bấm thanh toán lại trước đây sẽ tạo thêm 1 hóa đơn MỚI thay vì dùng lại hóa đơn
        // cũ — tiền thu được ghi vào hóa đơn mới, hóa đơn cũ bị bỏ rơi khiến lịch hẹn vẫn hiện nợ
        // dù đã thu đủ tiền. Nay tái sử dụng đúng hóa đơn nháp cũ, cập nhật lại số liệu theo lựa
        // chọn mới nhất thay vì chèn thêm dòng.
        const { rows: existingRows } = await client.query(`
          SELECT id FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'chua_thanh_toan'
        `, [lich_dat_id]);
        if (existingRows.length > 0) {
          existingHoaDonId = existingRows[0].id;
        }
      }

      if (shouldCreatePhacDo && !phacDoId) {
        const finalGoiDichVuId = item_type === 'goi' ? item_id : (item_id || null);
        if (finalGoiDichVuId) {
          // Tạo phác đồ điều trị mới
          const { rows: pdRows } = await client.query(`
            INSERT INTO phac_do_dieu_tri (
              khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat
            ) VALUES ($1, $2, $3, 0, 'dang_dieu_tri', NOW())
            RETURNING id
          `, [
            khach_hang_id,
            finalGoiDichVuId,
            item_type === 'goi' ? (so_buoi_goi || 10) : 1
          ]);
          phacDoId = pdRows[0].id;

          // Đánh dấu đúng chỉ định (chi_dinh_buoi) của ca khám đã dẫn tới phác đồ này — nguồn xác
          // thực duy nhất để nối ngược phác đồ về ca khám gốc (lấy lại chẩn đoán/chống chỉ định)
          // và để biết chỉ định này đã kích hoạt hay chưa, KHÔNG dùng cuoc_hen.phac_do_dieu_tri_id
          // của ca khám (lý do xem giải thích ở dưới). Nếu lich_dat_id không phải ca khám có chỉ
          // định tương ứng thì đơn giản không khớp dòng nào, không ảnh hưởng gì.
          if (lich_dat_id) {
            await client.query(`
              UPDATE chi_dinh_buoi cd
              SET phac_do_dieu_tri_id = $1
              FROM nhat_ky_buoi_dieu_tri nk
              WHERE cd.nhat_ky_id = nk.id
                AND nk.cuoc_hen_id = $2
                AND cd.goi_dich_vu_id = $3
                AND cd.phac_do_dieu_tri_id IS NULL
            `, [phacDoId, lich_dat_id, finalGoiDichVuId]);
          }

          // Cập nhật cuộc hẹn gốc liên kết với phác đồ này — CHỈ khi cuộc hẹn đó tự nó là 1 buổi
          // điều trị/dịch vụ lẻ. Lễ tân thường đăng ký gói NGAY TỪ màn thanh toán của ca KHÁM (chỉ
          // định gói sau khám) — nếu gắn luôn phac_do_dieu_tri_id lên chính cuộc hẹn KHÁM đó, câu
          // JOIN tính "trạng thái thanh toán" ở appointment.repository.ts (getAllAppointments) sẽ
          // hiểu nhầm ca khám đó "thuộc phác đồ" và tra cứu nhầm sang hóa đơn GÓI (đang trả từng
          // buổi, còn nợ) thay vì hóa đơn khám riêng đã thanh toán — khiến ca khám bị báo "chưa
          // thanh toán" vĩnh viễn dù phí khám đã thu đủ, và mascot lễ tân/admin nhảy nhầm.
          if (lich_dat_id && loaiLichDat !== 'KHAM' && loaiLichDat !== 'KHAM_MOI') {
            await client.query('UPDATE cuoc_hen SET phac_do_dieu_tri_id = $1 WHERE id = $2', [phacDoId, lich_dat_id]);
          }
        }
      }

      // Calculate percentage discount dynamically based on actual discount amount
      const basePrice = Number(tong_tien_truoc_giam || tong_tien_thanh_toan || 0);
      const totalDiscount = Number(so_tien_giam_phuong_thuc || 0) + Number(so_tien_giam_voucher || 0);
      const tiLeGiam = calculateDiscountPercent(basePrice, totalDiscount, loai_thanh_toan);

      // Khóa hàng voucher + kiểm tra lại lượt dùng trong transaction để chặn 2 giao dịch cùng lúc
      // vượt hạn mức so_luong_gioi_han (check-then-act ở calculateBilling không đủ an toàn).
      if (voucher_id) {
        const { rows: lockRows } = await client.query(
          'SELECT so_luong_gioi_han FROM khuyen_mai_voucher WHERE id = $1 FOR UPDATE',
          [voucher_id]
        );
        // Loại trừ chính hóa đơn nháp đang được tái sử dụng khỏi lượt đếm — nếu không, thao tác
        // "cập nhật lại hóa đơn cũ" bên dưới sẽ bị tính nhầm thành 1 lượt dùng voucher MỚI và có
        // thể chặn nhầm khi mã đã gần hết hạn mức.
        const { rows: countRows } = await client.query(
          'SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1 AND khach_hang_id = $2 AND id IS DISTINCT FROM $3',
          [voucher_id, khach_hang_id, existingHoaDonId]
        );
        const soLuongToiDa = lockRows[0]?.so_luong_gioi_han;
        if (soLuongToiDa !== null && soLuongToiDa !== undefined && parseInt(countRows[0].count) >= soLuongToiDa) {
          throw new Error('Mã giảm giá đã hết lượt sử dụng');
        }
      }

      // Tạo hoặc cập nhật hoa_don — nếu đã có hóa đơn nháp "chưa thanh toán" cho đúng lịch hẹn này
      // (từ 1 lượt bấm thanh toán trước đó bị ngắt giữa chừng), cập nhật lại số liệu theo lựa chọn
      // mới nhất thay vì chèn thêm 1 dòng mới — tránh sinh hóa đơn "ma" không bao giờ được thanh toán.
      let hoa_don;
      if (existingHoaDonId) {
        const { rows: hdRows } = await client.query(`
          UPDATE hoa_don SET
            phac_do_dieu_tri_id = $1,
            tong_tien_goc = $2,
            hinh_thuc_thanh_toan_goi = $3,
            ti_le_giam_gia_goi = $4,
            so_tien_giam_voucher = $5,
            tong_tien_phai_tra = $6,
            voucher_id = $7,
            ghi_chu = $8,
            phi_kham_ap_dung = $9
          WHERE id = $10
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                    CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                    khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                    hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
                    tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
        `, [
          phacDoId,
          tong_tien_truoc_giam || tong_tien_thanh_toan,
          loai_thanh_toan || null,
          tiLeGiam,
          so_tien_giam_voucher || 0,
          tong_tien_thanh_toan,
          voucher_id || null,
          ghi_chu || null,
          Number(phi_kham_ap_dung || 0),
          existingHoaDonId
        ]);
        hoa_don = hdRows[0];
      } else {
        const { rows: hdRows } = await client.query(`
          INSERT INTO hoa_don (
            khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id,
            tong_tien_goc, hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
            tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ghi_chu, phi_kham_ap_dung
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'chua_thanh_toan', $9, $10, $11)
          RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                    CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                    khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                    hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
                    tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
        `, [
          khach_hang_id,
          phacDoId,
          lich_dat_id || null,
          tong_tien_truoc_giam || tong_tien_thanh_toan,
          loai_thanh_toan || null,
          tiLeGiam,
          so_tien_giam_voucher || 0,
          tong_tien_thanh_toan,
          voucher_id || null,
          ghi_chu || null,
          Number(phi_kham_ap_dung || 0)
        ]);
        hoa_don = hdRows[0];
      }

      await client.query('COMMIT');
      return {
        ...hoa_don,
        tong_tien_thanh_toan: hoa_don.tong_tien_phai_tra
      };
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
    chi_tiet?: PaymentTransactionDetail
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE hoa_don
        SET so_tien_da_tra = $1, trang_thai = $2
        WHERE id = $3
      `, [da_thanh_toan_moi, trang_thai_moi, hoa_don_id]);

      await client.query(`
        INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
        VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW(), $5)
      `, [hoa_don_id, so_tien_nhan, phuong_thuc, maGiaoDich, chi_tiet ? JSON.stringify(chi_tiet) : null]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateTreatmentPlanStatus(id: string, trang_thai: string) {
    if (trang_thai === 'dang_dieu_tri') {
      await pool.query('UPDATE phac_do_dieu_tri SET trang_thai = $1, ngay_kich_hoat = NOW() WHERE id = $2', [trang_thai, id]);
    } else {
      await pool.query('UPDATE phac_do_dieu_tri SET trang_thai = $1 WHERE id = $2', [trang_thai, id]);
    }
  }

  async getTreatmentPlanById(id: string) {
    const { rows } = await pool.query('SELECT * FROM phac_do_dieu_tri WHERE id = $1', [id]);
    return rows[0];
  }

  async createInvoiceForTreatmentPlan(invoiceData: any) {
    const {
      lich_dieu_tri_id,
      khach_hang_id,
      item_type,
      tong_tien_thanh_toan,
      voucher_id,
      tong_tien_truoc_giam,
      so_tien_giam_voucher,
      so_tien_giam_phuong_thuc,
      loai_thanh_toan,
      cuoc_hen_id,
      phi_kham_ap_dung,
      ghi_chu
    } = invoiceData;

    // Calculate percentage discount dynamically based on actual discount amount
    const basePrice = Number(tong_tien_truoc_giam || tong_tien_thanh_toan || 0);
    const totalDiscount = Number(so_tien_giam_phuong_thuc || 0) + Number(so_tien_giam_voucher || 0);
    const tiLeGiam = calculateDiscountPercent(basePrice, totalDiscount, loai_thanh_toan);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Khóa hàng voucher + kiểm tra lại lượt dùng trong transaction để chặn 2 giao dịch cùng lúc
      // vượt hạn mức so_luong_gioi_han (check-then-act ở calculateBilling không đủ an toàn).
      if (voucher_id) {
        const { rows: lockRows } = await client.query(
          'SELECT so_luong_gioi_han FROM khuyen_mai_voucher WHERE id = $1 FOR UPDATE',
          [voucher_id]
        );
        const { rows: countRows } = await client.query(
          'SELECT COUNT(*) FROM hoa_don WHERE voucher_id = $1 AND khach_hang_id = $2',
          [voucher_id, khach_hang_id]
        );
        const soLuongToiDa = lockRows[0]?.so_luong_gioi_han;
        if (soLuongToiDa !== null && soLuongToiDa !== undefined && parseInt(countRows[0].count) >= soLuongToiDa) {
          throw new Error('Mã giảm giá đã hết lượt sử dụng');
        }
      }

      const { rows } = await client.query(`
        INSERT INTO hoa_don (
          khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id,
          tong_tien_goc, hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
          tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ghi_chu, phi_kham_ap_dung
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'chua_thanh_toan', $9, $10, $11)
        RETURNING id, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don,
                  CASE WHEN phac_do_dieu_tri_id IS NOT NULL THEN 'goi_dich_vu' ELSE 'dich_vu_don' END as loai_hoa_don,
                  khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc,
                  hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, so_tien_giam_voucher,
                  tong_tien_phai_tra, so_tien_da_tra, trang_thai, voucher_id, ngay_tao, ghi_chu
      `, [
        khach_hang_id,
        lich_dieu_tri_id,
        cuoc_hen_id || null,
        tong_tien_truoc_giam || tong_tien_thanh_toan,
        loai_thanh_toan || null,
        tiLeGiam,
        so_tien_giam_voucher || 0,
        tong_tien_thanh_toan,
        voucher_id || null,
        ghi_chu || null,
        Number(phi_kham_ap_dung || 0)
      ]);

      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async searchCustomers(queryText: string) {
    const { rows } = await pool.query(`
      SELECT id, ho_ten, so_dien_thoai, email, gioi_tinh, ngay_sinh, diem_uy_tin
      FROM khach_hang
      WHERE (unaccent(ho_ten) ILIKE unaccent($1) OR so_dien_thoai ILIKE $1) AND trang_thai = 'hoat_dong'
      LIMIT 20
    `, [`%${queryText}%`]);
    return rows;
  }

  async getCustomerTreatmentPlans(customerId: string) {
    // so_buoi_da_dung: đếm hoan_thanh luôn; đếm thêm khong_den chỉ khi gói Nhóm B
    // (tra_thang/tra_gop — đã trả trước nên buổi không đến vẫn bị tính tiêu thụ) — khớp
    // công thức ở updateCompletedSessionsCount (appointment.repository.ts).
    const { rows } = await pool.query(`
      SELECT pd.id::text, pd.goi_dich_vu_id, pd.tong_so_buoi,
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
             pd.trang_thai,
             gdv.ten_goi as ten_goi_dich_vu, gdv.thoi_luong_phut,
             NULL::uuid as cuoc_hen_id, gdv.loai_goi,
             hd.id as hoa_don_id,
             hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra,
             hd.tong_tien_goc, hd.ti_le_giam_gia_goi, hd.so_tien_giam_voucher,
             hd.trang_thai as hoa_don_trang_thai,
             (
               SELECT jsonb_build_object(
                 'so_thu_tu_buoi', ch_active.so_thu_tu_buoi,
                 'ngay_gio_bat_dau', ch_active.ngay_gio_bat_dau,
                 'trang_thai', ch_active.trang_thai
               )
               FROM cuoc_hen ch_active
               WHERE ch_active.phac_do_dieu_tri_id = pd.id
                 AND ch_active.trang_thai IN ('chua_xac_nhan', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham')
               LIMIT 1
             ) as lich_dang_hoat_dong
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1
        AND (
          SELECT COUNT(*)::int
          FROM cuoc_hen
          WHERE phac_do_dieu_tri_id = pd.id
            AND (
              trang_thai = 'hoan_thanh'
              OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND hd.hinh_thuc_thanh_toan_goi IN ('tra_thang', 'tra_gop'))
            )
            AND loai = 'DIEU_TRI'
        ) < pd.tong_so_buoi
        AND pd.trang_thai = 'dang_dieu_tri'
        -- Gói đã hoàn tiền không được đưa ra form đặt lịch, kể cả khi trạng thái phác đồ
        -- chưa kịp đồng bộ (dữ liệu cũ từng bị set nhầm thành 'da_tam_dung').
        AND (hd.trang_thai IS NULL OR hd.trang_thai <> 'da_hoan_tien')
    `, [customerId]);

    // Chỉ định liệu trình từ ca khám nhưng khách chưa thanh toán/kích hoạt, còn trong hạn — hiện
    // ngay ở đây để lễ tân thấy khi khách quay lại đặt lịch, không cần quay về hồ sơ khách hàng
    // mới biết có chỉ định đang chờ (map sang trang_thai='khuyen_nghi', đúng shape mà form đặt
    // lịch tại quầy đã có sẵn logic xử lý — xem isPlanBookable/handleSelectPlan ở
    // WalkInBookingModal.tsx).
    const { rows: pendingRecs } = await pool.query(`
      SELECT
        cd.id::text,
        cd.goi_dich_vu_id,
        COALESCE(cd.tong_so_buoi_tu_van, gdv.tong_so_buoi) as tong_so_buoi,
        0::int as so_buoi_da_dung,
        'khuyen_nghi' as trang_thai,
        gdv.ten_goi as ten_goi_dich_vu,
        gdv.thoi_luong_phut,
        ch.id as cuoc_hen_id,
        gdv.loai_goi,
        NULL::uuid as hoa_don_id,
        NULL::varchar as hinh_thuc_thanh_toan_goi,
        NULL::bigint as tong_tien_phai_tra,
        NULL::bigint as so_tien_da_tra,
        NULL::bigint as tong_tien_goc,
        NULL::numeric as ti_le_giam_gia_goi,
        NULL::bigint as so_tien_giam_voucher,
        NULL::varchar as hoa_don_trang_thai,
        NULL::jsonb as lich_dang_hoat_dong
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu gdv ON cd.goi_dich_vu_id = gdv.id
      WHERE ch.khach_hang_id = $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND gdv.loai_goi = 'LIEU_TRINH'
        AND ch.ngay_gio_bat_dau >= NOW() - $2 * INTERVAL '1 day'
      ORDER BY ch.ngay_gio_bat_dau DESC
    `, [customerId, PACKAGE_ACTIVATION_WINDOW_DAYS]);

    return [...rows, ...pendingRecs];
  }

  async getTreatmentPlanBySessionId(sessionId: string) {
    const { rows } = await pool.query('SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [sessionId]);
    return rows[0] ? rows[0].phac_do_dieu_tri_id : null;
  }

  async getAppointmentBillingInfo(id: string) {
    const { rows } = await pool.query(`
      SELECT 
        ch.id, 
        (
          SELECT hd.ngay_tao 
          FROM hoa_don hd 
          WHERE hd.cuoc_hen_id = ch.id AND hd.trang_thai = 'da_thanh_toan' 
          LIMIT 1
        ) as ngay_thanh_toan_kham,
        (
          SELECT hd.tong_tien_phai_tra 
          FROM hoa_don hd 
          WHERE hd.cuoc_hen_id = ch.id AND hd.trang_thai = 'da_thanh_toan' 
          LIMIT 1
        ) as so_tien_da_thanh_toan_kham,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, 
        ch.ngay_gio_ket_thuc, 
        ch.trang_thai,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        ch.goi_dich_vu_id,
        CASE 
          WHEN UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI') THEN 'kham_moi'
          WHEN UPPER(ch.loai) IN ('DIEU_TRI') THEN 'dieu_tri'
          ELSE 'dich_vu_don'
        END as loai_lich,
        kh.id as khach_hang_id,
        kh.ho_ten as ten_khach_hang, 
        kh.so_dien_thoai as sdt_khach_hang,
        dv.ten_goi as ten_dich_vu,
        dv.don_gia as don_gia_dich_vu,
        COALESCE(
          (
            SELECT cdb.goi_dich_vu_id 
            FROM nhat_ky_buoi_dieu_tri nk
            JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
            JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
            WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi IN ('LIEU_TRINH', 'LE')
            LIMIT 1
          ),
          ch.phac_do_dieu_tri_id
        ) as khuyen_nghi_goi_id,
        (
          SELECT recommended_g.loai_goi
          FROM nhat_ky_buoi_dieu_tri nk
          JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
          JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
          WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi IN ('LIEU_TRINH', 'LE')
          LIMIT 1
        ) as khuyen_nghi_loai_goi,
        (
          SELECT recommended_g.ten_goi
          FROM nhat_ky_buoi_dieu_tri nk
          JOIN chi_dinh_buoi cdb ON cdb.nhat_ky_id = nk.id
          JOIN goi_dich_vu recommended_g ON cdb.goi_dich_vu_id = recommended_g.id
          WHERE nk.cuoc_hen_id = ch.id AND recommended_g.loai_goi IN ('LIEU_TRINH', 'LE')
          LIMIT 1
        ) as khuyen_nghi_ten_goi,
        pd.goi_dich_vu_id as pd_goi_dich_vu_id,
        pd.tong_so_buoi as pd_tong_so_buoi,
        pd.trang_thai as pd_trang_thai,
        gpd.ten_goi as pd_ten_goi,
        gpd.don_gia_theo_buoi as pd_don_gia_theo_buoi,
        hd_goi.id as hoa_don_goi_id,
        'HD-' || UPPER(SUBSTRING(hd_goi.id::text FROM 1 FOR 6)) as hoa_don_goi_ma,
        hd_goi.trang_thai as trang_thai_hoa_don_goi,
        hd_goi.so_tien_da_tra as so_tien_da_tra_goi,
        hd_goi.tong_tien_phai_tra as tong_tien_phai_tra_goi,
        hd_goi.hinh_thuc_thanh_toan_goi as hinh_thuc_thanh_toan_goi
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN hoa_don hd_goi ON pd.id = hd_goi.phac_do_dieu_tri_id
      WHERE ch.id = $1
    `, [id]);
    return rows[0];
  }

  async getBillingInfoByPackage(customerId: string, packageId: string) {
    // 1. Get customer info
    const { rows: custRows } = await pool.query(`
      SELECT id as khach_hang_id, ho_ten as ten_khach_hang, so_dien_thoai as sdt_khach_hang
      FROM khach_hang WHERE id = $1
    `, [customerId]);
    if (custRows.length === 0) return null;

    const customer = custRows[0];

    // 2. Get package info
    const { rows: pkgRows } = await pool.query(`
      SELECT id, ten_goi, loai_goi FROM goi_dich_vu WHERE id = $1
    `, [packageId]);
    if (pkgRows.length === 0) return null;

    const pkg = pkgRows[0];

    // 3. Check for any paid clinical exam invoice for this customer
    const { rows: examRows } = await pool.query(`
      SELECT hd.ngay_tao as ngay_thanh_toan_kham, hd.tong_tien_phai_tra as so_tien_da_thanh_toan_kham
      FROM hoa_don hd
      WHERE hd.khach_hang_id = $1 
        AND hd.trang_thai = 'da_thanh_toan' 
        AND hd.cuoc_hen_id IS NOT NULL 
        AND hd.cuoc_hen_id IN (SELECT id FROM cuoc_hen WHERE loai IN ('KHAM', 'KHAM_MOI'))
      ORDER BY hd.ngay_tao DESC LIMIT 1
    `, [customerId]);

    const examInfo = examRows[0] || {};

    // 4. Check if there is an existing phac_do_dieu_tri for this customer and package
    const { rows: pdRows } = await pool.query(`
      SELECT pd.id as phac_do_dieu_tri_id, pd.tong_so_buoi as pd_tong_so_buoi, pd.trang_thai as pd_trang_thai,
             hd.id as hoa_don_goi_id, hd.so_tien_da_tra as so_tien_da_tra_goi, hd.tong_tien_phai_tra as tong_tien_phai_tra_goi,
             hd.hinh_thuc_thanh_toan_goi
      FROM phac_do_dieu_tri pd
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1 AND pd.goi_dich_vu_id = $2
      ORDER BY pd.ngay_kich_hoat DESC LIMIT 1
    `, [customerId, packageId]);

    const pdInfo = pdRows[0] || {};

    // Buổi cần đối chiếu số tiền đã đóng — phác đồ đã kích hoạt có thể đã xong vài buổi (vd đây là
    // luồng "Thanh toán" khi bị chặn đặt buổi N tiếp theo), không phải luôn luôn là buổi 1. Đếm
    // đúng công thức so_buoi_da_dung dùng chung ở getCustomerTreatmentPlans để không lệch buổi.
    //
    // QUAN TRỌNG: dùng ĐÚNG so_buoi_da_dung (buổi đã hoàn thành gần nhất), KHÔNG cộng thêm 1.
    // getTungBuoiSessionDue(packageTotal, totalSessions, sessionNum, alreadyPaid) tính
    // cumulativeRequired = sessionNum * sessionPrice — sessionNum ở ĐÂY nghĩa là "số buổi cần được
    // phủ tiền tính tới thời điểm này", khác với sessionNum trong getMinPaymentRequired (dùng để
    // kiểm tra ĐIỀU KIỆN ĐẶT buổi tiếp theo, nội bộ trừ đi 1 buổi). Cộng nhầm +1 ở đây từng khiến
    // hệ thống đòi dư nguyên 1 buổi (vd đúng ra thiếu buổi 2 = 350k thì lại đòi thành 700k) và ghi
    // sai tên buổi trên hóa đơn tạm tính.
    let soThuTuBuoi = 1;
    if (pdInfo.phac_do_dieu_tri_id) {
      const { rows: countRows } = await pool.query(`
        SELECT COUNT(*)::int as so_buoi_da_dung
        FROM cuoc_hen
        WHERE phac_do_dieu_tri_id = $1
          AND (
            trang_thai = 'hoan_thanh'
            OR (trang_thai IN ('khong_den', 'khach_khong_den', 'khach_khong_den_phat') AND $2 IN ('tra_thang', 'tra_gop'))
          )
          AND loai = 'DIEU_TRI'
      `, [pdInfo.phac_do_dieu_tri_id, pdInfo.hinh_thuc_thanh_toan_goi]);
      soThuTuBuoi = countRows[0]?.so_buoi_da_dung || 1;
    }

    return {
      id: null,
      ngay_thanh_toan_kham: examInfo.ngay_thanh_toan_kham || null,
      so_tien_da_thanh_toan_kham: examInfo.so_tien_da_thanh_toan_kham ? Number(examInfo.so_tien_da_thanh_toan_kham) : 0,
      ma_lich_dat: null,
      ngay_gio_bat_dau: null,
      ngay_gio_ket_thuc: null,
      trang_thai: null,
      phac_do_dieu_tri_id: pdInfo.phac_do_dieu_tri_id || null,
      so_thu_tu_buoi: soThuTuBuoi,
      goi_dich_vu_id: null,
      loai_lich: 'dieu_tri',
      khach_hang_id: customer.khach_hang_id,
      ten_khach_hang: customer.ten_khach_hang,
      sdt_khach_hang: customer.sdt_khach_hang,
      ten_dich_vu: null,
      don_gia_dich_vu: 0,
      khuyen_nghi_goi_id: pkg.id,
      khuyen_nghi_loai_goi: pkg.loai_goi,
      khuyen_nghi_ten_goi: pkg.ten_goi,
      pd_goi_dich_vu_id: pkg.id,
      pd_tong_so_buoi: pdInfo.pd_tong_so_buoi || null,
      pd_trang_thai: pdInfo.pd_trang_thai || null,
      pd_ten_goi: pkg.ten_goi,
      pd_don_gia_theo_buoi: null,
      hoa_don_goi_id: pdInfo.hoa_don_goi_id || null,
      hoa_don_goi_ma: pdInfo.hoa_don_goi_id ? `HD-${pdInfo.hoa_don_goi_id.substring(0,6).toUpperCase()}` : null,
      trang_thai_hoa_don_goi: pdInfo.hoa_don_goi_id ? 'chua_thanh_toan' : null,
      so_tien_da_tra_goi: pdInfo.so_tien_da_tra_goi ? Number(pdInfo.so_tien_da_tra_goi) : 0,
      tong_tien_phai_tra_goi: pdInfo.tong_tien_phai_tra_goi ? Number(pdInfo.tong_tien_phai_tra_goi) : 0,
      hinh_thuc_thanh_toan_goi: pdInfo.hinh_thuc_thanh_toan_goi || null
    };
  }

  async getPaidInvoiceAmountForAppointment(lich_dat_id: string): Promise<number> {
    const { rows } = await pool.query(
      "SELECT tong_tien_phai_tra FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'da_thanh_toan' LIMIT 1",
      [lich_dat_id]
    );
    return rows[0] ? Number(rows[0].tong_tien_phai_tra) : 0;
  }

  /**
   * Dò ngược ca khám gốc đã chỉ định (chi_dinh_buoi) đúng gói dịch vụ lẻ (LE) đang thanh toán,
   * chỉ trả về khi: ca khám đó đã có hóa đơn thanh toán riêng, VÀ buổi lẻ đang thanh toán (le_lich_dat_id)
   * là buổi ĐẦU TIÊN của gói này (cùng khách) được thanh toán kể từ sau ca khám đó — tránh trừ phí khám
   * lặp lại nếu khách mua lại đúng gói LE này nhiều lần sau cùng 1 ca khám.
   */
  async getPrescribingExamForLeSession(goiDichVuId: string, leLichDatId: string) {
    const { rows } = await pool.query(`
      SELECT ch_kham.id, ch_kham.ngay_gio_bat_dau
      FROM cuoc_hen ch_le
      JOIN chi_dinh_buoi cdb ON cdb.goi_dich_vu_id = $1
      JOIN nhat_ky_buoi_dieu_tri nk ON cdb.nhat_ky_id = nk.id
      JOIN cuoc_hen ch_kham ON nk.cuoc_hen_id = ch_kham.id AND ch_kham.loai IN ('KHAM', 'KHAM_MOI')
      JOIN hoa_don hd_kham ON hd_kham.cuoc_hen_id = ch_kham.id AND hd_kham.trang_thai = 'da_thanh_toan'
      WHERE ch_le.id = $2
        AND ch_kham.khach_hang_id = ch_le.khach_hang_id
        AND NOT EXISTS (
          SELECT 1 FROM cuoc_hen ch_other
          JOIN hoa_don hd_other ON hd_other.cuoc_hen_id = ch_other.id AND hd_other.trang_thai = 'da_thanh_toan'
          WHERE ch_other.khach_hang_id = ch_kham.khach_hang_id
            AND ch_other.goi_dich_vu_id = $1
            AND ch_other.loai = 'DIEU_TRI'
            AND ch_other.id != ch_le.id
            AND hd_other.ngay_tao > hd_kham.ngay_tao
        )
      ORDER BY ch_kham.ngay_gio_bat_dau DESC
      LIMIT 1
    `, [goiDichVuId, leLichDatId]);
    return rows[0] || null;
  }

  /**
   * Cấu hình gói mà bác sĩ đã tư vấn cho khách tại ca khám `cuocHenId` (snapshot lưu trong
   * chi_dinh_buoi), đặt cạnh cấu hình gói ĐANG SỐNG để phát hiện admin sửa gói giữa chừng.
   * Trả null nếu ca khám đó không chỉ định đúng gói này, hoặc chỉ định cũ chưa có snapshot.
   */
  async getPrescriptionQuote(cuocHenId: string, goiDichVuId: string) {
    const { rows } = await pool.query(`
      SELECT
        cdb.tong_so_buoi_tu_van,
        cdb.don_gia_tu_van,
        g.tong_so_buoi AS tong_so_buoi_hien_tai,
        g.don_gia      AS don_gia_hien_tai
      FROM chi_dinh_buoi cdb
      JOIN nhat_ky_buoi_dieu_tri nk ON cdb.nhat_ky_id = nk.id
      JOIN goi_dich_vu g ON g.id = cdb.goi_dich_vu_id
      WHERE nk.cuoc_hen_id = $1
        AND cdb.goi_dich_vu_id = $2
        AND cdb.tong_so_buoi_tu_van IS NOT NULL
        AND cdb.don_gia_tu_van IS NOT NULL
      LIMIT 1
    `, [cuocHenId, goiDichVuId]);

    const row = rows[0];
    if (!row) return null;

    return {
      tong_so_buoi_tu_van: Number(row.tong_so_buoi_tu_van),
      don_gia_tu_van: Number(row.don_gia_tu_van),
      tong_so_buoi_hien_tai: Number(row.tong_so_buoi_hien_tai),
      don_gia_hien_tai: Number(row.don_gia_hien_tai),
    };
  }

  async getInvoiceByUuidPrefix(prefix: string) {
    const { rows } = await pool.query(
      "SELECT id, tong_tien_phai_tra, trang_thai FROM hoa_don WHERE id::text LIKE $1 AND trang_thai IN ('chua_thanh_toan', 'dang_tra_gop') LIMIT 1",
      [`${prefix}%`]
    );
    return rows[0] || null;
  }
}

export default new ReceptionistRepository();
