import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

async function createSecondDoctor() {
  console.log('--- CREATING SECOND DOCTOR ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra xem đã có bác sĩ thứ hai chưa
    const { rows: existing } = await client.query("SELECT id FROM nguoi_dung WHERE email = 'bs.trieu@officecare.vn'");
    if (existing.length > 0) {
      console.log('Second doctor already exists.');
      await client.query('COMMIT');
      return;
    }

    // 2. Thêm người dùng mới
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('123456', salt);
    
    const { rows: newUser } = await client.query(`
      INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email) 
      VALUES ($1, $2, $3, 4, 'hoat_dong', TRUE) RETURNING id
    `, ['BS Nguyễn Văn Triệu', 'bs.trieu@officecare.vn', hash]);
    
    const doctorUserId = newUser[0].id;

    // 3. Thêm chuyên gia y tế
    await client.query(`
      INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem, trang_thai) 
      VALUES ($1, 'NV-9999', 'Bác sĩ chuyên khoa II', 5, 'hoat_dong')
    `, [doctorUserId]);

    // 4. Thêm ca trực cho bác sĩ thứ hai này vào ngày hôm nay 30/05/2026 (Ca Chiều: 11:30 - 20:00)
    // Và các ngày khác để tránh lỗi trống ca trực
    const days = [
      '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31',
      '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07'
    ];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const isMorning = i % 2 === 0;
      const gio_bat_dau = isMorning ? '07:00' : '11:30';
      const gio_ket_thuc = isMorning ? '15:30' : '20:00';
      
      await client.query(`
        INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai)
        VALUES ($1, $2, $3, $4, 'hoat_dong')
      `, [doctorUserId, day, gio_bat_dau, gio_ket_thuc]);
    }

    await client.query('COMMIT');
    console.log('Second doctor (BS Nguyễn Văn Triệu) created successfully with schedules.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating second doctor:', error);
  } finally {
    client.release();
  }
}

createSecondDoctor().then(() => process.exit(0));
