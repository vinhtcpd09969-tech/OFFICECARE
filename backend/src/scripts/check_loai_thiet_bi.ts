import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    const { rows } = await pool.query('SELECT id, ten_thiet_bi, loai_thiet_bi, loai_thiet_bi_id FROM thiet_bi_y_te');
    console.log('Equipment records:');
    console.table(rows);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

check();
