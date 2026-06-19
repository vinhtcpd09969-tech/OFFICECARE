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
    const lines = sqlContent.split('\n');
    console.log(`Loaded ${lines.length} lines. Executing statements...`);

    let statementCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip comments, empty lines, and psql slash commands
      if (!line || line.startsWith('--') || line.startsWith('\\')) {
        continue;
      }

      try {
        await client.query(line);
        statementCount++;
      } catch (err) {
        errorCount++;
        console.error(`Error executing line ${i + 1}:`);
        console.error(`SQL: ${line}`);
        console.error(`Error: ${err.message}`);
      }
    }

    console.log(`\nRestore finished.`);
    console.log(`Successfully executed: ${statementCount} statements.`);
    console.log(`Failed: ${errorCount} statements.`);

    // Re-enable constraints
    await client.query("SET session_replication_role = 'origin';");
  } catch (err) {
    console.error('Fatal error during restore:', err);
  } finally {
    await client.end();
  }
}

main();
