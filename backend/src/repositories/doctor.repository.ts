import { pool } from '../config/db';
import { PACKAGE_ACTIVATION_WINDOW_DAYS } from '../domain/billing';

class DoctorRepository {
  async isPackageLieuTrinh(goi_dich_vu_id: string) {
    const { rows } = await pool.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
    return rows.length > 0 && rows[0].loai_goi === 'LIEU_TRINH';
  }

  // Chặn chỉ định liệu trình mới khi khách đang có 1 liệu trình LIỆU_TRÌNH đang chạy, HOẶC còn 1
  // chỉ định liệu trình từ ca khám trước chưa thanh toán/kích hoạt và còn trong hạn kích hoạt
  // (PACKAGE_ACTIVATION_WINDOW_DAYS) — 1 khách chỉ được dùng tối đa 1 liệu trình tại 1 thời điểm.
  // cuoc_hen_id: ca khám đang lưu chỉ định — dùng để tự xác định khách hàng, đồng thời loại trừ
  // chính nó khỏi kiểm tra "còn chỉ định cũ chưa kích hoạt" (tránh tự chặn khi bác sĩ sửa lại
  // chỉ định của cùng 1 ca khám vừa nhập).
  async getBlockingLieuTrinh(cuoc_hen_id: string) {
    const { rows: activeRows } = await pool.query(`
      SELECT pd.id, g.ten_goi
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      WHERE pd.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND pd.trang_thai = 'dang_dieu_tri' AND g.loai_goi = 'LIEU_TRINH'
      LIMIT 1
    `, [cuoc_hen_id]);
    if (activeRows.length > 0) {
      return { blocked: true, reason: `Khách hàng đang có liệu trình "${activeRows[0].ten_goi}" hoạt động. Chỉ có thể chỉ định liệu trình mới sau khi liệu trình này hoàn thành hoặc bị hủy.` };
    }

    const { rows: pendingRows } = await pool.query(`
      SELECT g.ten_goi
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      WHERE ch.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND ch.id != $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND g.loai_goi = 'LIEU_TRINH'
        AND ch.ngay_gio_bat_dau >= NOW() - $2 * INTERVAL '1 day'
      ORDER BY ch.ngay_gio_bat_dau DESC
      LIMIT 1
    `, [cuoc_hen_id, PACKAGE_ACTIVATION_WINDOW_DAYS]);
    if (pendingRows.length > 0) {
      return { blocked: true, reason: `Khách hàng đã được chỉ định liệu trình "${pendingRows[0].ten_goi}" từ ca khám trước, còn trong hạn kích hoạt và chưa thanh toán. Chỉ có thể chỉ định liệu trình khác sau khi chỉ định này hết hạn.` };
    }

    return { blocked: false };
  }
  // 1. Lấy danh sách bệnh nhân đang xếp hàng chờ khám hôm nay
  async getDoctorQueue(userId: string, roleId: number = 4) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
          AND lt.gio_ket_thuc >= (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
        LIMIT 1
      ) shift_room ON TRUE
      WHERE ch.nhan_su_id = $1::integer 
        AND ${loaiCondition}
        AND ch.trang_thai IN ('cho_kham', 'dang_kham', 'check_in', 'cho_xac_nhan', 'da_xac_nhan', 'da_checkin')
        AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      ORDER BY ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 2. Lấy danh sách lịch hẹn khám của bác sĩ (cho phép filter theo khoảng thời gian)
  async getDoctorAppointments(userId: string, roleId: number = 4, startDate?: string, endDate?: string) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, 
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu_khach_hang as ly_do_kham,
        ch.anh_dinh_kem_url,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
          AND lt.gio_ket_thuc >= (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
        LIMIT 1
      ) shift_room ON TRUE
      WHERE ch.nhan_su_id = $1::integer
        AND ${loaiCondition}
        AND ($2::timestamp IS NULL OR ch.ngay_gio_bat_dau >= $2::timestamp)
        AND ($3::timestamp IS NULL OR ch.ngay_gio_bat_dau <= $3::timestamp)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [userId, startDate || null, endDate || null]);
    return rows;
  }

  // 3. Lấy lịch sử bệnh án lâm sàng của bệnh nhân (các lần chẩn đoán trước của Bác sĩ)
  async getPatientHistory(patientId: string) {
    const queryStr = `
      SELECT
        nk.id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu, nk.ngay_tao as thoi_gian_tao,
        ch.id as lich_dat_id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ghi_chu_khach_hang as ly_do_kham, ch.anh_dinh_kem_url,
        nd_bs.ho_ten as ten_bac_si, nd_bs.anh_dai_dien as anh_bac_si,
        goi.ten_goi as khuyen_nghi_goi
      FROM nhat_ky_buoi_dieu_tri nk
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN nguoi_dung nd_bs ON ch.nhan_su_id = nd_bs.id
      LEFT JOIN goi_dich_vu goi ON cd.goi_dich_vu_id = goi.id
      WHERE khach_hang_id = $1::uuid AND ch.loai = 'KHAM' AND ch.trang_thai = 'hoan_thanh'
      ORDER BY nk.ngay_tao DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 4. Lấy danh sách lịch điều trị của bệnh nhân (tiến trình gói/lẻ thực tế). so_buoi_da_dung tính
  // SỐNG từ số buổi cuoc_hen thực sự hoan_thanh thay vì tin cột cache phac_do_dieu_tri.so_buoi_da_dung
  // (cột cache từng bị lệch — xem PackageCard.tsx bên trang khách hàng đã vá lỗi tương tự). Kèm liên
  // kết ngược về đúng ca khám đã chỉ định ra phác đồ này (qua chi_dinh_buoi.phac_do_dieu_tri_id).
  async getPatientTreatments(patientId: string) {
    const queryStr = `
      SELECT
        pd.id,
        CASE WHEN goi.loai_goi = 'LIEU_TRINH' THEN 'goi' ELSE 'dich_vu' END as loai_dieu_tri,
        pd.tong_so_buoi,
        (SELECT COUNT(*) FROM cuoc_hen c2 WHERE c2.phac_do_dieu_tri_id = pd.id AND c2.trang_thai = 'hoan_thanh') as so_buoi_da_dung,
        pd.trang_thai, pd.ngay_kich_hoat as thoi_gian_tao,
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_lich_dieu_tri,
        NULL::text as ten_dich_vu, goi.ten_goi,
        'Hội chẩn lâm sàng' as chan_doan,
        origin_ch.id as goc_kham_id,
        nd_origin.ho_ten as bac_si_chi_dinh
      FROM phac_do_dieu_tri pd
      JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu goi ON pd.goi_dich_vu_id = goi.id
      LEFT JOIN chi_dinh_buoi cd_origin ON cd_origin.phac_do_dieu_tri_id = pd.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk_origin ON cd_origin.nhat_ky_id = nk_origin.id
      LEFT JOIN cuoc_hen origin_ch ON nk_origin.cuoc_hen_id = origin_ch.id
      LEFT JOIN nguoi_dung nd_origin ON origin_ch.nhan_su_id = nd_origin.id
      WHERE pd.khach_hang_id = $1::uuid
      ORDER BY pd.ngay_kich_hoat DESC NULLS LAST;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 4b. Lấy các lượt dịch vụ lẻ ĐỘC LẬP (không thuộc phác đồ nào) đã có kết quả — dịch vụ lẻ thanh
  // toán qua quick-billing không còn tạo phac_do_dieu_tri nữa nên getPatientTreatments() không thấy
  // được các buổi này. Trả về đúng hình dạng "1 lượt khám/dịch vụ" để gộp vào danh sách Khám &
  // Dịch vụ lẻ (KHÔNG còn giả làm "phác đồ 1 buổi" trộn vào cột liệu trình như trước — gây rối mắt).
  async getStandaloneServiceVisits(patientId: string) {
    const queryStr = `
      SELECT
        ch.id,
        ch.ngay_gio_bat_dau as thoi_gian_tao,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.trang_thai,
        dv.ten_goi as ten_dich_vu,
        nk.ghi_chu as ghi_chu,
        nd_nhan_su.ho_ten as ten_nhan_su,
        nd_nhan_su.anh_dai_dien as anh_nhan_su
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_nhan_su ON ch.nhan_su_id = nd_nhan_su.id
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.loai = 'DICH_VU_LE'
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.trang_thai IN ('hoan_thanh', 'da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat')
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 5. Lấy danh sách chi tiết các buổi trị liệu của 1 lịch điều trị cụ thể. thuc_hien_id (numeric)
  // dùng để so khớp với người đang đăng nhập — quyết định nhãn "Ghi chú của bạn" hay "Chỉ xem".
  async getTreatmentSessions(treatmentPlanId: string) {
    const queryStr = `
      SELECT
        ch.id, ch.so_thu_tu_buoi, ch.trang_thai, ch.ngay_gio_bat_dau as thoi_gian_bat_dau, ch.ngay_gio_ket_thuc as thoi_gian_ket_thuc,
        nk.vas_truoc as danh_gia_truoc_buoi, nk.vas_sau as danh_gia_sau_buoi, nk.ghi_chu as danh_gia_hieu_qua,
        nk.chong_chi_dinh as canh_bao_dac_biet, nk.chan_doan as ai_tom_tat_ngan,
        ch.nhan_su_id as thuc_hien_id,
        nd_ktv.ho_ten as ten_ky_thuat_vien, nd_ktv.anh_dai_dien as anh_ky_thuat_vien
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      WHERE ch.phac_do_dieu_tri_id = $1::uuid AND ch.loai = 'DIEU_TRI'
      ORDER BY ch.so_thu_tu_buoi ASC;
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
    ghi_chu?: string | null;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Tạo/cập nhật hồ sơ bệnh án (UPSERT vào nhat_ky_buoi_dieu_tri)
      const nhatKyQuery = `
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (cuoc_hen_id) 
        DO UPDATE SET 
          nguoi_tao_id = EXCLUDED.nguoi_tao_id,
          chan_doan = EXCLUDED.chan_doan,
          chong_chi_dinh = EXCLUDED.chong_chi_dinh,
          ghi_chu = EXCLUDED.ghi_chu
        RETURNING id;
      `;
      const nkRes = await client.query(nhatKyQuery, [
        data.lich_dat_id,
        parseInt(data.bac_si_id, 10),
        data.chan_doan,
        data.chong_chi_dinh,
        data.ghi_chu || null,
      ]);
      const nhatKyId = nkRes.rows[0].id;

      // 2. Thêm chỉ định gói/dịch vụ, kèm snapshot cấu hình gói tại đúng thời điểm chỉ định.
      // Số buổi bác sĩ kê là chỉ định lâm sàng: nếu admin sửa gói sau đó, lễ tân vẫn phải chốt
      // được đúng liệu trình + giá đã tư vấn cho khách (xem receptionist.service.calculateBilling).
      await client.query('DELETE FROM chi_dinh_buoi WHERE nhat_ky_id = $1', [nhatKyId]);
      if (data.goi_dich_vu_id) {
        await client.query(`
          INSERT INTO chi_dinh_buoi (nhat_ky_id, goi_dich_vu_id, tong_so_buoi_tu_van, don_gia_tu_van)
          SELECT $1, g.id, g.tong_so_buoi, g.don_gia
          FROM goi_dich_vu g
          WHERE g.id = $2
        `, [
          nhatKyId,
          data.goi_dich_vu_id
        ]);
      }

      // 3. Cập nhật trạng thái cuộc hẹn sang 'hoan_thanh'
      const updateLdQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = 'hoan_thanh'
        WHERE id = $1;
      `;
      await client.query(updateLdQuery, [data.lich_dat_id]);

      await client.query('COMMIT');
      return { success: true, medicalRecordId: nhatKyId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 6.4. Kiểm tra nhân sự có ca khám khác đang mở dở (trang_thai='dang_kham') hay không — 1 nhân sự
  // chỉ được mở 1 "bàn khám" tại 1 thời điểm, tránh quên bấm hoàn thành ca cũ rồi mở ca mới chồng lấn.
  async getActiveSessionForStaff(staffId: number, excludeAppointmentId: string) {
    const { rows } = await pool.query(
      `SELECT ch.id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, kh.ho_ten as ten_khach_hang
       FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE ch.nhan_su_id = $1 AND ch.trang_thai = 'dang_kham' AND ch.id != $2::uuid
       LIMIT 1`,
      [staffId, excludeAppointmentId]
    );
    return rows[0] || null;
  }

  // 6.5. Bắt đầu ca khám / điều trị (Cập nhật trạng thái đang khám và tạo nhật ký)
  async startSession(appointmentId: string, staffId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Cập nhật trạng thái cuộc hẹn thành 'dang_kham'
      await client.query(`
        UPDATE cuoc_hen
        SET trang_thai = 'dang_kham'
        WHERE id = $1::uuid;
      `, [appointmentId]);

      // 2. Tạo nhật ký buổi điều trị (nếu chưa có)
      await client.query(`
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu)
        VALUES ($1::uuid, $2::integer, '', '', '')
        ON CONFLICT (cuoc_hen_id) DO NOTHING;
      `, [appointmentId, staffId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 7. Lấy chi tiết 1 ca khám theo ID (để hiển thị thông tin khi khám)
  async getAppointmentDetail(appointmentId: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu,
        nk.vas_truoc, nk.vas_sau,
        cd.goi_dich_vu_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        pd.tong_so_buoi as pd_tong_so_buoi,
        nk.ngay_tao as nhat_ky_ngay_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      WHERE ch.id = $1::uuid;
    `;
    const { rows } = await pool.query(queryStr, [appointmentId]);
    return rows[0] || null;
  }

  // 8. Lấy lịch làm việc của bác sĩ (nguoi_dung_id)
  async getDoctorSchedules(userId: string) {
    const queryStr = `
      SELECT 
        id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, 
        to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc, trang_thai
      FROM lich_truc_nhan_su
      WHERE nhan_su_id = $1::integer
      ORDER BY ngay_truc ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 9. Lấy danh sách bệnh nhân kèm thông tin chống chỉ định cho bác sĩ (chỉ hiển thị bệnh nhân liên quan đến bác sĩ này)
  async getPatients(userId: string) {
    const queryStr = `
      SELECT DISTINCT kh.id as khach_hang_id, kh.id as id, kh.id as nguoi_dung_id, kh.ngay_sinh, kh.gioi_tinh, kh.dia_chi,
             COALESCE(kh.ho_ten, 'Khách vãng lai') as ho_ten, 
             kh.email, 
             kh.so_dien_thoai, 
             kh.trang_thai, 
             EXISTS (
                SELECT 1 
                FROM cuoc_hen ch_inner
                JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch_inner.id
                WHERE ch_inner.khach_hang_id = kh.id 
                  AND nk.chong_chi_dinh IS NOT NULL 
                  AND nk.chong_chi_dinh <> ''
             ) as has_chong_chi_dinh
      FROM khach_hang kh
      JOIN cuoc_hen ch ON ch.khach_hang_id = kh.id
      WHERE ch.nhan_su_id = $1::integer
      ORDER BY ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }
}

export default new DoctorRepository();
