const path = require('path');
const pgPath = path.resolve(__dirname, '../backend/node_modules/pg');
const pg = require(pgPath);
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care',
});

async function main() {
  try {
    console.log('--- SELECTING SERVICES AND ROOMS ---');
    
    // Get all services
    const serviceRes = await pool.query(
      "SELECT id, ten_dich_vu, thoi_luong_phut, don_gia, loai_dich_vu, thiet_bi_yeu_cau FROM dich_vu"
    );
    console.log('Services in DB:');
    console.table(serviceRes.rows);

    // Get all rooms
    const roomRes = await pool.query(
      "SELECT id, ten_phong, ma_phong, loai_phong, loai_dich_vu_ho_tro FROM phong"
    );
    console.log('Rooms in DB:');
    console.table(roomRes.rows);
  } catch (err) {
    console.error('ERROR querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
