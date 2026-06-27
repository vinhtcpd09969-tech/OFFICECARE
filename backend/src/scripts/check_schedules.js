const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

async function run() {
  try {
    const res = await pool.query("SHOW TIMEZONE");
    console.log("Database Timezone:", res.rows[0].TimeZone);
  } catch (err) {
    console.error("Database query error:", err);
  } finally {
    await pool.end();
  }
}

run();
