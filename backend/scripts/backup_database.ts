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

    // Get all user tables
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('_prisma_migrations')
      ORDER BY table_name;
    `);

    for (const tableRow of tables) {
      const tableName = tableRow.table_name;
      console.log(`Exporting table: ${tableName}`);

      writeStream.write(`-- Table: ${tableName}\n`);
      writeStream.write(`TRUNCATE TABLE "${tableName}" CASCADE;\n\n`);

      const { rows: columns } = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 AND table_schema='public'`,
        [tableName]
      );

      const colNames = columns.map(c => c.column_name);
      const { rows: data } = await pool.query(`SELECT * FROM "${tableName}"`);

      if (data.length === 0) {
        writeStream.write(`-- No data for ${tableName}\n\n`);
        continue;
      }

      for (const row of data) {
        const values = colNames.map(col => {
          const val = row[col];
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
    console.log(`Successfully backed up database to ${targetFile}`);
  } catch (err) {
    console.error('Error during database backup:', err);
  } finally {
    writeStream.end();
    await pool.end();
  }
}

backupDatabase();
