const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT 
          conname AS constraint_name, 
          pg_get_constraintdef(c.oid) AS constraint_definition
      FROM 
          pg_constraint c 
      JOIN 
          pg_class t ON c.conrelid = t.oid 
      WHERE 
          t.relname = 'lich_dat';
    `);
    console.log('--- Constraints on Table lich_dat ---');
    res.rows.forEach(row => {
      console.log(`Constraint: ${row.constraint_name}`);
      console.log(`Definition: ${row.constraint_definition}`);
      console.log('------------------------------------');
    });

    console.log('\n--- Checking overlap indices / constraints in pg_index ---');
    const indexRes = await pool.query(`
      SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
      FROM
          pg_indexes
      WHERE
          tablename = 'lich_dat';
    `);
    indexRes.rows.forEach(row => {
      console.log(`Index: ${row.indexname}`);
      console.log(`Definition: ${row.indexdef}`);
      console.log('------------------------------------');
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
