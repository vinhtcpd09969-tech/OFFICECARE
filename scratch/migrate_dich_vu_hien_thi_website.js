const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    console.log('Altering dich_vu table to add hien_thi_website column...');
    await pool.query(`
      ALTER TABLE dich_vu 
      ADD COLUMN IF NOT EXISTS hien_thi_website boolean NOT NULL DEFAULT true;
    `);
    console.log('✅ Alter table successful! Added hien_thi_website to dich_vu.');

    // Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dich_vu' AND column_name = 'hien_thi_website';
    `);
    console.log('Current status of hien_thi_website column in table dich_vu:', columns.rows);
  } catch (err) {
    console.error('❌ Error during database migration:', err);
  } finally {
    await pool.end();
  }
}

main();
