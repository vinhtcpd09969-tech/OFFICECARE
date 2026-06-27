const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const res = await pool.query("UPDATE phong SET loai_phong = 'phong_dac_biet' WHERE loai_phong = 'phong_may_co_dinh'");
    console.log('Successfully updated room types. Rows affected:', res.rowCount);
  } catch (err) {
    console.error('Error updating room types:', err);
  } finally {
    await pool.end();
  }
}

main();
