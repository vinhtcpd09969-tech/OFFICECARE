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

    let sqlContent = fs.readFileSync(filePath, 'utf8');
    // Filter out psql slash commands
    sqlContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('\\'))
      .join('\n');

    console.log('Executing whole SQL script...');
    await client.query(sqlContent);
    console.log('✅ Executed successfully!');

    await client.query("SET session_replication_role = 'origin';");
  } catch (err) {
    console.error('❌ SQL Execution failed:', err);
  } finally {
    await client.end();
  }
}

main();
