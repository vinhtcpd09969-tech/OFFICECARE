import { pool } from '../src/config/db';
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  const targetFile = path.join(__dirname, '../../database/office_care_backup_new.sql');
  const writeStream = fs.createWriteStream(targetFile);

  try {
    writeStream.write(`-- OfficeCare Database Backup\n`);
    writeStream.write(`-- Exported on: ${new Date().toISOString()}\n\n`);
    writeStream.write(`SET session_replication_role = 'replica';\n\n`);

    // Get all user tables in dependency order
    const tableOrder = [
      'vai_tro',
      'nguoi_dung',
      'ho_so_chuyen_gia',
      'khach_hang',
      'goi_dich_vu',
      'phong_lam_viec',
      'thiet_bi',
      'khuyen_mai_voucher',
      'phac_do_dieu_tri',
      'cuoc_hen',
      'nhat_ky_buoi_dieu_tri',
      'chi_dinh_buoi',
      'hoa_don',
      'giao_dich_thanh_toan',
      'danh_gia',
      'bai_viet',
      'lich_truc_nhan_su',
      'otp_codes',
      'phien_chat_ai',
      'tin_nhan_chat_ai',
      'tam_giu_cho',
      'refresh_tokens'
    ];

    // First write TRUNCATE statements in reverse order
    for (const tableName of [...tableOrder].reverse()) {
      writeStream.write(`TRUNCATE TABLE "${tableName}" CASCADE;\n`);
    }
    writeStream.write(`\n`);

    // Then write INSERTS in proper dependency order
    for (const tableName of tableOrder) {
      console.log(`Exporting table: ${tableName}`);

      writeStream.write(`-- Table: ${tableName}\n`);

      const { rows: columns } = await pool.query(
        `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name=$1 AND table_schema='public'`,
        [tableName]
      );

      const colNames = columns.map(c => c.column_name);
      const colTypeMap = new Map(columns.map(c => [c.column_name, c.udt_name]));

      const { rows: data } = await pool.query(`SELECT * FROM "${tableName}"`);

      if (data.length === 0) {
        writeStream.write(`-- No data for ${tableName}\n\n`);
        continue;
      }

      for (const row of data) {
        const values = colNames.map(col => {
          const val = row[col];
          const udtName = colTypeMap.get(col);

          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "''")}'`;
          }
          if (val instanceof Date) {
            return `'${val.toISOString()}'`;
          }
          if (typeof val === 'bigint') {
            return val.toString();
          }
          if (typeof val === 'boolean') {
            return val ? 'true' : 'false';
          }
          if (Array.isArray(val)) {
            if (val.length === 0) return `ARRAY[]::${udtName === '_text' || udtName === 'text' ? 'text[]' : 'varchar[]'}`;
            return `ARRAY[${val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ')}]::text[]`;
          }
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          return val;
        });

        const insertQuery = `INSERT INTO "${tableName}" (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        writeStream.write(insertQuery);
      }
      writeStream.write(`\n`);
    }

    writeStream.write(`SET session_replication_role = 'origin';\n`);
    console.log(`✅ Exported database successfully to ${targetFile}`);
  } catch (err) {
    console.error('❌ Error during database backup:', err);
  } finally {
    writeStream.end();
    await pool.end();
  }
}

backupDatabase();
