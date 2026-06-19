const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care'
  });

  try {
    await client.connect();
    console.log('Connected to database. Executing multi-statement with error...');
    await client.query("SELECT 1; SELECT * FROM non_existent_table; SELECT 2;");
    console.log("✅ Success (unexpected!)");
  } catch (err) {
    console.log("❌ Failed (expected!):", err.message);
  } finally {
    await client.end();
  }
}

main();
