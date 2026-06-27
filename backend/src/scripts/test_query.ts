import { pool } from '../config/db';

async function run() {
  try {
    const id = '07c067b4-5fd9-4cca-9182-e593ba7a8fdc';
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, 
        ld.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ld.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ld.trang_thai,
        ld.ho_ten_khach, 
        ld.so_dien_thoai,
        ld.gioi_tinh_khach,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ld.bac_si_id AS ky_thuat_vien_id,
        ld.phong_id,
        p.ten_phong,
        hs.chan_doan,
        hs.chong_chi_dinh,
        ld.ly_do_huy,
        ld.thoi_gian_huy,
        ld.ly_do_kham,
        ld.ghi_chu_dat_lich,
        ld.thoi_gian_tao
      FROM lich_dat ld
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.bac_si_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      LEFT JOIN ho_so_dieu_tri hs ON ld.id = hs.lich_dat_id
      WHERE ld.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    console.log("Query success! Result:", rows);
  } catch (err: any) {
    console.error("SQL QUERY FAILED WITH ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

run();
