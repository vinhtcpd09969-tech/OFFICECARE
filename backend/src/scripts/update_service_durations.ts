import { pool } from '../config/db';

async function updateServiceDurations() {
  console.log('--- UPDATING SERVICE DURATIONS ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updates = [
      { name: 'Giải phóng cơ thắt lưng', duration: 30 },
      { name: 'Cân chỉnh tư thế', duration: 30 },
      { name: 'Kéo giãn cột sống', duration: 15 },
      { name: 'Trị liệu linh hoạt vai', duration: 15 },
      { name: 'Giải phóng cơ căng cứng', duration: 15 },
      { name: 'Massage Chân Phục Hồi', duration: 30 },
      { name: 'Massage Thư Giãn Phục Hồi', duration: 60 },
      { name: 'Trị Liệu Tinh Dầu Thư Giãn', duration: 60 },
      { name: 'Trị liệu kéo giãn', duration: 15 },
      { name: 'Kéo Giãn Toàn Thân Chuyên Sâu', duration: 60 },
      { name: 'Massage Đầu Cổ Vai Gáy', duration: 30 },
      { name: 'Giác Hơi Phục Hồi', duration: 30 },
      { name: 'Hướng dẫn bài tập trị liệu', duration: 15 },
      { name: 'Massage trị liệu cơ sâu', duration: 30 },
      { name: 'Kéo giãn vùng cổ', duration: 15 },
      { name: 'Điện xung giảm đau', duration: 15 },
      { name: 'Nhiệt trị liệu', duration: 15 }
    ];

    for (const item of updates) {
      const { rowCount } = await client.query(
        'UPDATE dich_vu SET thoi_luong_phut = $1 WHERE ten_dich_vu = $2',
        [item.duration, item.name]
      );
      console.log(`Updated service "${item.name}": set to ${item.duration} mins (affected ${rowCount} rows)`);
    }

    await client.query('COMMIT');
    console.log('✅ Service durations updated successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating service durations:', error);
  } finally {
    client.release();
  }
}

updateServiceDurations().then(() => process.exit(0));
