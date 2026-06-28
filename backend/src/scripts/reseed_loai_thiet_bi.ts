import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function reseed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Re-seeding loai_thiet_bi to contain only 6 parent categories...');
    
    // 1. Truncate table and clear old types
    // Since thiet_bi_y_te has a foreign key to loai_thiet_bi, we can set loai_thiet_bi_id to NULL first.
    await client.query('UPDATE thiet_bi_y_te SET loai_thiet_bi_id = NULL');
    await client.query('DELETE FROM loai_thiet_bi');

    // 2. Insert 6 parent categories
    const categories = [
      { ten_loai: 'Tác động điện', nhom_thiet_bi: 'dien' },
      { ten_loai: 'Tác động nhiệt', nhom_thiet_bi: 'nhiet' },
      { ten_loai: 'Tác động cơ học / sóng', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Giường trị liệu', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Thiết bị đặc biệt', nhom_thiet_bi: 'thiet_bi_dac_biet' },
      { ten_loai: 'Dụng cụ & Thiết bị khác', nhom_thiet_bi: 'khac' }
    ];

    const insertedCats: Record<string, number> = {};
    for (const cat of categories) {
      const { rows } = await client.query(`
        INSERT INTO loai_thiet_bi (ten_loai, nhom_thiet_bi)
        VALUES ($1, $2)
        RETURNING id;
      `, [cat.ten_loai, cat.nhom_thiet_bi]);
      insertedCats[cat.nhom_thiet_bi] = rows[0].id;
    }
    console.log('✓ Inserted 6 categories:', insertedCats);

    // 3. Map all machines in thiet_bi_y_te to these 6 categories based on their names/old types
    const { rows: equipment } = await client.query('SELECT id, ten_thiet_bi, loai_thiet_bi FROM thiet_bi_y_te');
    for (const eq of equipment) {
      const nameLower = (eq.ten_thiet_bi || '').toLowerCase();
      const oldLoaiLower = (eq.loai_thiet_bi || '').toLowerCase();
      
      let targetGroup = 'khac';
      
      // Checking for Bed group
      if (
        nameLower.includes('giường trị liệu') || oldLoaiLower.includes('giường trị liệu') ||
        nameLower.includes('giường massage') || oldLoaiLower.includes('giường massage') ||
        nameLower.includes('giường điều trị') || oldLoaiLower.includes('giường điều trị') ||
        nameLower.includes('giường nắn chỉnh') || oldLoaiLower.includes('giường nắn chỉnh') ||
        eq.ten_thiet_bi === 'e 03' || eq.ten_thiet_bi === 'e 04'
      ) {
        targetGroup = 'giuong_tri_lieu';
      }
      // Checking for Special group
      else if (
        nameLower.includes('kéo giãn') || oldLoaiLower.includes('kéo giãn') ||
        nameLower.includes('từ trường') || oldLoaiLower.includes('từ trường') ||
        nameLower.includes('triton') || nameLower.includes('cổ')
      ) {
        targetGroup = 'thiet_bi_dac_biet';
      }
      // Checking for Heat group
      else if (
        nameLower.includes('hồng ngoại') || oldLoaiLower.includes('hồng ngoại') ||
        nameLower.includes('laser') || oldLoaiLower.includes('laser')
      ) {
        targetGroup = 'nhiet';
      }
      // Checking for Electrical group
      else if (
        nameLower.includes('xung') || oldLoaiLower.includes('xung') ||
        nameLower.includes('điện') || oldLoaiLower.includes('điện')
      ) {
        targetGroup = 'dien';
      }
      // Checking for Wave/Mechanical group
      else if (
        nameLower.includes('siêu âm') || oldLoaiLower.includes('siêu âm') ||
        nameLower.includes('sóng ngắn') || oldLoaiLower.includes('sóng ngắn') ||
        nameLower.includes('shockwave') || oldLoaiLower.includes('shockwave') ||
        nameLower.includes('nén ép') || oldLoaiLower.includes('nén ép')
      ) {
        targetGroup = 'co_hoc';
      }
      
      const targetCatId = insertedCats[targetGroup];
      const targetCatName = categories.find(c => c.nhom_thiet_bi === targetGroup)!.ten_loai;

      await client.query(`
        UPDATE thiet_bi_y_te
        SET loai_thiet_bi_id = $1, loai_thiet_bi = $2
        WHERE id = $3;
      `, [targetCatId, targetCatName, eq.id]);
    }

    console.log('✓ Successfully mapped all equipment to 6 categories.');
    await client.query('COMMIT');
    console.log('Reseed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reseed failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

reseed();
