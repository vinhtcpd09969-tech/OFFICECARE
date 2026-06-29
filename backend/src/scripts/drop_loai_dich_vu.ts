import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Dropping loai_dich_vu column from dich_vu table...');
    await client.query(`
      ALTER TABLE dich_vu DROP COLUMN IF EXISTS loai_dich_vu;
    `);
    await client.query('COMMIT');
    console.log('✓ Successfully dropped loai_dich_vu column!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to drop column:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
