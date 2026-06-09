import { pool } from '../config/db';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Dropping redundant columns from phong table...');
    await client.query(`
      ALTER TABLE phong DROP COLUMN IF EXISTS thiet_bi;
      ALTER TABLE phong DROP COLUMN IF EXISTS loai_dich_vu_ho_tro;
    `);
    console.log('✅ Columns dropped successfully.');

    console.log('2. Resetting phong table (Truncating)...');
    await client.query('TRUNCATE TABLE phong CASCADE');

    console.log('3. Inserting new clinical rooms and virtual beds...');
    const rooms = [
      // Tang 1
      { ten: 'Phòng khám lâm sàng 1', ma: 'P101', loai: 'kham_benh', tang: 'Tang 1' },
      { ten: 'Phòng khám lâm sàng 2', ma: 'P102', loai: 'kham_benh', tang: 'Tang 1' },
      // Tang 2 - Kho & Giuong phong chung
      { ten: 'Kho Thiết bị Trung tâm', ma: 'P200', loai: 'kho_thiet_bi', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 1 (Phòng Chung)', ma: 'P201', loai: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 2 (Phòng Chung)', ma: 'P202', loai: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 3 (Phòng Chung)', ma: 'P203', loai: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 4 (Phòng Chung)', ma: 'P204', loai: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 5 (Phòng Chung)', ma: 'P205', loai: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 6 (Phòng Chung)', ma: 'P206', loai: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      // Tang 2 - Giuong VIP
      { ten: 'Giường Trị liệu 7 (Kéo giãn DTS - VIP)', ma: 'P211', loai: 'phong_may_co_dinh', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 8 (Kéo giãn cổ - VIP)', ma: 'P212', loai: 'phong_may_co_dinh', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 9 (Từ trường SIS - VIP)', ma: 'P213', loai: 'phong_may_co_dinh', tang: 'Tang 2' },
      { ten: 'Giường Trị liệu 10 (Trị liệu Thường - VIP)', ma: 'P214', loai: 'phong_may_co_dinh', tang: 'Tang 2' },
      // Tang 3 - Tap PHCN
      { ten: 'Phòng tập Phục hồi chức năng lớn', ma: 'P301', loai: 'phong_tap_phcn', tang: 'Tang 3' }
    ];

    const insertedRoomsMap = new Map<string, number>();

    for (const r of rooms) {
      const { rows } = await client.query(
        `INSERT INTO phong (ten_phong, ma_phong, loai_phong, tang, trang_thai)
         VALUES ($1, $2, $3, $4, 'san_sang') RETURNING id`,
        [r.ten, r.ma, r.loai, r.tang]
      );
      insertedRoomsMap.set(r.ma, Number(rows[0].id));
      console.log(`- Inserted room/bed: [${r.ma}] "${r.ten}" with ID ${rows[0].id}`);
    }

    console.log('4. Re-mapping equipment in thiet_bi_y_te...');
    
    // Reset all current locations
    await client.query('UPDATE thiet_bi_y_te SET phong_id_hien_tai = NULL');

    const equipmentMapping = [
      // Stationary equipment mapped to specific beds
      { ma: 'EQP-DTS01', roomMa: 'P211' }, // Giường 7 DTS
      { ma: 'EQP-CST01', roomMa: 'P212' }, // Giường 8 Kéo giãn cổ
      { ma: 'EQP-SIS01', roomMa: 'P213' }  // Giường 9 SIS Magnet
    ];

    for (const mapping of equipmentMapping) {
      const roomId = insertedRoomsMap.get(mapping.roomMa);
      if (roomId) {
        await client.query(
          'UPDATE thiet_bi_y_te SET phong_id_hien_tai = $1, co_the_di_chuyen = false WHERE ma_thiet_bi = $2',
          [roomId, mapping.ma]
        );
        console.log(`- Mapped stationary device [${mapping.ma}] to bed [${mapping.roomMa}] (ID: ${roomId})`);
      }
    }

    // Mobile equipment mapped to Central Storage (P200)
    const storeRoomId = insertedRoomsMap.get('P200');
    if (storeRoomId) {
      await client.query(
        `UPDATE thiet_bi_y_te 
         SET phong_id_hien_tai = $1, co_the_di_chuyen = true 
         WHERE ma_thiet_bi NOT IN ('EQP-DTS01', 'EQP-CST01', 'EQP-SIS01')`,
        [storeRoomId]
      );
      console.log(`- Mapped all mobile devices to Central Storage [P200] (ID: ${storeRoomId})`);
    }

    await client.query('COMMIT');
    console.log('🎉 Resource configuration database migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during resource reconfiguration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
