import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration for loai_thiet_bi table...');
    await client.query('BEGIN');

    // 1. Create table loai_thiet_bi
    await client.query(`
      CREATE TABLE IF NOT EXISTS loai_thiet_bi (
        id SERIAL PRIMARY KEY,
        ten_loai VARCHAR(100) NOT NULL UNIQUE,
        nhom_thiet_bi VARCHAR(50) NOT NULL,
        thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created/verified loai_thiet_bi table.');

    // 2. Seed standard types
    const standardTypes = [
      { ten_loai: 'Đèn hồng ngoại', nhom_thiet_bi: 'nhiet' },
      { ten_loai: 'Máy laser', nhom_thiet_bi: 'nhiet' },
      { ten_loai: 'Máy điện xung', nhom_thiet_bi: 'dien' },
      { ten_loai: 'Máy Shockwave', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Máy siêu âm', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Máy nén ép', nhom_thiet_bi: 'co_hoc' },
      { ten_loai: 'Giường trị liệu', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Giường trị liệu bằng tay', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Giường massage', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Giường điều trị', nhom_thiet_bi: 'giuong_tri_lieu' },
      { ten_loai: 'Giường kéo giãn', nhom_thiet_bi: 'thiet_bi_dac_biet' },
      { ten_loai: 'Máy kéo giãn cổ', nhom_thiet_bi: 'thiet_bi_dac_biet' },
      { ten_loai: 'Máy từ trường', nhom_thiet_bi: 'thiet_bi_dac_biet' },
      { ten_loai: 'Thiết bị phòng tập', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Thước đo khớp', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Bóng tập', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Dây kháng lực', nhom_thiet_bi: 'khac' },
      { ten_loai: 'Búa phản xạ', nhom_thiet_bi: 'khac' }
    ];

    for (const type of standardTypes) {
      await client.query(`
        INSERT INTO loai_thiet_bi (ten_loai, nhom_thiet_bi)
        VALUES ($1, $2)
        ON CONFLICT (ten_loai) DO NOTHING;
      `, [type.ten_loai, type.nhom_thiet_bi]);
    }
    console.log('✓ Seeded standard equipment types.');

    // 3. Insert any custom/existing types from thiet_bi_y_te that are not in the standard list
    await client.query(`
      INSERT INTO loai_thiet_bi (ten_loai, nhom_thiet_bi)
      SELECT DISTINCT loai_thiet_bi, 'khac'
      FROM thiet_bi_y_te
      WHERE loai_thiet_bi IS NOT NULL 
        AND loai_thiet_bi NOT IN (SELECT ten_loai FROM loai_thiet_bi)
      ON CONFLICT (ten_loai) DO NOTHING;
    `);
    console.log('✓ Seeded existing custom equipment types.');

    // 4. Add loai_thiet_bi_id foreign key column to thiet_bi_y_te table
    await client.query(`
      ALTER TABLE thiet_bi_y_te 
      ADD COLUMN IF NOT EXISTS loai_thiet_bi_id INTEGER REFERENCES loai_thiet_bi(id) ON DELETE SET NULL;
    `);
    console.log('✓ Added loai_thiet_bi_id column to thiet_bi_y_te table.');

    // 5. Link existing records based on text matching
    await client.query(`
      UPDATE thiet_bi_y_te tb
      SET loai_thiet_bi_id = ltb.id
      FROM loai_thiet_bi ltb
      WHERE tb.loai_thiet_bi_id IS NULL 
        AND (tb.loai_thiet_bi = ltb.ten_loai OR (tb.loai_thiet_bi IS NULL AND ltb.ten_loai = 'Thiết bị phòng tập'));
    `);
    console.log('✓ Linked existing equipment records with their corresponding type IDs.');

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
