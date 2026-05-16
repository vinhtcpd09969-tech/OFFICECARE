import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' });

async function resetRoles() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE nguoi_dung CASCADE');
    await client.query('TRUNCATE TABLE vai_tro CASCADE');
    await client.query('ALTER SEQUENCE vai_tro_id_seq RESTART WITH 1');
    await client.query(`
      INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi) VALUES 
      ('khach_hang', 'Khách hàng'),
      ('le_tan', 'Lễ tân'),
      ('ky_thuat_vien', 'Kỹ thuật viên'),
      ('bac_si', 'Bác sĩ'),
      ('admin', 'Quản trị viên')
    `);
    await client.query('COMMIT');
    console.log('Roles reset successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
resetRoles();
