import { pool } from '../config/db';

async function migrate() {
  console.log('Bắt đầu cập nhật cấu trúc bảng dich_vu...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Thêm cột loai_dich_vu nếu chưa tồn tại
    await client.query(`
      ALTER TABLE dich_vu 
      ADD COLUMN IF NOT EXISTS loai_dich_vu VARCHAR(20) NOT NULL DEFAULT 'chinh'
    `);
    
    console.log('Thêm cột loai_dich_vu thành công!');

    // Cập nhật một số dữ liệu mẫu nếu cần
    // Ví dụ: có thể có các dịch vụ như chườm nóng, đắp parafin thì cập nhật thành 'bo_sung'
    await client.query(`
      UPDATE dich_vu 
      SET loai_dich_vu = 'bo_sung' 
      WHERE ten_dich_vu ILIKE '%chườm%' 
         OR ten_dich_vu ILIKE '%đắp%'
         OR ten_dich_vu ILIKE '%paraffin%'
    `);

    await client.query('COMMIT');
    console.log('Di chuyển dữ liệu (Migration) hoàn thành thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi chạy migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
