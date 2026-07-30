const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createBackup() {
  console.log('🔄 Đang khởi tạo sao lưu dữ liệu PostgreSQL...');
  const client = await pool.connect();

  try {
    // 1. Lấy danh sách tất cả các bảng trong schema public
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`📋 Tìm thấy ${tables.length} bảng: ${tables.join(', ')}`);

    const backupData = {};
    let sqlContent = `-- ========================================================\n`;
    sqlContent += `-- SAO LƯU DỮ LIỆU HỆ THỐNG OFFICE CARE / PHYSIOFLOW\n`;
    sqlContent += `-- Thời gian tạo: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`;
    sqlContent += `-- Database: office_care\n`;
    sqlContent += `-- ========================================================\n\n`;

    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET lock_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n`;
    sqlContent += `SET standard_conforming_strings = on;\n`;
    sqlContent += `SET check_function_bodies = false;\n`;
    sqlContent += `SET xmloption = content;\n`;
    sqlContent += `SET client_min_messages = warning;\n`;
    sqlContent += `SET row_security = off;\n\n`;

    // Disable triggers for safe import
    sqlContent += `SET session_replication_role = 'replica';\n\n`;

    for (const table of tables) {
      console.log(`⏳ Đang sao lưu bảng [${table}]...`);
      const res = await client.query(`SELECT * FROM "${table}"`);
      backupData[table] = res.rows;

      if (res.rows.length === 0) {
        sqlContent += `-- Bảng ${table}: 0 dòng\n\n`;
        continue;
      }

      sqlContent += `-- --------------------------------------------------------\n`;
      sqlContent += `-- Dữ liệu bảng: ${table} (${res.rows.length} dòng)\n`;
      sqlContent += `-- --------------------------------------------------------\n`;

      const columnsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      const columns = columnsRes.rows.map(c => c.column_name);

      for (const row of res.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        sqlContent += `INSERT INTO "${table}" ("${columns.join('", "')}") VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlContent += `\n`;
    }

    // Re-enable triggers
    sqlContent += `SET session_replication_role = 'DEFAULT';\n\n`;

    // Format filename timestamp
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    // Target Directories
    const backupDir = path.join(__dirname, '..', 'backup');
    const databaseDir = path.join(__dirname, '..', 'database');

    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });

    const sqlFilePath = path.join(backupDir, `office_care_backup_${timestampStr}.sql`);
    const jsonFilePath = path.join(backupDir, `office_care_backup_${timestampStr}.json`);
    const latestSqlPath = path.join(databaseDir, `office_care_backup_new.sql`);

    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    fs.writeFileSync(jsonFilePath, JSON.stringify(backupData, null, 2), 'utf8');
    fs.writeFileSync(latestSqlPath, sqlContent, 'utf8');

    console.log(`\n✅ SAO LƯU DATABASE THÀNH CÔNG!`);
    console.log(`📁 File SQL backup: ${sqlFilePath}`);
    console.log(`📁 File JSON backup: ${jsonFilePath}`);
    console.log(`📁 File SQL cập nhật: ${latestSqlPath}`);

  } catch (error) {
    console.error('❌ Lỗi khi sao lưu database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createBackup();
