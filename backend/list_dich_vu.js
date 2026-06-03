const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const res = await pool.query('SELECT id, ten_dich_vu, loai_dich_vu, mo_ta_ngan FROM dich_vu ORDER BY loai_dich_vu, ten_dich_vu');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
