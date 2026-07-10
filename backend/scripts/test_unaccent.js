const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care?options=-c%20timezone=UTC',
});

async function main() {
  try {
    const res = await pool.query("SELECT unaccent('Trần Vinh')");
    console.log('Unaccent result:', res.rows[0]);
  } catch (err) {
    console.error('Unaccent error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
