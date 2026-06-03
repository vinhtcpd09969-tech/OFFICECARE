import { pool } from '../config/db';

async function run() {
  try {
    console.log('Connected to Database. Renaming column...');
    await pool.query('ALTER TABLE lich_dat RENAME COLUMN ky_thuat_vien_id TO bac_si_id;');
    console.log('ALTER TABLE lich_dat RENAME COLUMN ky_thuat_vien_id TO bac_si_id SUCCESSFUL!');
  } catch (error) {
    console.error('Error renaming column:', error);
  } finally {
    await pool.end();
  }
}

run();
