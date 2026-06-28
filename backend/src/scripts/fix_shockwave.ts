import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fix() {
  try {
    const { rows: cats } = await pool.query("SELECT id FROM loai_thiet_bi WHERE nhom_thiet_bi = 'co_hoc'");
    if (cats.length > 0) {
      const coHocId = cats[0].id;
      await pool.query(`
        UPDATE thiet_bi_y_te 
        SET loai_thiet_bi_id = $1, loai_thiet_bi = 'Tác động cơ học / sóng'
        WHERE ten_thiet_bi ILIKE '%Shockwave%'
      `, [coHocId]);
      console.log('✓ Fixed Shockwave machine mapping.');
    }
  } catch (err) {
    console.error('Error fixing Shockwave mapping:', err);
  } finally {
    await pool.end();
  }
}

fix();
