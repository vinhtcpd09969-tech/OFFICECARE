import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

async function createSecondReceptionist() {
  console.log('--- CREATING SECOND RECEPTIONIST ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra xem đã có lễ tân thứ hai chưa
    const { rows: existing } = await client.query("SELECT id FROM nguoi_dung WHERE email = 'letan2@officecare.com'");
    if (existing.length > 0) {
      console.log('Second receptionist already exists.');
      await client.query('COMMIT');
      return;
    }

    // 2. Thêm người dùng mới với vai trò Lễ tân (vai_tro_id = 2)
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('123456', salt);
    
    const { rows: newUser } = await client.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email) 
      VALUES ($1, $2, $3, $4, 2, 'hoat_dong', TRUE) RETURNING id
    `, ['Lễ tân 2', 'letan2@officecare.com', '0901234570', hash]);
    
    console.log('Second receptionist user created successfully.');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating second receptionist:', error);
  } finally {
    client.release();
  }
}

createSecondReceptionist().then(() => process.exit(0));
