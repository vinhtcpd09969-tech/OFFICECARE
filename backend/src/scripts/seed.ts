import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

const alterTables = async () => {
  console.log('Ensure database columns exist...');
  await pool.query(`
    ALTER TABLE phong ADD COLUMN IF NOT EXISTS so_luong_giuong INTEGER DEFAULT 1;
    ALTER TABLE lich_lam_viec ADD COLUMN IF NOT EXISTS phong_id BIGINT;
    ALTER TABLE lich_lam_viec ADD COLUMN IF NOT EXISTS giuong_so INTEGER;
    
    -- Add foreign key constraint if it does not exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_llv_phong' AND table_name = 'lich_lam_viec'
      ) THEN
        ALTER TABLE lich_lam_viec ADD CONSTRAINT fk_llv_phong FOREIGN KEY (phong_id) REFERENCES phong(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);
};

const importBackupData = async () => {
  console.log('Restoring database from office_care_backup_new.sql...');
  const filePath = path.join(__dirname, '../../../office_care_backup_new.sql');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found at: ${filePath}`);
  }
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  
  // Normalize newlines and strip comments before parsing
  const normalizedSql = sqlContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const rawStatements = normalizedSql.split(/;\n/);
  const truncates: string[] = [];
  const insertsAndOthers: string[] = [];

  for (let i = 0; i < rawStatements.length; i++) {
    let stmt = rawStatements[i].trim();
    if (!stmt) continue;

    stmt += ';';
    if (stmt.startsWith('\\')) continue;

    if (stmt.toUpperCase().startsWith('TRUNCATE')) {
      truncates.push(stmt);
    } else {
      insertsAndOthers.push(stmt);
    }
  }

  console.log(`Executing ${truncates.length} TRUNCATE statements...`);
  for (const t of truncates) {
    await pool.query(t);
  }

  console.log(`Executing ${insertsAndOthers.length} INSERT statements...`);
  for (const s of insertsAndOthers) {
    await pool.query(s);
  }
  console.log('✅ Database restored successfully.');
};

const updateRoomsBedCapacity = async () => {
  console.log('Configuring rooms bed counts (Phase 2 new model)...');
  // Update standard therapy rooms to have multiple beds
  await pool.query(`
    UPDATE phong SET so_luong_giuong = 3 WHERE ma_phong = 'P201';
    UPDATE phong SET so_luong_giuong = 2 WHERE ma_phong = 'P202';
    UPDATE phong SET so_luong_giuong = 2 WHERE ma_phong = 'P203';
    UPDATE phong SET so_luong_giuong = 2 WHERE ma_phong = 'P204';
    UPDATE phong SET so_luong_giuong = 3 WHERE ma_phong = 'P205';
  `);
  console.log('✅ Rooms bed counts configured.');
};

const assignKtvShifts = async () => {
  console.log('Assigning demo room and bed numbers to KTV shifts...');
  
  // Find therapy rooms
  const { rows: rooms } = await pool.query(
    "SELECT id, ma_phong, so_luong_giuong FROM phong WHERE loai_phong = 'phong_tri_lieu_chuan'"
  );
  
  if (rooms.length === 0) {
    console.log('No therapy rooms found to assign shifts.');
    return;
  }

  // Find KTV shifts
  const { rows: shifts } = await pool.query(
    "SELECT id, nguoi_dung_id FROM lich_lam_viec WHERE nguoi_dung_id IN ('2be0000a-5ef0-470c-b4fe-aa05b5dff2c9', '86a64a39-4ab8-4114-8612-7704b3609dfe') AND trang_thai = 'hoat_dong'"
  );

  console.log(`Found ${shifts.length} active KTV shifts.`);
  
  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i];
    // Alternate rooms and beds for KTV shifts
    const room = rooms[i % rooms.length];
    const bedNo = (i % room.so_luong_giuong) + 1;
    
    await pool.query(
      "UPDATE lich_lam_viec SET phong_id = $1, giuong_so = $2 WHERE id = $3",
      [room.id, bedNo, shift.id]
    );
  }
  
  console.log('✅ KTV shifts assigned.');
};

const runSeed = async () => {
  try {
    // 1. Run database alter statements
    await alterTables();

    // 2. Import backup SQL file
    await importBackupData();

    // 3. Reset search path just in case
    await pool.query('SET search_path TO public;');

    // 4. Update rooms bed capacity
    await updateRoomsBedCapacity();

    // 5. Assign some KTV shifts to beds
    await assignKtvShifts();

    console.log('🎉 Seeding successfully completed!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await pool.end();
  }
};

runSeed();
