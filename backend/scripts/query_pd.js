const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care?options=-c%20timezone=UTC',
});

async function main() {
  try {
    const { rows: plans } = await pool.query(`
      SELECT id, khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai 
      FROM phac_do_dieu_tri
    `);
    console.log('--- PHAC DO ---');
    console.dir(plans);

    const { rows: appts } = await pool.query(`
      SELECT id, khach_hang_id, phac_do_dieu_tri_id, loai, trang_thai, so_thu_tu_buoi 
      FROM cuoc_hen
      WHERE loai = 'DIEU_TRI'
    `);
    console.log('--- APPOINTMENTS ---');
    console.dir(appts);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
