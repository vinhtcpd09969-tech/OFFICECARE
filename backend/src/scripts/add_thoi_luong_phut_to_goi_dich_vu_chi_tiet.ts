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
    console.log('Adding thoi_luong_phut column to goi_dich_vu_chi_tiet table...');
    await client.query(`
      ALTER TABLE goi_dich_vu_chi_tiet 
      ADD COLUMN IF NOT EXISTS thoi_luong_phut INTEGER;
    `);
    
    // Set default value for existing linked services from the parent dich_vu's thoi_luong_phut (or default 45)
    await client.query(`
      UPDATE goi_dich_vu_chi_tiet gdvct
      SET thoi_luong_phut = COALESCE(dv.thoi_luong_phut, 45)
      FROM dich_vu dv
      WHERE gdvct.dich_vu_id = dv.id AND gdvct.thoi_luong_phut IS NULL;
    `);

    await client.query('COMMIT');
    console.log('✓ Successfully added and initialized thoi_luong_phut in goi_dich_vu_chi_tiet!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to add column:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
