import { pool } from '../config/db';

async function main() {
  try {
    const services = await pool.query(`
      SELECT id, ten_dich_vu, thiet_bi_yeu_cau, loai_dich_vu 
      FROM dich_vu 
      ORDER BY ten_dich_vu ASC
    `);
    console.log('--- SERVICES ---');
    console.log(JSON.stringify(services.rows, null, 2));

    const equipment = await pool.query(`
      SELECT id, ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, trang_thai, phong_id_hien_tai 
      FROM thiet_bi_y_te 
      ORDER BY ma_thiet_bi ASC
    `);
    console.log('--- EQUIPMENT ---');
    console.log(JSON.stringify(equipment.rows, null, 2));
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();
