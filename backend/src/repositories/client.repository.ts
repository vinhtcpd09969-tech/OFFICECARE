import { pool } from '../config/db';

export class ClientRepository {
  async getTopServices() {
    const queryStr = `
      SELECT gdv.id, gdv.ten_goi, gdv.loai_goi, gdv.tong_so_buoi, gdv.thoi_luong_phut, gdv.don_gia, gdv.anh_goi,
             COUNT(ch.id) AS luot_dung
      FROM goi_dich_vu gdv
      LEFT JOIN cuoc_hen ch ON gdv.id = ch.goi_dich_vu_id
      WHERE gdv.trang_thai = 'hoat_dong'
      GROUP BY gdv.id
      ORDER BY luot_dung DESC, gdv.ten_goi ASC
      LIMIT 3
    `;
    const { rows } = await pool.query(queryStr);
    return rows.map((p: any) => ({
      id: p.id,
      ten_goi: p.ten_goi,
      loai_goi: p.loai_goi,
      tong_so_buoi: p.tong_so_buoi,
      thoi_luong_phut: p.thoi_luong_phut,
      don_gia: Number(p.don_gia),
      anh_goi: p.anh_goi,
      luot_dung: Number(p.luot_dung)
    }));
  }

  async getSpecialists() {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN danh_gia dg ON dg.nhan_su_id = nd.id AND dg.loai_danh_gia = 'NHAN_SU'
      WHERE nd.vai_tro_id IN (3, 4) AND nd.trang_thai = 'hoat_dong'
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh
      ORDER BY nd.vai_tro_id DESC, nd.ho_ten ASC
    `;
    const { rows } = await pool.query(queryStr);
    return rows;
  }

  async getSpecialistById(id: string | number) {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN danh_gia dg ON dg.nhan_su_id = nd.id AND dg.loai_danh_gia = 'NHAN_SU'
      WHERE nd.id = $1 AND nd.vai_tro_id IN (3, 4)
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh
    `;
    const { rows } = await pool.query(queryStr, [id]);
    return rows[0] || null;
  }

