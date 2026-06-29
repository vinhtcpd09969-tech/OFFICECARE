import { pool } from './config/db';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    await pool.query(
      `UPDATE nguoi_dung SET mat_khau_hash = $1 WHERE email IN ('admin@officecare.com', 'letan@officecare.com')`,
      [hash]
    );

    console.log('Updated passwords successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

updatePasswords();
