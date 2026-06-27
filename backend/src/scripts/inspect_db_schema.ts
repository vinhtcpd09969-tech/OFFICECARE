import { pool } from '../config/db';

async function run() {
  try {
    const tables = ['ho_so_dieu_tri', 'lich_dat'];
    for (const table of tables) {
      console.log(`\nColumns for table: ${table}`);
      const { rows } = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      rows.forEach(r => {
        console.log(`  - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
