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
    ALTER TABLE phong ADD COLUMN IF NOT EXISTS suc_chua INTEGER DEFAULT 1;
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
  let sqlContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  
  // Replace the old admin creator UUID in vouchers with our seeded admin ID
  sqlContent = sqlContent.replace(/2bc223ef-02d9-484c-b0ef-b66ec2bdd6ee/g, '00000000-0000-0000-0000-000000000001');

  // Clean up any outdated columns/values from thiet_bi_y_te insert statements in memory
  const lines = sqlContent.split('\n');
  const cleanedLines = lines.map(line => {
    if (line.includes('INSERT INTO "thiet_bi_y_te"')) {
      // Replace the column list
      line = line.replace('"ngay_bao_tri_tiep_theo", ', '').replace('"co_the_di_chuyen", ', '');
      
      const valuesIndex = line.indexOf('VALUES (');
      if (valuesIndex !== -1) {
        const prefix = line.substring(0, valuesIndex + 8);
        const valuesStr = line.substring(valuesIndex + 8).trim().replace(/\);$/, '');
        
        // Parse valuesStr considering single quotes
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < valuesStr.length; i++) {
          const char = valuesStr[i];
          if (char === "'") {
            inQuotes = !inQuotes;
            current += char;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        if (current) {
          values.push(current.trim());
        }
        
        // Remove 11th (index 10: co_the_di_chuyen) and 6th (index 5: ngay_bao_tri_tiep_theo) values
        values.splice(10, 1);
        values.splice(5, 1);
        
        return prefix + values.join(', ') + ');';
      }
    }
    return line;
  });

  const normalizedSql = cleanedLines
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const rawStatements = normalizedSql.split(/;\n/);
  const truncates: string[] = [];
  const insertsAndOthers: string[] = [];

  const skipTables = [
    'nguoi_dung',
    'khach_hang',
    'vai_tro',
    'chuyen_gia_y_te',
    'lich_lam_viec',
    'lich_dat',
    'lich_dieu_tri',
    'buoi_tri_lieu',
    'buoi_tri_lieu_dich_vu'
  ];

  for (let i = 0; i < rawStatements.length; i++) {
    let stmt = rawStatements[i].trim();
    if (!stmt) continue;

    stmt += ';';
    if (stmt.startsWith('\\')) continue;

    const isTruncate = stmt.toUpperCase().startsWith('TRUNCATE');
    const isInsert = stmt.toUpperCase().startsWith('INSERT');

    const matchesSkipTable = skipTables.some(table => stmt.includes(`"${table}"`));

    if (isTruncate) {
      if (matchesSkipTable) {
        continue;
      }
      truncates.push(stmt);
    } else if (isInsert) {
      if (matchesSkipTable) {
        continue;
      }
      insertsAndOthers.push(stmt);
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

const importUsersSeed = async () => {
  console.log('Restoring users and schedules from seed_users.sql...');
  const filePath = path.join(__dirname, 'seed_users.sql');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Users seed file not found at: ${filePath}`);
  }
  const sqlContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  
  const rawStatements = sqlContent.split(/;\n/);
  for (let i = 0; i < rawStatements.length; i++) {
    const stmt = rawStatements[i].trim();
    if (!stmt) continue;
    await pool.query(stmt + ';');
  }
  console.log('✅ Users and schedules seeded successfully.');
};

const updateRoomsBedCapacity = async () => {
  console.log('Configuring rooms bed counts (Phase 2 new model)...');
  // Update standard therapy rooms to have multiple beds
  await pool.query(`
    UPDATE phong SET suc_chua = 3 WHERE ma_phong = 'P201';
    UPDATE phong SET suc_chua = 2 WHERE ma_phong = 'P202';
    UPDATE phong SET suc_chua = 2 WHERE ma_phong = 'P203';
    UPDATE phong SET suc_chua = 2 WHERE ma_phong = 'P204';
    UPDATE phong SET suc_chua = 3 WHERE ma_phong = 'P205';
  `);
  console.log('✅ Rooms bed counts configured.');
};

const assignKtvShifts = async () => {
  console.log('Assigning demo room and bed numbers to KTV shifts...');
  
  // Find therapy rooms
  const { rows: rooms } = await pool.query(
    "SELECT id, ma_phong, suc_chua FROM phong WHERE loai_phong = 'phong_tri_lieu_chuan'"
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
    const bedNo = (i % room.suc_chua) + 1;
    
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

    // 2. Import users seed file first
    await importUsersSeed();

    // 3. Import backup SQL file
    await importBackupData();

    // 4. Reset search path just in case
    await pool.query('SET search_path TO public;');

    // 5. Update rooms bed capacity
    await updateRoomsBedCapacity();

    // 6. Assign some KTV shifts to beds
    await assignKtvShifts();

    console.log('🎉 Seeding successfully completed!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await pool.end();
  }
};

runSeed();
