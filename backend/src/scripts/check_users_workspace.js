const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

async function run() {
  try {
    const ndCount = await pool.query('SELECT COUNT(*) FROM nguoi_dung');
    const khCount = await pool.query('SELECT COUNT(*) FROM khach_hang');
    console.log("=== Database Stats ===");
    console.log(`nguoi_dung table count: ${ndCount.rows[0].count}`);
    console.log(`khach_hang table count: ${khCount.rows[0].count}`);

    const ndRows = await pool.query('SELECT id, ho_ten, email, vai_tro_id FROM nguoi_dung');
    console.log("=== nguoi_dung samples ===");
    console.log(ndRows.rows);

    const khRows = await pool.query('SELECT id, ho_ten, email FROM khach_hang LIMIT 5');
    console.log("=== khach_hang samples ===");
    console.log(khRows.rows);

    const cgytRows = await pool.query('SELECT id, nguoi_dung_id, ho_ten, vai_tro FROM chuyen_gia_y_te JOIN nguoi_dung ON chuyen_gia_y_te.nguoi_dung_id = nguoi_dung.id');
    console.log("=== chuyen_gia_y_te ===");
    console.log(cgytRows.rows);
  } catch (err) {
    console.error("Database query error:", err);
  } finally {
    await pool.end();
  }
}

run();
