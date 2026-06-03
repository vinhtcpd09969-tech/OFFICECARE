const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT 
        ld.id, ld.ho_ten_khach, ld.bac_si_id, cg.id as cg_id, nd.ho_ten as bac_si_ten,
        (ld.ngay_gio_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS bat_dau,
        (ld.ngay_gio_ket_thuc AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS ket_thuc
      FROM lich_dat ld
      LEFT JOIN chuyen_gia_y_te cg ON ld.bac_si_id = cg.id
      LEFT JOIN nguoi_dung nd ON cg.nguoi_dung_id = nd.id
      WHERE DATE((ld.ngay_gio_bat_dau AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh') = '2026-05-30'
        AND ld.trang_thai NOT IN ('da_huy', 'khong_den')
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