  async getSpecialistReviews(id: string | number) {
    const queryStr = `
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, kh.ho_ten as name, dg.ngay_cap_nhat as date, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      WHERE dg.nhan_su_id = $1 AND dg.loai_danh_gia = 'NHAN_SU'
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr, [id]);
    return rows;
  }

  async getServiceReviews(id: string | number) {
    const queryStr = `
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, kh.ho_ten as name, dg.ngay_cap_nhat as date, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      WHERE dg.goi_dich_vu_id = $1 AND dg.loai_danh_gia = 'GOI_DICH_VU'
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr, [id]);
    return rows;
  }

  async getTestimonials() {
    const queryStr = `
      SELECT dg.id, dg.so_sao, dg.nhan_xet, kh.ho_ten, kh.gioi_tinh, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      WHERE dg.loai_danh_gia = 'GOI_DICH_VU'
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr);
    return rows;
  }

  async getActiveTreatmentPlans(customerId: string | number) {
    const queryStr = `
      SELECT pd.id,
             pd.goi_dich_vu_id,
             gdv.ten_goi AS ten_goi_dich_vu,
             gdv.thoi_luong_phut,
             pd.tong_so_buoi,
             pd.so_buoi_da_dung,
             pd.trang_thai,
             hd.hinh_thuc_thanh_toan_goi,
             hd.so_tien_da_tra,
             hd.tong_tien_phai_tra,
             hd.trang_thai AS trang_thai_hoa_don
      FROM phac_do_dieu_tri pd
      JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
      LEFT JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1
        AND pd.trang_thai IN ('dang_dieu_tri', 'moi_tao')
      ORDER BY COALESCE(pd.ngay_kich_hoat, hd.ngay_tao) DESC
    `;
    const { rows } = await pool.query(queryStr, [customerId]);
    return rows;
  }

  async getPendingRatingAppointments(customerId: string | number) {
    const queryStr = `
      SELECT ch.id, ch.ngay_gio_bat_dau, g.ten_goi as ten_dich_vu, nd.ho_ten as ten_bac_si, ch.goi_dich_vu_id, ch.nhan_su_id, g.loai_goi,
             dg_g.id as rating_service_id, dg_g.so_sao as rating_service_stars, dg_g.nhan_xet as rating_service_comment,
             dg_n.id as rating_staff_id, dg_n.so_sao as rating_staff_stars, dg_n.nhan_xet as rating_staff_comment
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      LEFT JOIN danh_gia dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id AND dg_g.loai_danh_gia = 'GOI_DICH_VU')
      LEFT JOIN danh_gia dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id AND dg_n.loai_danh_gia = 'NHAN_SU')
      WHERE ch.khach_hang_id = $1
        AND ch.trang_thai = 'hoan_thanh'
        AND (
          dg_n.id IS NULL 
          OR 
          (
            dg_g.id IS NULL 
            AND (g.loai_goi IN ('LE', 'KHAM') OR pddt.trang_thai IN ('hoan_thanh', 'huy_ngang'))
          )
        )
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(queryStr, [customerId]);
    return rows;
  }

  async getAppointmentForRating(cuocHenId: string | number) {
    const { rows } = await pool.query(`
      SELECT ch.id, ch.trang_thai, ch.khach_hang_id, ch.goi_dich_vu_id, ch.nhan_su_id, ch.phac_do_dieu_tri_id,
             g.loai_goi, pddt.trang_thai as phac_do_status
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      WHERE ch.id = $1
    `, [cuocHenId]);
    return rows[0] || null;
  }

  async saveStaffReview(khachHangId: string | number, nhanSuId: string | number, cuocHenId: string | number, soSao: number, comment?: string) {
    const { rows } = await pool.query(`
      INSERT INTO danh_gia (khach_hang_id, nhan_su_id, loai_danh_gia, cuoc_hen_id, so_sao, nhan_xet, ngay_cap_nhat)
      VALUES ($1, $2, 'NHAN_SU', $3, $4, $5, NOW())
      ON CONFLICT (khach_hang_id, nhan_su_id)
      DO UPDATE SET so_sao = EXCLUDED.so_sao, nhan_xet = EXCLUDED.nhan_xet, cuoc_hen_id = EXCLUDED.cuoc_hen_id, ngay_cap_nhat = NOW()
      RETURNING id
    `, [khachHangId, nhanSuId, cuocHenId, soSao, comment]);
    return rows[0]?.id;
  }

  async saveServiceReview(khachHangId: string | number, goiDichVuId: string | number, cuocHenId: string | number, soSao: number, comment?: string) {
    const { rows } = await pool.query(`
      INSERT INTO danh_gia (khach_hang_id, goi_dich_vu_id, loai_danh_gia, cuoc_hen_id, so_sao, nhan_xet, ngay_cap_nhat)
      VALUES ($1, $2, 'GOI_DICH_VU', $3, $4, $5, NOW())
      ON CONFLICT (khach_hang_id, goi_dich_vu_id)
      DO UPDATE SET so_sao = EXCLUDED.so_sao, nhan_xet = EXCLUDED.nhan_xet, cuoc_hen_id = EXCLUDED.cuoc_hen_id, ngay_cap_nhat = NOW()
      RETURNING id
    `, [khachHangId, goiDichVuId, cuocHenId, soSao, comment]);
    return rows[0]?.id;
  }

  async getMyReviews(khachHangId: string | number) {
    const { rows: serviceReviews } = await pool.query(`
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, dg.ngay_cap_nhat as date, g.ten_goi as service_name, g.hinh_anh as service_avatar, dg.goi_dich_vu_id, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia dg
      JOIN goi_dich_vu g ON dg.goi_dich_vu_id = g.id
      WHERE dg.khach_hang_id = $1 AND dg.loai_danh_gia = 'GOI_DICH_VU'
      ORDER BY dg.ngay_cap_nhat DESC
    `, [khachHangId]);

    const { rows: staffReviews } = await pool.query(`
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, dg.ngay_cap_nhat as date, nd.ho_ten as staff_name, nd.anh_dai_dien as staff_avatar, dg.nhan_su_id, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia dg
      JOIN nguoi_dung nd ON dg.nhan_su_id = nd.id
      WHERE dg.khach_hang_id = $1 AND dg.loai_danh_gia = 'NHAN_SU'
      ORDER BY dg.ngay_cap_nhat DESC
    `, [khachHangId]);

    const { rows: pendingServiceReviews } = await pool.query(`
      SELECT DISTINCT ON (ch.goi_dich_vu_id)
        ch.goi_dich_vu_id, g.ten_goi as service_name, g.hinh_anh as service_avatar, ch.id as cuoc_hen_id, ch.ngay_gio_bat_dau as date
      FROM cuoc_hen ch
      JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      LEFT JOIN danh_gia dg ON (dg.khach_hang_id = ch.khach_hang_id AND dg.goi_dich_vu_id = ch.goi_dich_vu_id AND dg.loai_danh_gia = 'GOI_DICH_VU')
      WHERE ch.khach_hang_id = $1
        AND ch.trang_thai = 'hoan_thanh'
        AND ch.goi_dich_vu_id IS NOT NULL
        AND dg.id IS NULL
        AND (g.loai_goi IN ('LE', 'KHAM') OR pddt.trang_thai IN ('hoan_thanh', 'huy_ngang'))
      ORDER BY ch.goi_dich_vu_id, ch.ngay_gio_bat_dau DESC
    `, [khachHangId]);

    const { rows: pendingStaffReviews } = await pool.query(`
      SELECT DISTINCT ON (ch.nhan_su_id)
        ch.nhan_su_id, nd.ho_ten as staff_name, nd.anh_dai_dien as staff_avatar, ch.id as cuoc_hen_id, ch.ngay_gio_bat_dau as date
      FROM cuoc_hen ch
      JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN danh_gia dg ON (dg.khach_hang_id = ch.khach_hang_id AND dg.nhan_su_id = ch.nhan_su_id AND dg.loai_danh_gia = 'NHAN_SU')
      WHERE ch.khach_hang_id = $1
        AND ch.trang_thai = 'hoan_thanh'
        AND ch.nhan_su_id IS NOT NULL
        AND dg.id IS NULL
      ORDER BY ch.nhan_su_id, ch.ngay_gio_bat_dau DESC
    `, [khachHangId]);

    return { serviceReviews, staffReviews, pendingServiceReviews, pendingStaffReviews };
  }

  async updateServiceReview(reviewId: string | number, customerId: string | number, rating: number, comment?: string) {
    await pool.query(`
      UPDATE danh_gia
      SET so_sao = $1, nhan_xet = $2, ngay_cap_nhat = NOW(),
          cam_xuc = NULL, do_tin_cay = NULL, ly_do_cam_xuc = NULL, de_xuat_hanh_dong = NULL, de_xuat_phan_hoi = NULL
      WHERE id = $3 AND khach_hang_id = $4 AND loai_danh_gia = 'GOI_DICH_VU'
    `, [Number(rating), comment, reviewId, customerId]);
  }

  async updateStaffReview(reviewId: string | number, customerId: string | number, rating: number, comment?: string) {
    await pool.query(`
      UPDATE danh_gia
      SET so_sao = $1, nhan_xet = $2, ngay_cap_nhat = NOW(),
          cam_xuc = NULL, do_tin_cay = NULL, ly_do_cam_xuc = NULL, de_xuat_hanh_dong = NULL, de_xuat_phan_hoi = NULL
      WHERE id = $3 AND khach_hang_id = $4 AND loai_danh_gia = 'NHAN_SU'
    `, [Number(rating), comment, reviewId, customerId]);
  }

  async agreeTerms(customerId: string | number) {
    await pool.query(
      `UPDATE khach_hang SET ngay_dong_y_dieu_khoan = NOW() WHERE id = $1`,
      [customerId]
    );
  }

  async getActiveVouchers() {
    const { rows } = await pool.query(`
      SELECT v.id,
             v.ma_code AS ma_voucher,
             v.ten_chien_dich AS ten_khuyen_mai,
             v.loai_giam_gia AS loai_giam,
             v.gia_tri_giam::text AS gia_tri_giam,
             v.giam_toi_da::text AS giam_toi_da,
             v.don_hang_toi_thieu::text AS don_hang_toi_thieu,
             v.tu_dong_ap_dung,
             v.loai_goi_ap_dung,
             v.yeu_cau_thanh_toan,
             v.so_luong_gioi_han
      FROM khuyen_mai_voucher v
      LEFT JOIN hoa_don hd ON hd.voucher_id = v.id
      WHERE v.dang_kich_hoat = true
        AND (v.ngay_bat_dau IS NULL OR v.ngay_bat_dau <= NOW())
        AND (v.ngay_het_han IS NULL OR v.ngay_het_han >= NOW())
      GROUP BY v.id
      HAVING v.so_luong_gioi_han IS NULL OR COUNT(hd.id) < v.so_luong_gioi_han
      ORDER BY v.tu_dong_ap_dung DESC, v.gia_tri_giam DESC
    `);

    return rows.map((r: any) => ({
      ...r,
      gia_tri_giam: Number(r.gia_tri_giam || 0),
      giam_toi_da: r.giam_toi_da ? Number(r.giam_toi_da) : null,
      don_hang_toi_thieu: Number(r.don_hang_toi_thieu || 0),
    }));
  }
}

export default new ClientRepository();
