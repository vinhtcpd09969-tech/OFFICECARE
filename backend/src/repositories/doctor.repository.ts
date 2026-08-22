import { pool } from '../config/db';

class DoctorRepository {
  async isPackageLieuTrinh(goi_dich_vu_id: string) {
    const { rows } = await pool.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
    return rows.length > 0 && rows[0].loai_goi === 'LIEU_TRINH';
  }

  // Chặn chỉ định liệu trình mới khi khách đang có 1 liệu trình LIỆU_TRÌNH đang chạy, HOẶC còn 1
  // chỉ định liệu trình từ ca khám trước chưa thanh toán/kích hoạt — 1 khách chỉ được dùng tối đa 1
  // liệu trình tại 1 thời điểm. A19 (08/08/2026) — bỏ hẳn vế thời gian (PACKAGE_ACTIVATION_WINDOW_DAYS):
  // chỉ định "chờ kích hoạt" không còn hạn, bất kể đã bao lâu (`cd.phac_do_dieu_tri_id IS NULL` là
  // điều kiện chặn DUY NHẤT); khách đổi ý dùng luồng resolvePendingConflict (xóa chỉ định cũ) thay
  // vì chờ tự hết hạn. cuoc_hen_id: ca khám đang lưu chỉ định — dùng để tự xác định khách hàng, đồng
  // thời loại trừ chính nó khỏi kiểm tra "còn chỉ định cũ chưa kích hoạt" (tránh tự chặn khi bác sĩ
  // sửa lại chỉ định của cùng 1 ca khám vừa nhập).
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
      return {
        blocked: true,
        type: 'active_plan' as const,
        ten_goi: activeRows[0].ten_goi,
        reason: `Khách hàng đang có liệu trình "${activeRows[0].ten_goi}" hoạt động. Chỉ có thể chỉ định liệu trình mới sau khi liệu trình này hoàn thành hoặc bị hủy.`
      };
    }

    const { rows: pendingRows } = await pool.query(`
      SELECT cd.id as chi_dinh_buoi_id, g.ten_goi
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      WHERE ch.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND ch.id != $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND g.loai_goi = 'LIEU_TRINH'
      ORDER BY ch.ngay_gio_bat_dau DESC
      LIMIT 1
    `, [cuoc_hen_id]);
    if (pendingRows.length > 0) {
      return {
        blocked: true,
        type: 'pending_chi_dinh' as const,
        ten_goi: pendingRows[0].ten_goi,
        chi_dinh_buoi_id: pendingRows[0].chi_dinh_buoi_id,
        reason: `Khách hàng đã được chỉ định liệu trình "${pendingRows[0].ten_goi}" từ ca khám trước, chưa thanh toán/kích hoạt. Chỉ có thể chỉ định liệu trình khác sau khi xử lý xong chỉ định này.`
      };
    }

    return { blocked: false as const };
  }

  // Xóa hẳn 1 chỉ định gói CHƯA kích hoạt (dùng khi Bác sĩ chọn "xóa chỉ định cũ, dùng gói mới" ở
  // modal xung đột) — điều kiện phac_do_dieu_tri_id IS NULL là chốt an toàn cuối, không bao giờ xóa
  // nhầm 1 chỉ định đã kích hoạt/thu tiền dù tầng gọi có lỡ truyền sai id.
  async deletePendingChiDinh(chi_dinh_buoi_id: string) {
    const { rowCount } = await pool.query(
      'DELETE FROM chi_dinh_buoi WHERE id = $1 AND phac_do_dieu_tri_id IS NULL',
      [chi_dinh_buoi_id]
    );
    return (rowCount ?? 0) > 0;
  }
  // 1. Lấy danh sách bệnh nhân đang xếp hàng chờ khám (CHỈ CÁC CA ĐÃ CHECK-IN / ĐANG KHÁM / CHỜ TÁI LƯỢNG GIÁ)
  async getDoctorQueue(userId: string, roleId: number = 4) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai as so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        ch.thoi_gian_checkin,
        pv.thoi_gian_goi_vao,
        COALESCE(pv.so_lan_goi_khong_co_mat, 0) as so_lan_goi_khong_co_mat,
        pv.so_thu_tu_hang_doi,
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN true ELSE false END) AS is_reassessment
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT thoi_gian_goi_vao, so_lan_goi_khong_co_mat, so_thu_tu_hang_doi, lan_thu
        FROM phien_lam_viec
        WHERE cuoc_hen_id = ch.id
        ORDER BY lan_thu DESC, thoi_gian_tao DESC
        LIMIT 1
      ) pv ON TRUE
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc >= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      WHERE (ch.nhan_su_id = $1::integer OR ch.nhan_su_id IS NULL)
        AND ${loaiCondition}
        AND ch.trang_thai IN ('da_checkin', 'dang_kham', 'cho_tai_luong_gia')
      ORDER BY 
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR nk.id IS NOT NULL OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN 0 ELSE 1 END) ASC,
        ch.thoi_gian_checkin ASC NULLS LAST,
        ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 2. Lấy danh sách lịch hẹn khám của bác sĩ (cho phép filter theo khoảng thời gian)
  async getDoctorAppointments(userId: string, roleId: number = 4, startDate?: string, endDate?: string) {
    const loaiCondition = roleId === 3 ? "ch.loai != 'KHAM'" : "ch.loai = 'KHAM'";
    let whereClause = `WHERE (ch.nhan_su_id = $1::integer OR ch.nhan_su_id IS NULL) AND ${loaiCondition}`;
    const queryParams: any[] = [userId];

    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      whereClause += ` AND ch.ngay_gio_bat_dau >= $${queryParams.length - 1}::timestamp AND ch.ngay_gio_bat_dau <= $${queryParams.length}::timestamp`;
    }

    const queryStr = `
      SELECT 
        ch.id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu_khach_hang as ly_do_kham,
        ch.anh_dinh_kem_url, ch.khach_hang_id,
        ch.thoi_gian_tao, ch.thoi_gian_checkin, ch.thoi_gian_bat_dau, ch.thoi_gian_hoan_thanh,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as bac_si_id, ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        ch.so_thu_tu_buoi,
        COALESCE(g.tong_so_buoi, pd.tong_so_buoi) as tong_so_buoi_goi,
        COALESCE(shift_room.phong_id, ch.phong_id) as phong_id,
        COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong,
        pv.thoi_gian_goi_vao,
        COALESCE(pv.so_lan_goi_khong_co_mat, 0) as so_lan_goi_khong_co_mat,
        pv.so_thu_tu_hang_doi,
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN true ELSE false END) AS is_reassessment
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN LATERAL (
        SELECT thoi_gian_goi_vao, so_lan_goi_khong_co_mat, so_thu_tu_hang_doi, lan_thu
        FROM phien_lam_viec
        WHERE cuoc_hen_id = ch.id
        ORDER BY lan_thu DESC, thoi_gian_tao DESC
        LIMIT 1
      ) pv ON TRUE
      LEFT JOIN LATERAL (
        SELECT lt.phong_id, p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc >= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      ${whereClause}
      ORDER BY 
        (CASE WHEN ch.trang_thai = 'cho_tai_luong_gia' OR nk.id IS NOT NULL OR (pv.lan_thu IS NOT NULL AND pv.lan_thu > 1) THEN 0 ELSE 1 END) ASC,
        ch.thoi_gian_checkin ASC NULLS LAST,
        ch.ngay_gio_bat_dau ASC;
    `;
    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
  }

  // 2b. Gọi bệnh nhân từ hàng đợi vào phòng (B2/B19) — mô hình KÉO: nếu cuộc hẹn đang "Bất kỳ"
  // (nhan_su_id NULL) thì gán luôn cho người bấm, có khóa lạc quan ngay trong WHERE để 2 nhân sự
  // không cùng gọi trúng 1 khách (ai UPDATE trước thắng, người sau RETURNING 0 dòng → báo lỗi rõ
  // ràng thay vì âm thầm ghi đè — đúng mẫu khóa lạc quan đã dùng cho "Đổi buổi" trong kế hoạch).
  // Phòng trả về lấy từ CHÍNH ca trực hôm nay của người vừa được gán (B19), không phải theo cuộc
  // hẹn — vì hẹn "Bất kỳ" vốn chưa có phòng cho tới lúc có người nhận.
  async callInPatient(cuocHenId: string, userId: string, roleId: number) {
    const loaiCondition = roleId === 3 ? "loai != 'KHAM'" : "loai = 'KHAM'";
    // gan_qua_hang_doi chỉ bật lên TRUE khi nhan_su_id TRƯỚC ĐÓ đang NULL (claim thật qua mô hình
    // kéo) — vế điều kiện trong CASE đọc giá trị CŨ của cột, đúng ngữ nghĩa UPDATE chuẩn SQL, không
    // cần SELECT riêng trước đó nên vẫn giữ nguyên tính atomic của khóa lạc quan.
    const { rows: claimRows } = await pool.query(`
      UPDATE cuoc_hen
      SET nhan_su_id = $2::integer,
          gan_qua_hang_doi = CASE WHEN nhan_su_id IS NULL THEN TRUE ELSE gan_qua_hang_doi END
      WHERE id = $1
        AND ${loaiCondition}
        AND trang_thai IN ('da_checkin', 'cho_tai_luong_gia')
        AND (nhan_su_id IS NULL OR nhan_su_id = $2::integer)
      RETURNING id
    `, [cuocHenId, userId]);
    if (claimRows.length === 0) {
      throw new Error('Lịch hẹn này đã được nhân sự khác nhận hoặc không còn trong hàng đợi.');
    }
    const { rows: sessionRows } = await pool.query(
      `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NOW()
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)
       RETURNING id`,
      [cuocHenId]
    );
    if (sessionRows.length === 0) {
      await pool.query(
        `INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, thoi_gian_goi_vao, so_lan_goi_khong_co_mat, thoi_gian_tao)
         VALUES ($1, 1, NOW(), 0, NOW())`,
        [cuocHenId]
      );
    }

    const { rows } = await pool.query(`
      SELECT nd.ho_ten as ten_nhan_su, COALESCE(shift_room.ten_phong, p.ten_phong) as ten_phong
      FROM cuoc_hen ch
      JOIN nguoi_dung nd ON nd.id = ch.nhan_su_id
      LEFT JOIN phong_lam_viec p ON ch.phong_id = p.id
      LEFT JOIN LATERAL (
        SELECT p_lt.ten_phong
        FROM lich_truc_nhan_su lt
        JOIN phong_lam_viec p_lt ON lt.phong_id = p_lt.id
        WHERE lt.nhan_su_id = ch.nhan_su_id
          AND lt.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')
          AND lt.trang_thai = 'hoat_dong'
          -- Buổi hôm nay ĐANG DIỄN RA thật (đã gọi vào) → so với giờ THẬT bây giờ, không phải mốc
          -- buổi danh nghĩa (7h30/12h00) — nếu không, nhân sự ca 11h–20h "Gọi vào" lúc 11h40 cho 1
          -- khách thuộc buổi sáng (mốc danh nghĩa 7h30, ca họ không phủ) sẽ bị tính SAI là chưa vào ca,
          -- mất phòng dù đang trực thật. Ngày khác (xem lịch tương lai) vẫn dùng mốc danh nghĩa vì
          -- không có "bây giờ" để so — đúng ý nghĩa "dự kiến trực ở phòng nào".
          AND lt.gio_bat_dau <= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
          AND lt.gio_ket_thuc >= (CASE WHEN DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::time ELSE (ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh')::time END)
        LIMIT 1
      ) shift_room ON TRUE
      WHERE ch.id = $1
    `, [cuocHenId]);

    return {
      ten_nhan_su: rows[0]?.ten_nhan_su || null,
      ten_phong: rows[0]?.ten_phong || null,
    };
  }

  // 2c. Đánh dấu khách không có mặt khi được gọi (B11) — nhân sự phải là người ĐANG được gán ca đó
  // (ownership check, khác bản Lễ tân dùng ở appointmentRepository.pushBackAppointment — Lễ tân
  // quản lý cả hàng đợi nên không cần check quyền sở hữu). Lần 1 (đếm 0→1): chỉ tăng đếm + reset
  // thoi_gian_goi_vao về NULL (về lại "chưa gọi") + đẩy `cuoc_hen.thoi_gian_checkin` về NOW() để
  // đúng nguyên tắc "hàng đợi sắp theo thoi_gian_checkin" — khách tự động rơi xuống cuối, không cần
  // sort phụ nào khác ở frontend. KHÔNG đổi trang_thai, không cần xác nhận. Lần 2 (đếm 1→2): giao
  // hẳn cho service gọi appointmentRepository.updateAppointmentStatus xử lý "không đến" đầy đủ (phạt
  // uy tín/trừ buổi gói qua resolveNoShowOutcome) — repository này không chép lại logic đó.
  async markPatientAbsent(cuocHenId: string, userId: string, roleId: number): Promise<{ so_lan_goi_khong_co_mat: number; shouldFinalize: boolean }> {
    const loaiCondition = roleId === 3 ? "loai != 'KHAM'" : "loai = 'KHAM'";
    const { rows: apptRows } = await pool.query(
      `SELECT id FROM cuoc_hen WHERE id = $1 AND ${loaiCondition} AND nhan_su_id = $2::integer AND trang_thai IN ('da_checkin', 'cho_tai_luong_gia')`,
      [cuocHenId, userId]
    );
    if (apptRows.length === 0) {
      throw new Error('Không tìm thấy lịch hẹn này trong hàng đợi của bạn.');
    }

    const { rows: updRows } = await pool.query(
      `UPDATE phien_lam_viec SET so_lan_goi_khong_co_mat = so_lan_goi_khong_co_mat + 1
       WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)
       RETURNING so_lan_goi_khong_co_mat`,
      [cuocHenId]
    );

    let newCount: number;
    if (updRows.length === 0) {
      await pool.query(
        `INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_lan_goi_khong_co_mat, thoi_gian_tao)
         VALUES ($1, 1, 1, NOW())`,
        [cuocHenId]
      );
      newCount = 1;
    } else {
      newCount = updRows[0].so_lan_goi_khong_co_mat;
    }

    if (newCount < 2) {
      await pool.query(
        `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NULL
         WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)`,
        [cuocHenId]
      );
      // Nếu nhan_su_id chỉ đang "giữ tạm" qua Gọi vào (gan_qua_hang_doi=true) thì nhả lại NULL ngay —
      // tránh khóa chết khi đúng người vừa gọi hết ca trước khi khách trồi lên hàng đợi lại (ví dụ đã
      // gặp: gọi lúc 15h25, khách vắng, 16h tan ca — nhân sự khác phải thấy lại được ngay lúc đẩy
      // xuống, không phải đợi ai đó vào tận DetailModal đổi tay). Khách chọn đích danh từ lúc đặt lịch
      // (gan_qua_hang_doi=false) thì giữ nguyên nhan_su_id — chỉ Admin đổi được (B15).
      await pool.query(
        `UPDATE cuoc_hen
         SET thoi_gian_checkin = NOW(),
             nhan_su_id = CASE WHEN gan_qua_hang_doi THEN NULL ELSE nhan_su_id END,
             gan_qua_hang_doi = FALSE
         WHERE id = $1`,
        [cuocHenId]
      );
      return { so_lan_goi_khong_co_mat: newCount, shouldFinalize: false };
    }

    return { so_lan_goi_khong_co_mat: newCount, shouldFinalize: true };
  }

  // 3. Lấy lịch sử bệnh án lâm sàng của bệnh nhân (các lần chẩn đoán trước của Bác sĩ)
  async getPatientHistory(patientId: string) {
    const queryStr = `
      SELECT
        nk.id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu, nk.vas_truoc, nk.du_lieu_luong_gia, nk.du_lieu_tri_lieu, nk.ngay_tao as thoi_gian_tao,
        ch.id as lich_dat_id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.trang_thai as trang_thai,
        ch.ghi_chu_khach_hang as ly_do_kham, ch.anh_dinh_kem_url,
        nd_bs.ho_ten as ten_bac_si, nd_bs.anh_dai_dien as anh_bac_si,
        goi.ten_goi as khuyen_nghi_goi
      FROM nhat_ky_buoi_dieu_tri nk
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN nguoi_dung nd_bs ON ch.nhan_su_id = nd_bs.id
      LEFT JOIN goi_dich_vu goi ON cd.goi_dich_vu_id = goi.id
      WHERE ch.khach_hang_id = $1::uuid AND UPPER(ch.loai) LIKE '%KHAM%' AND ch.trang_thai IN ('hoan_thanh', 'cho_tai_luong_gia')
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
        pd.goi_dich_vu_id as goi_dich_vu_id,
        CASE WHEN goi.loai_goi = 'LIEU_TRINH' THEN 'goi' ELSE 'dich_vu' END as loai_dieu_tri,
        pd.tong_so_buoi,
        (SELECT COUNT(*) FROM cuoc_hen c2 WHERE c2.phac_do_dieu_tri_id = pd.id AND c2.trang_thai = 'hoan_thanh') as so_buoi_da_dung,
        pd.trang_thai, pd.ngay_kich_hoat as thoi_gian_tao,
        'PD-' || UPPER(SUBSTRING(pd.id::text FROM 1 FOR 6)) as ma_lich_dieu_tri,
        NULL::text as ten_dich_vu, goi.ten_goi,
        'Hội chẩn lâm sàng' as chan_doan,
        origin_ch.id as goc_kham_id,
        nd_origin.ho_ten as bac_si_chi_dinh,
        CAST(hd.tong_tien_goc AS double precision) as gia_goc_goi,
        CAST(hd.so_tien_giam_voucher AS double precision) as so_tien_giam_voucher,
        CAST(hd.tong_tien_phai_tra AS double precision) as tong_tien_thanh_toan,
        CAST(hd.so_tien_da_tra AS double precision) as da_thanh_toan,
        hd.trang_thai as trang_thai_thanh_toan,
        hd.hinh_thuc_thanh_toan_goi
      FROM phac_do_dieu_tri pd
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
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
        nk.vas_truoc as vas_truoc,
        nk.vas_sau as vas_sau,
        nk.du_lieu_tri_lieu as du_lieu_tri_lieu,
        nd_nhan_su.ho_ten as ten_nhan_su,
        nd_nhan_su.anh_dai_dien as anh_nhan_su
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_nhan_su ON ch.nhan_su_id = nd_nhan_su.id
      WHERE ch.khach_hang_id = $1::uuid
        AND ch.loai = 'DICH_VU_LE'
        AND ch.phac_do_dieu_tri_id IS NULL
        AND ch.trang_thai IN ('hoan_thanh', 'da_huy', 'khong_den')
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [patientId]);
    return rows;
  }

  // 5. Lấy danh sách chi tiết các buổi trị liệu của 1 lịch điều trị cụ thể. thuc_hien_id (numeric)
  // dùng để so khớp với người đang đăng nhập — quyết định nhãn "Ghi chú của bạn" hay "Chỉ xem".
  // Chỉ lấy buổi đã hoàn thành (có nhật ký lâm sàng thật) — đây là "Nhật ký buổi điều trị", không
  // phải lịch hẹn. Nếu 1 buổi từng "không đến" rồi đặt lại và hoàn thành (không mất buổi với
  // tung_buoi), sẽ có 2 dòng cuoc_hen cùng so_thu_tu_buoi trong DB (giữ nguyên để Lễ tân tra lịch sử
  // vắng mặt) — lọc thẳng ở đây để chỉ hiện đúng 1 dòng hoàn thành, không hiện dòng không đến/hủy đã
  // bị thay thế lẫn không cần liệt kê buổi chưa diễn ra ở khu vực này.
  async getTreatmentSessions(treatmentPlanId: string) {
    const queryStr = `
      SELECT
        ch.id, ch.so_thu_tu_buoi, ch.trang_thai, ch.ngay_gio_bat_dau as thoi_gian_bat_dau, ch.ngay_gio_ket_thuc as thoi_gian_ket_thuc,
        nk.vas_truoc as danh_gia_truoc_buoi, nk.vas_sau as danh_gia_sau_buoi, nk.ghi_chu as danh_gia_hieu_qua,
        nk.chong_chi_dinh as canh_bao_dac_biet, nk.chan_doan as ai_tom_tat_ngan, nk.du_lieu_tri_lieu as du_lieu_tri_lieu,
        ch.nhan_su_id as thuc_hien_id,
        nd_ktv.ho_ten as ten_ky_thuat_vien, nd_ktv.anh_dai_dien as anh_ky_thuat_vien
      FROM cuoc_hen ch
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN nguoi_dung nd_ktv ON ch.nhan_su_id = nd_ktv.id
      WHERE ch.phac_do_dieu_tri_id = $1::uuid AND ch.loai = 'DIEU_TRI' AND ch.trang_thai != 'da_huy'
      ORDER BY ch.so_thu_tu_buoi ASC;
    `;
    const { rows } = await pool.query(queryStr, [treatmentPlanId]);
    return rows;
  }

  // 6. Ghi nhận bệnh án lâm sàng & Hoàn thành / Hẹn tái khám (Chạy trong transaction)
  async saveClinicalAssessment(data: {
    lich_dat_id: string;
    bac_si_id: string;
    chan_doan: string;
    chong_chi_dinh: string;
    goi_dich_vu_id?: string | null;
    goi_dich_vu_ids?: string[] | null;
    ghi_chu?: string | null;
    is_reassessment?: boolean;
    han_tai_kham?: string | null;
    vas_score?: number | null;
    rom_data?: any[] | null;
    mmt_data?: any[] | null;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentRes = await client.query('SELECT trang_thai FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      if (currentRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn.');
      }
      if (['hoan_thanh', 'da_huy', 'khong_den'].includes(currentRes.rows[0].trang_thai)) {
        throw new Error('Ca khám này đã kết thúc (hoàn thành/hủy/không đến), không thể chỉnh sửa hoặc hoàn thành lại.');
      }

      const duLieuLuongGiaJson = (data.rom_data?.length || data.mmt_data?.length)
        ? JSON.stringify({ rom_data: data.rom_data || [], mmt_data: data.mmt_data || [] })
        : null;

      // 1. Tạo/cập nhật hồ sơ bệnh án (UPSERT vào nhat_ky_buoi_dieu_tri)
      const nhatKyQuery = `
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu, vas_truoc, du_lieu_luong_gia)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cuoc_hen_id) 
        DO UPDATE SET 
          nguoi_tao_id = EXCLUDED.nguoi_tao_id,
          chan_doan = EXCLUDED.chan_doan,
          chong_chi_dinh = EXCLUDED.chong_chi_dinh,
          ghi_chu = EXCLUDED.ghi_chu,
          vas_truoc = COALESCE(EXCLUDED.vas_truoc, nhat_ky_buoi_dieu_tri.vas_truoc),
          du_lieu_luong_gia = COALESCE(EXCLUDED.du_lieu_luong_gia, nhat_ky_buoi_dieu_tri.du_lieu_luong_gia)
        RETURNING id;
      `;
      const nkRes = await client.query(nhatKyQuery, [
        data.lich_dat_id,
        parseInt(data.bac_si_id, 10),
        data.chan_doan,
        data.chong_chi_dinh,
        data.ghi_chu || null,
        data.vas_score != null ? data.vas_score : null,
        duLieuLuongGiaJson,
      ]);
      const nhatKyId = nkRes.rows[0].id;

      // 2. Thêm chỉ định gói/dịch vụ (hỗ trợ nhiều gói cùng lúc), kèm snapshot cấu hình gói tại đúng thời điểm chỉ định.
      await client.query('DELETE FROM chi_dinh_buoi WHERE nhat_ky_id = $1', [nhatKyId]);
      const rawGoiIds = data.goi_dich_vu_ids || (data.goi_dich_vu_id ? [data.goi_dich_vu_id] : []);
      const validGoiIds = Array.from(new Set(rawGoiIds.filter(Boolean)));
      for (const gid of validGoiIds) {
        await client.query(`
          INSERT INTO chi_dinh_buoi (nhat_ky_id, goi_dich_vu_id, tong_so_buoi_tu_van, don_gia_tu_van)
          SELECT $1, g.id, g.tong_so_buoi, g.don_gia
          FROM goi_dich_vu g
          WHERE g.id = $2
        `, [
          nhatKyId,
          gid
        ]);
      }

      // 3. Nếu là Hẹn tái khám (Chuyển tuyến): Đổi trạng thái sang 'cho_tai_luong_gia', lưu han_tai_kham, và GIẢI PHÓNG BÀN KHÁM NGAY (thoi_gian_goi_vao = NULL)
      if (data.is_reassessment) {
        const updateReassessQuery = `
          UPDATE cuoc_hen
          SET trang_thai = 'cho_tai_luong_gia',
              han_tai_kham = $2
          WHERE id = $1;
        `;
        await client.query(updateReassessQuery, [data.lich_dat_id, data.han_tai_kham || null]);
        await client.query(
          `UPDATE phien_lam_viec SET thoi_gian_goi_vao = NULL
           WHERE id = (SELECT id FROM phien_lam_viec WHERE cuoc_hen_id = $1 ORDER BY lan_thu DESC, thoi_gian_tao DESC LIMIT 1)`,
          [data.lich_dat_id]
        );
      } else {
        // Hoàn thành ca khám bình thường: Lưu vết nhân sự thực tế đã thực hiện khám
        const updateLdQuery = `
          UPDATE cuoc_hen
          SET trang_thai = 'hoan_thanh',
              nhan_su_id = COALESCE(nhan_su_id, $2::integer),
              thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, thoi_gian_checkin, NOW()),
              thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW())
          WHERE id = $1;
        `;
        await client.query(updateLdQuery, [data.lich_dat_id, parseInt(data.bac_si_id, 10)]);
      }

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
  async getActiveSessionForStaff(staffId: number, excludeAppointmentId: string | null) {
    const { rows } = await pool.query(
      `SELECT ch.id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, kh.ho_ten as ten_khach_hang
       FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE ch.nhan_su_id = $1 AND ch.trang_thai = 'dang_kham' AND ($2::uuid IS NULL OR ch.id != $2::uuid)
       LIMIT 1`,
      [staffId, excludeAppointmentId || null]
    );
    return rows[0] || null;
  }

  // 6.5. Bắt đầu ca khám / điều trị (Cập nhật trạng thái đang khám, gán nhân sự nếu chưa gán, và tạo nhật ký)
  async startSession(appointmentId: string, staffId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cập nhật trạng thái cuộc hẹn thành 'dang_kham', gán nhân sự (nếu đang Bất kỳ/NULL), và ghi mốc thoi_gian_bat_dau
      await client.query(`
        UPDATE cuoc_hen
        SET trang_thai = 'dang_kham',
            nhan_su_id = COALESCE(nhan_su_id, $2::integer),
            gan_qua_hang_doi = CASE WHEN nhan_su_id IS NULL THEN TRUE ELSE gan_qua_hang_doi END,
            thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, NOW())
        WHERE id = $1::uuid;
      `, [appointmentId, staffId]);

      // 2. Đảm bảo phien_lam_viec có mốc thoi_gian_goi_vao
      await client.query(`
        UPDATE phien_lam_viec
        SET thoi_gian_goi_vao = COALESCE(thoi_gian_goi_vao, NOW())
        WHERE id = (
          SELECT id FROM phien_lam_viec 
          WHERE cuoc_hen_id = $1::uuid 
          ORDER BY lan_thu DESC, thoi_gian_tao DESC 
          LIMIT 1
        );
      `, [appointmentId]);

      await client.query(`
        INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, thoi_gian_goi_vao, so_lan_goi_khong_co_mat, thoi_gian_tao)
        SELECT $1::uuid, 1, NOW(), 0, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM phien_lam_viec WHERE cuoc_hen_id = $1::uuid);
      `, [appointmentId]);

      // 3. Tạo nhật ký buổi điều trị (nếu chưa có)
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
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai as so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        ch.loai, ch.trang_thai_thanh_toan,
        ch.thoi_gian_tao, ch.thoi_gian_checkin, ch.thoi_gian_bat_dau, ch.thoi_gian_hoan_thanh,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu,
        nk.vas_truoc, nk.vas_sau, nk.du_lieu_luong_gia, nk.du_lieu_tri_lieu,
        COALESCE(ch.goi_dich_vu_id, pd.goi_dich_vu_id, cd.goi_dich_vu_id) as goi_dich_vu_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_goi,
        COALESCE(g.quy_trinh, gpd.quy_trinh) as quy_trinh,
        COALESCE(g.muc_tieu, gpd.muc_tieu) as mo_ta_goi,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        COALESCE(g.tong_so_buoi, pd.tong_so_buoi) as tong_so_buoi,
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
    const apt = rows[0] || null;
    if (apt && apt.ho_so_benh_an_id) {
      const cdRes = await pool.query(`
        SELECT cd.goi_dich_vu_id, g.ten_goi, g.don_gia, g.tong_so_buoi
        FROM chi_dinh_buoi cd
        JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
        WHERE cd.nhat_ky_id = $1
      `, [apt.ho_so_benh_an_id]);
      apt.danh_sach_goi_chi_dinh = cdRes.rows;
      apt.goi_dich_vu_ids = cdRes.rows.map((r: any) => r.goi_dich_vu_id);
    }
    if (apt) {
      const blockedRes = await pool.query(`
        SELECT pd.goi_dich_vu_id, g.ten_goi, 'dang_dieu_tri' as reason_type,
               ('Khách hàng đang điều trị gói này (' || pd.so_buoi_da_dung || '/' || pd.tong_so_buoi || ' buổi)') as message
        FROM phac_do_dieu_tri pd
        JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
        WHERE pd.khach_hang_id = $1
          AND pd.trang_thai = 'dang_dieu_tri'
          AND pd.so_buoi_da_dung < pd.tong_so_buoi
        UNION ALL
        SELECT cd.goi_dich_vu_id, g.ten_goi, 'cho_thanh_toan' as reason_type,
               'Khách hàng đã được chỉ định gói này từ ca trước (chưa thanh toán)' as message
        FROM chi_dinh_buoi cd
        JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
        JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
        JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
        WHERE ch.khach_hang_id = $1
          AND ch.id != $2
          AND cd.phac_do_dieu_tri_id IS NULL
          AND cd.goi_dich_vu_id NOT IN (
            SELECT goi_dich_vu_id FROM phac_do_dieu_tri 
            WHERE khach_hang_id = $1 AND trang_thai IN ('dang_dieu_tri', 'hoan_thanh')
          )
      `, [apt.khach_hang_id, appointmentId]);
      apt.blocked_packages = blockedRes.rows;
    }
    return apt;
  }

  async getBlockedPackagesForAppointment(appointmentId: string) {
    const { rows } = await pool.query(`
      SELECT pd.goi_dich_vu_id, g.ten_goi, 'dang_dieu_tri' as reason_type,
             ('Khách hàng đang điều trị gói này (' || pd.so_buoi_da_dung || '/' || pd.tong_so_buoi || ' buổi)') as message
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
      WHERE pd.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND pd.trang_thai = 'dang_dieu_tri'
        AND pd.so_buoi_da_dung < pd.tong_so_buoi
      UNION ALL
      SELECT cd.goi_dich_vu_id, g.ten_goi, 'cho_thanh_toan' as reason_type,
             'Khách hàng đã được chỉ định gói này từ ca trước (chưa thanh toán)' as message
      FROM chi_dinh_buoi cd
      JOIN nhat_ky_buoi_dieu_tri nk ON cd.nhat_ky_id = nk.id
      JOIN cuoc_hen ch ON nk.cuoc_hen_id = ch.id
      JOIN goi_dich_vu g ON cd.goi_dich_vu_id = g.id
      WHERE ch.khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1)
        AND ch.id != $1
        AND cd.phac_do_dieu_tri_id IS NULL
        AND cd.goi_dich_vu_id NOT IN (
          SELECT goi_dich_vu_id FROM phac_do_dieu_tri 
          WHERE khach_hang_id = (SELECT khach_hang_id FROM cuoc_hen WHERE id = $1) 
            AND trang_thai IN ('dang_dieu_tri', 'hoan_thanh')
        )
    `, [appointmentId]);
    return rows;
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

  // 9. Lấy danh sách bệnh nhân kèm thông tin chống chỉ định cho bác sĩ (hiển thị tất cả bệnh nhân có lịch hẹn hoặc hồ sơ với bác sĩ này)
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
                  AND nk.chong_chi_dinh <> 'Chưa điền'
             ) as has_chong_chi_dinh,
             (
                SELECT MAX(ch_last.ngay_gio_bat_dau)
                FROM cuoc_hen ch_last
                LEFT JOIN nhat_ky_buoi_dieu_tri nk_last ON nk_last.cuoc_hen_id = ch_last.id
                WHERE ch_last.khach_hang_id = kh.id
                  AND (ch_last.nhan_su_id = $1::integer OR nk_last.nguoi_tao_id = $1::integer)
             ) as lan_cuoi_su_dung
      FROM khach_hang kh
      JOIN cuoc_hen ch ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      WHERE (ch.nhan_su_id = $1::integer OR nk.nguoi_tao_id = $1::integer)
      ORDER BY ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 10. Lưu nháp thông tin lượng giá (chan_doan, chong_chi_dinh, vas, rom/mmt, khuyen_nghi_goi)
  async saveAssessmentDraft(data: {
    lich_dat_id: string;
    bac_si_id: string;
    chan_doan?: string | null;
    chong_chi_dinh?: string | null;
    ghi_chu?: string | null;
    vas_score?: number | null;
    rom_data?: any[] | null;
    mmt_data?: any[] | null;
    selected_package_id?: string | null;
    selected_package_ids?: string[] | null;
  }) {
    const duLieuLuongGiaJson = (data.rom_data?.length || data.mmt_data?.length)
      ? JSON.stringify({ rom_data: data.rom_data || [], mmt_data: data.mmt_data || [] })
      : null;

    await pool.query(`
      INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu, vas_truoc, du_lieu_luong_gia)
      VALUES ($1::uuid, $2::integer, COALESCE($3, ''), COALESCE($4, ''), COALESCE($5, ''), $6, $7)
      ON CONFLICT (cuoc_hen_id) 
      DO UPDATE SET 
        chan_doan = COALESCE(EXCLUDED.chan_doan, nhat_ky_buoi_dieu_tri.chan_doan),
        chong_chi_dinh = COALESCE(EXCLUDED.chong_chi_dinh, nhat_ky_buoi_dieu_tri.chong_chi_dinh),
        ghi_chu = COALESCE(EXCLUDED.ghi_chu, nhat_ky_buoi_dieu_tri.ghi_chu),
        vas_truoc = COALESCE(EXCLUDED.vas_truoc, nhat_ky_buoi_dieu_tri.vas_truoc),
        du_lieu_luong_gia = COALESCE(EXCLUDED.du_lieu_luong_gia, nhat_ky_buoi_dieu_tri.du_lieu_luong_gia);
    `, [
      data.lich_dat_id,
      parseInt(data.bac_si_id, 10),
      data.chan_doan || null,
      data.chong_chi_dinh || null,
      data.ghi_chu || null,
      data.vas_score != null ? data.vas_score : null,
      duLieuLuongGiaJson,
    ]);

    const rawPkgIds = data.selected_package_ids || (data.selected_package_id ? [data.selected_package_id] : []);
    if (data.selected_package_ids !== undefined || data.selected_package_id !== undefined) {
      const nkRes = await pool.query('SELECT id FROM nhat_ky_buoi_dieu_tri WHERE cuoc_hen_id = $1::uuid', [data.lich_dat_id]);
      if (nkRes.rows.length > 0) {
        const nhatKyId = nkRes.rows[0].id;
        await pool.query('DELETE FROM chi_dinh_buoi WHERE nhat_ky_id = $1', [nhatKyId]);
        const validPkgIds = Array.from(new Set(rawPkgIds.filter(Boolean)));
        for (const pkgId of validPkgIds) {
          await pool.query(`
            INSERT INTO chi_dinh_buoi (nhat_ky_id, goi_dich_vu_id, tong_so_buoi_tu_van, don_gia_tu_van)
            SELECT $1, g.id, g.tong_so_buoi, g.don_gia
            FROM goi_dich_vu g
            WHERE g.id = $2
          `, [nhatKyId, pkgId]);
        }
      }
    }

    return { success: true };
  }

  async getPatientInfoById(patientId: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(patientId));
    let rows: any[] = [];

    if (isUuid) {
      const res = await pool.query(`
        SELECT
          id, ho_ten, so_dien_thoai, email,
          'KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8)) as ma_khach_hang,
          ngay_sinh, gioi_tinh
        FROM khach_hang WHERE id = $1::uuid
        LIMIT 1
      `, [String(patientId)]);
      rows = res.rows;
    } else {
      const res = await pool.query(`
        SELECT
          id, ho_ten, so_dien_thoai, email,
          'KH-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8)) as ma_khach_hang,
          ngay_sinh, gioi_tinh
        FROM khach_hang WHERE id::text = $1 OR email = $1 OR so_dien_thoai = $1
        LIMIT 1
      `, [String(patientId)]);
      rows = res.rows;
    }

    return rows[0] || null;
  }
}

export default new DoctorRepository();
