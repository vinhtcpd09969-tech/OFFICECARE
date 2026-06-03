const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  const sqlPath = path.join(__dirname, 'src', 'scripts', 'migrations', '001_db_reset_and_refactor.sql');
  console.log(`Reading migration script from: ${sqlPath}`);
  
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration SQL file not found!');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('Connecting to database and running migration...');
    const result = await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed with error:', err);
  } finally {
    await pool.end();
  }
}

main();
