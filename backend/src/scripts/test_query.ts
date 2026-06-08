import { pool } from '../config/db';

async function test() {
  try {
    const { rows } = await pool.query(`
      SELECT 
        tb.*, 
        tb.ngay_bao_tri_tiep_theo as ngay_bao_tri_gan_nhat, 
        p.ten_phong,
        p.ma_phong,
        active_session.active_booking_type,
        active_session.active_booking_id,
        active_session.active_patient_name,
        active_session.active_operator_name,
        active_session.active_service_name,
        active_session.active_booking_code
      FROM thiet_bi_y_te tb
      LEFT JOIN phong p ON tb.phong_id_hien_tai = p.id
      LEFT JOIN LATERAL (
        (
          SELECT 
            'lich_dieu_tri' AS active_booking_type,
            btl.id::text AS active_booking_id,
            kh_user.ho_ten AS active_patient_name,
            ktv_user.ho_ten AS active_operator_name,
            dv.ten_dich_vu AS active_service_name,
            ldt.ma_lich_dieu_tri AS active_booking_code
          FROM buoi_tri_lieu btl
          JOIN lich_dieu_tri ldt ON btl.lich_dieu_tri_id = ldt.id
          JOIN khach_hang kh ON btl.khach_hang_id = kh.id
          JOIN nguoi_dung kh_user ON kh.nguoi_dung_id = kh_user.id
          JOIN chuyen_gia_y_te cg ON btl.ky_thuat_vien_id = cg.id
          JOIN nguoi_dung ktv_user ON cg.nguoi_dung_id = ktv_user.id
          LEFT JOIN dich_vu dv ON btl.dich_vu_id = dv.id
          WHERE btl.trang_thai = 'dang_thuc_hien'
            AND btl.phong_id = tb.phong_id_hien_tai
            AND (dv.thiet_bi_yeu_cau ILIKE '%' || tb.loai_thiet_bi || '%' OR tb.loai_thiet_bi ILIKE '%' || dv.thiet_bi_yeu_cau || '%')
          LIMIT 1
        )
        UNION ALL
        (
          SELECT 
            'lich_kham' AS active_booking_type,
            ld.id::text AS active_booking_id,
            COALESCE(ld.ho_ten_khach, kh_user.ho_ten) AS active_patient_name,
            doc_user.ho_ten AS active_operator_name,
            dv.ten_dich_vu AS active_service_name,
            ld.ma_lich_dat AS active_booking_code
          FROM lich_dat ld
          LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
          LEFT JOIN nguoi_dung kh_user ON kh.nguoi_dung_id = kh_user.id
          LEFT JOIN chuyen_gia_y_te cg ON ld.bac_si_id = cg.id
          LEFT JOIN nguoi_dung doc_user ON cg.nguoi_dung_id = doc_user.id
          LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
          WHERE ld.trang_thai = 'da_checkin'
            AND ld.phong_id = tb.phong_id_hien_tai
            AND (dv.thiet_bi_yeu_cau ILIKE '%' || tb.loai_thiet_bi || '%' OR tb.loai_thiet_bi ILIKE '%' || dv.thiet_bi_yeu_cau || '%')
          LIMIT 1
        )
      ) active_session ON tb.trang_thai = 'dang_su_dung'
      ORDER BY tb.thoi_gian_tao DESC
    `);
    console.log('Query success! Row count:', rows.length);
  } catch (error) {
    console.error('Query failed with error:', error);
  } finally {
    await pool.end();
  }
}

test();
