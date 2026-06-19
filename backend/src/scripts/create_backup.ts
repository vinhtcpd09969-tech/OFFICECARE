import { pool } from '../config/db';
import fs from 'fs';
import path from 'path';

async function main() {
  const backupFilePath = path.join(__dirname, '../../../office_care_backup_new.sql');
  const writeStream = fs.createWriteStream(backupFilePath);

  try {
    console.log('Fetching tables from public schema...');
    // Fetch tables, excluding prisma migrations
    const { rows: tables } = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema='public' 
         AND table_type='BASE TABLE' 
         AND table_name NOT LIKE '_prisma_migrations'
       ORDER BY table_name`
    );

    writeStream.write(`-- Office Care Database Backup\n`);
    writeStream.write(`-- Date: ${new Date().toISOString()}\n\n`);
    writeStream.write(`SET session_replication_role = 'replica';\n\n`); // Disable triggers/FKeys check during inserts

    for (const { table_name } of tables) {
      console.log(`Backing up table: ${table_name}`);
      writeStream.write(`-- Table: ${table_name}\n`);
      writeStream.write(`TRUNCATE TABLE "${table_name}" CASCADE;\n\n`);

      const { rows: columns } = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 AND table_schema='public'`,
        [table_name]
      );

      const colNames = columns.map(c => c.column_name);
      
      const { rows: data } = await pool.query(`SELECT * FROM "${table_name}"`);

      if (data.length === 0) {
        writeStream.write(`-- No data for ${table_name}\n\n`);
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
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          return val;
        });

        const insertQuery = `INSERT INTO "${table_name}" (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        writeStream.write(insertQuery);
      }
      writeStream.write(`\n`);
    }

    writeStream.write(`SET session_replication_role = 'origin';\n`);
    console.log(`Backup completed successfully. Saved at: ${backupFilePath}`);
  } catch (err) {
    console.error('Error creating backup:', err);
  } finally {
    writeStream.end();
    await pool.end();
  }
}

main();
