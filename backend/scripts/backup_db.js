const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care'
});

async function backupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database office_care...');
    
    const backupDir = path.join(__dirname, '..', '..', 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sqlFilePath = path.join(backupDir, `physioflow_backup_${timestamp}.sql`);
    const jsonFilePath = path.join(backupDir, `physioflow_backup_${timestamp}.json`);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables:`, tables.join(', '));

    let sqlContent = `-- ==========================================\n`;
    sqlContent += `-- PhysioFlow PostgreSQL Database Backup\n`;
    sqlContent += `-- Created: ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: office_care\n`;
    sqlContent += `-- ==========================================\n\n`;
    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET lock_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n`;
    sqlContent += `SET standard_conforming_strings = on;\n\n`;

    const fullDumpJson = {};

    for (const table of tables) {
      const dataRes = await client.query(`SELECT * FROM "${table}"`);
      const rows = dataRes.rows;
      fullDumpJson[table] = rows;

      sqlContent += `-- ------------------------------------------\n`;
      sqlContent += `-- Table: ${table} (${rows.length} rows)\n`;
      sqlContent += `-- ------------------------------------------\n`;

      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const colListStr = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const valStrs = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO "${table}" (${colListStr}) VALUES (${valStrs.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
      }
      sqlContent += `\n`;
    }

    fs.writeFileSync(sqlFilePath, sqlContent, 'utf-8');
    fs.writeFileSync(jsonFilePath, JSON.stringify(fullDumpJson, null, 2), 'utf-8');

    console.log(`\n✅ Backup successfully generated!`);
    console.log(`📄 SQL Dump: ${sqlFilePath}`);
    console.log(`📦 JSON Dump: ${jsonFilePath}`);

  } catch (error) {
    console.error('❌ Error creating backup:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

backupDatabase();
