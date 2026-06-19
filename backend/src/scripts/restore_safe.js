const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care'
  });

  try {
    await client.connect();
    console.log('Connected to database. Disabling constraints...');
    await client.query("SET session_replication_role = 'replica';");

    const filePath = path.join(__dirname, '../../../office_care_backup_new.sql');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found at: ${filePath}`);
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Normalize newlines and filter out comment lines
    const normalizedSql = sqlContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
      
    const rawStatements = normalizedSql.split(/;\n/);

    const truncates = [];
    const insertsAndOthers = [];

    for (let i = 0; i < rawStatements.length; i++) {
      let stmt = rawStatements[i].trim();
      if (!stmt) continue;

      stmt += ';';

      if (stmt.startsWith('\\')) {
        continue;
      }

      if (stmt.toUpperCase().startsWith('TRUNCATE')) {
        truncates.push(stmt);
      } else {
        insertsAndOthers.push(stmt);
      }
    }

    console.log(`Parsed ${truncates.length} TRUNCATE statements and ${insertsAndOthers.length} other statements.`);
    
    console.log('Executing all TRUNCATE statements first...');
    for (let i = 0; i < truncates.length; i++) {
      await client.query(truncates[i]);
    }
    console.log('✅ All tables truncated.');

    console.log('Executing all INSERT and config statements...');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < insertsAndOthers.length; i++) {
      const stmt = insertsAndOthers[i];
      try {
        await client.query(stmt);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`\n❌ Error executing statement #${i + 1}:`);
        console.error(`SQL: ${stmt.slice(0, 300)}...`);
        console.error(`Error details:`, err);
      }
    }

    console.log(`\nSafe Restore Finished.`);
    console.log(`Successfully executed: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    await client.query("SET session_replication_role = 'origin';");
  } catch (err) {
    console.error('Fatal error during restore:', err);
  } finally {
    await client.end();
  }
}

main();
