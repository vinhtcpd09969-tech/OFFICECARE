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
    console.log('Restructuring loai_thiet_bi to contain specific equipment names...');

    // 1. Unlink thiet_bi_y_te loai_thiet_bi_id to avoid FK constraint issues during truncate
    await client.query('UPDATE thiet_bi_y_te SET loai_thiet_bi_id = NULL');
    await client.query('DELETE FROM loai_thiet_bi');

    // 2. Define specific types
    const specificTypes = [
      { ten_loai: 'Máy siêu âm điều trị', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Máy sóng xung kích Shockwave', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Máy Laser công suất cao', nhom_thiet_bi: 'nhiet' },
      { ten_loai: 'Máy kéo giãn cột sống tự động', nhom_thiet_bi: 'thiet_bi_dac_biet' },
      { ten_loai: 'Giường nắn chỉnh xương khớp chuyên dụng', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Giường trị liệu bằng tay', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Đèn hồng ngoại', nhom_thiet_bi: 'nhiet' },
      { ten_loai: 'Máy điện xung', nhom_thiet_bi: 'dien' },
      { ten_loai: 'Máy nén ép', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Máy từ trường', nhom_thiet_bi: 'thiet_bi_dac_biet' },
      { ten_loai: 'Thước đo khớp', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Bóng tập', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Dây kháng lực', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Búa phản xạ', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Thảm tập', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Gậy gỗ', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Máy tập đa năng', nhom_thiet_bi: 'khac' }
    ];

    const inserted: Record<string, number> = {};
    for (const t of specificTypes) {
      const { rows } = await client.query(`
        INSERT INTO loai_thiet_bi (ten_loai, nhom_thiet_bi)
        VALUES ($1, $2)
        RETURNING id;
      `, [t.ten_loai, t.nhom_thiet_bi]);
      inserted[t.ten_loai] = rows[0].id;
    }
    console.log('✓ Inserted specific equipment types.');

    // 3. Map all machines in thiet_bi_y_te
    const { rows: machines } = await client.query('SELECT id, ten_thiet_bi FROM thiet_bi_y_te');
    for (const m of machines) {
      const name = (m.ten_thiet_bi || '').toLowerCase();
      let matchType = 'Dụng cụ & Thiết bị khác';

      if (name.includes('siêu âm') || name.includes('ultra')) {
        matchType = 'Máy siêu âm điều trị';
      } else if (name.includes('xung kích') || name.includes('shockwave') || name.includes('shock')) {
        matchType = 'Máy sóng xung kích Shockwave';
      } else if (name.includes('laser')) {
        matchType = 'Máy Laser công suất cao';
      } else if (name.includes('kéo giãn cột sống') || name.includes('triton')) {
        matchType = 'Máy kéo giãn cột sống tự động';
      } else if (name.includes('nắn chỉnh') || name.includes('chiro')) {
        matchType = 'Giường nắn chỉnh xương khớp chuyên dụng';
      } else if (name.includes('trị liệu bằng tay') || name.includes('e 03') || name.includes('e 04')) {
        matchType = 'Giường trị liệu bằng tay';
      } else if (name.includes('đá nóng') || name.includes('đèn hồng ngoại') || name.includes('hong ngoai')) {
        matchType = 'Đèn hồng ngoại';
      } else if (name.includes('điện xung') || name.includes('điện phân')) {
        matchType = 'Máy điện xung';
      } else if (name.includes('nén ép') || name.includes('áp lực hơi')) {
        matchType = 'Máy nén ép';
      } else if (name.includes('từ trường') || name.includes('sis')) {
        matchType = 'Máy từ trường';
      } else if (name.includes('thước đo')) {
        matchType = 'Thước đo khớp';
      } else if (name.includes('bóng tập') || name.includes('bóng yoga') || name.includes('yoga') || name.includes('ball')) {
        matchType = 'Bóng tập';
      } else if (name.includes('dây kháng lực') || name.includes('theraband') || name.includes('band')) {
        matchType = 'Dây kháng lực';
      } else if (name.includes('búa phản xạ') || name.includes('hammer')) {
        matchType = 'Búa phản xạ';
      } else if (name.includes('thảm tập') || name.includes('mat')) {
        matchType = 'Thảm tập';
      } else if (name.includes('gậy gỗ') || name.includes('stick')) {
        matchType = 'Gậy gỗ';
      } else if (name.includes('đa năng') || name.includes('multi')) {
        matchType = 'Máy tập đa năng';
      }

      const ltbId = inserted[matchType];
      if (ltbId) {
        await client.query(`
          UPDATE thiet_bi_y_te
          SET loai_thiet_bi_id = $1, loai_thiet_bi = $2
          WHERE id = $3
        `, [ltbId, matchType, m.id]);
        console.log(`Mapped "${m.ten_thiet_bi}" -> "${matchType}"`);
      } else {
        console.warn(`Could not find ID for type: ${matchType}`);
      }
    }

    await client.query('COMMIT');
    console.log('Successfully re-mapped all equipment specific types!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to map specific types:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
