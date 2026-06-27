import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("=== RUNNING REPOSITORY QUERY FOR 2026-06-25 ===");
    const res = await client.query(`
      SELECT 
        ld.id, ld.ma_lich_dat, 
        ld.ngay_gio_bat_dau as ngay_gio_bat_dau, 
        ld.ngay_gio_ket_thuc as ngay_gio_ket_thuc, 
        ld.trang_thai, CASE WHEN ld.dich_vu_id IS NOT NULL THEN 'dich_vu_don' ELSE 'kham_moi' END as loai_lich,
        COALESCE(kh.ho_ten, ld.ho_ten_khach) AS ten_khach_hang, 
        COALESCE(kh.so_dien_thoai, ld.so_dien_thoai) AS so_dien_thoai,
        kh.id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        ld.bac_si_id,
        ld.phong_id,
        p.ten_phong
      FROM lich_dat ld
      LEFT JOIN ho_so_dieu_tri hsba ON hsba.lich_dat_id = ld.id
      LEFT JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      LEFT JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN chuyen_gia_y_te ktv ON ld.bac_si_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      WHERE ld.ngay_gio_bat_dau >= '2026-06-25T00:00:00+07:00' 
        AND ld.ngay_gio_bat_dau <= '2026-06-25T23:59:59+07:00'
      ORDER BY ld.ngay_gio_bat_dau ASC
    `);
    console.log(`Found ${res.rows.length} rows.`);
    res.rows.forEach(r => {
      console.log(`- ${r.ma_lich_dat}: ${r.ten_khach_hang} | ${r.ngay_gio_bat_dau} | ${r.trang_thai} | BS ID: ${r.bac_si_id} | Phòng: ${r.ten_phong}`);
    });
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
