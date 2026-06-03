import { pool } from '../config/db';

class DoctorRepository {
  // 1. Lấy danh sách bệnh nhân đang xếp hàng chờ khám hôm nay
  async getDoctorQueue(doctorId: string) {
    const queryStr = `
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ho_ten_khach, ld.so_dien_thoai, ld.gioi_tinh_khach,
        ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.ly_do_kham, ld.trang_thai, ld.anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        nd.ho_ten as ten_khach_hang, nd.so_dien_thoai as sdt_khach_hang, nd.avatar_url
      FROM lich_dat ld
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      WHERE ld.bac_si_id = $1 
        AND ld.trang_thai IN ('cho_kham', 'dang_kham')
        AND ld.ngay_gio_bat_dau::date = CURRENT_DATE
      ORDER BY ld.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, [doctorId]);
    return rows;
  }

  // 2. Lấy danh sách lịch hẹn khám của bác sĩ (cho phép filter theo khoảng thời gian)
  async getDoctorAppointments(doctorId: string, startDate?: string, endDate?: string) {
    const queryStr = `
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.trang_thai, ld.ly_do_kham,
        COALESCE(nd.ho_ten, ld.ho_ten_khach) as ten_khach_hang,
        COALESCE(nd.so_dien_thoai, ld.so_dien_thoai) as so_dien_thoai,
        hsba.id as ho_so_benh_an_id, hsba.chan_doan, hsba.chong_chi_dinh
      FROM lich_dat ld
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      LEFT JOIN ho_so_benh_an hsba ON hsba.lich_dat_id = ld.id
      WHERE ld.bac_si_id = $1
        AND ($2::timestamp IS NULL OR ld.ngay_gio_bat_dau >= $2::timestamp)
        AND ($3::timestamp IS NULL OR ld.ngay_gio_bat_dau <= $3::timestamp)
      ORDER BY ld.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [doctorId, startDate || null, endDate || null]);
    return rows;
  }

  // 3. Lấy lịch sử bệnh án lâm sàng của bệnh nhân (các lần chẩn đoán trước của Bác sĩ)
  async getPatientHistory(patientId: string) {
    const queryStr = `
      SELECT 
        hsba.id, hsba.chan_doan, hsba.chong_chi_dinh, hsba.ghi_chu, hsba.thoi_gian_tao,
        ld.id as lich_dat_id, ld.ma_lich_dat,
        nd_bs.ho_ten as ten_bac_si,
        dv.ten_dich_vu as khuyen_nghi_dich_vu,
        goi.ten_goi as khuyen_nghi_goi
      FROM ho_so_benh_an hsba
      JOIN lich_dat ld ON hsba.lich_dat_id = ld.id
      LEFT JOIN chuyen_gia_y_te bs ON hsba.bac_si_id = bs.id
      LEFT JOIN nguoi_dung nd_bs ON bs.nguoi_dung_id = nd_bs.id
      LEFT JOIN dich_vu dv ON hsba.dich_vu_id = dv.id
      LEFT JOIN goi_dich_vu goi ON hsba.goi_dich_vu_id = goi.id
      WHERE ld.khach_hang_id = $1
      ORDER BY hsba.thoi_gian_tao DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 4. Lấy danh sách lịch điều trị của bệnh nhân (tiến trình gói/lẻ thực tế)
  async getPatientTreatments(patientId: string) {
    const queryStr = `
      SELECT 
        ldt.id, ldt.loai_dieu_tri, ldt.tong_so_buoi, ldt.so_buoi_da_dung, ldt.trang_thai, ldt.thoi_gian_tao, ldt.ma_lich_dieu_tri,
        dv.ten_dich_vu, goi.ten_goi,
        hsba.chan_doan
      FROM lich_dieu_tri ldt
      LEFT JOIN dich_vu dv ON ldt.dich_vu_id = dv.id
      LEFT JOIN goi_dich_vu goi ON ldt.goi_dich_vu_id = goi.id
      LEFT JOIN ho_so_benh_an hsba ON ldt.ho_so_benh_an_id = hsba.id
      WHERE ldt.khach_hang_id = $1
      ORDER BY ldt.thoi_gian_tao DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 5. Lấy danh sách chi tiết các buổi trị liệu của 1 lịch điều trị cụ thể
  async getTreatmentSessions(treatmentPlanId: string) {
    const queryStr = `
      SELECT 
        btl.id, btl.so_thu_tu_buoi, btl.trang_thai, btl.thoi_gian_bat_dau, btl.thoi_gian_ket_thuc,
        btl.danh_gia_truoc_buoi, btl.danh_gia_sau_buoi, btl.danh_gia_hieu_qua, btl.canh_bao_dac_biet, btl.ai_tom_tat_ngan,
        nd_ktv.ho_ten as ten_ky_thuat_vien
      FROM buoi_tri_lieu btl
      LEFT JOIN chuyen_gia_y_te ktv ON btl.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      WHERE btl.lich_dieu_tri_id = $1
      ORDER BY btl.so_thu_tu_buoi ASC;
    `;
    const { rows } = await pool.query(queryStr, [treatmentPlanId]);
    return rows;
  }

  // 6. Ghi nhận bệnh án lâm sàng & Hoàn thành lịch khám (Chạy trong transaction)
  async saveClinicalAssessment(data: {
    lich_dat_id: string;
    bac_si_id: string;
    chan_doan: string;
    chong_chi_dinh: string;
    goi_dich_vu_id?: string | null;
    dich_vu_id?: string | null;
    ghi_chu?: string | null;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Tạo/cập nhật hồ sơ bệnh án (UPSERT)
      const hsbaQuery = `
        INSERT INTO ho_so_benh_an (lich_dat_id, bac_si_id, chan_doan, chong_chi_dinh, goi_dich_vu_id, dich_vu_id, ghi_chu)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (lich_dat_id) 
        DO UPDATE SET 
          bac_si_id = EXCLUDED.bac_si_id,
          chan_doan = EXCLUDED.chan_doan,
          chong_chi_dinh = EXCLUDED.chong_chi_dinh,
          goi_dich_vu_id = EXCLUDED.goi_dich_vu_id,
          dich_vu_id = EXCLUDED.dich_vu_id,
          ghi_chu = EXCLUDED.ghi_chu,
          thoi_gian_tao = NOW()
        RETURNING id;
      `;
      const hsbaRes = await client.query(hsbaQuery, [
        data.lich_dat_id,
        data.bac_si_id,
        data.chan_doan,
        data.chong_chi_dinh,
        data.goi_dich_vu_id || null,
        data.dich_vu_id || null,
        data.ghi_chu || null,
      ]);
      const medicalRecordId = hsbaRes.rows[0].id;

      // 2. Cập nhật trạng thái lịch đặt khám sang 'hoan_thanh'
      const updateLdQuery = `
        UPDATE lich_dat 
        SET trang_thai = 'hoan_thanh'
        WHERE id = $1;
      `;
      await client.query(updateLdQuery, [data.lich_dat_id]);

      await client.query('COMMIT');
      return { success: true, medicalRecordId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 7. Lấy chi tiết 1 ca khám theo ID (để hiển thị thông tin khi khám)
  async getAppointmentDetail(appointmentId: string) {
    const queryStr = `
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ho_ten_khach, ld.so_dien_thoai, ld.gioi_tinh_khach,
        ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.ly_do_kham, ld.trang_thai, ld.anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        nd.ho_ten as ten_khach_hang, nd.so_dien_thoai as sdt_khach_hang, nd.avatar_url,
        hsba.id as ho_so_benh_an_id, hsba.chan_doan, hsba.chong_chi_dinh, hsba.ghi_chu,
        hsba.goi_dich_vu_id, hsba.dich_vu_id
      FROM lich_dat ld
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      LEFT JOIN ho_so_benh_an hsba ON hsba.lich_dat_id = ld.id
      WHERE ld.id = $1;
    `;
    const { rows } = await pool.query(queryStr, [appointmentId]);
    return rows[0] || null;
  }

  // 8. Lấy lịch làm việc của bác sĩ (nguoi_dung_id)
  async getDoctorSchedules(userId: string) {
    const queryStr = `
      SELECT 
        id, nguoi_dung_id, ngay::text as ngay, gio_bat_dau, gio_ket_thuc, trang_thai
      FROM lich_lam_viec
      WHERE nguoi_dung_id = $1
      ORDER BY ngay ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }
}

export default new DoctorRepository();
