const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Updating loai_dich_vu in table 'dich_vu'...");
    
    // Update 'chinh' to 'ky_thuat'
    const res1 = await client.query(`
      UPDATE dich_vu 
      SET loai_dich_vu = 'ky_thuat' 
      WHERE loai_dich_vu = 'chinh'
    `);
    console.log(`Updated ${res1.rowCount} rows from 'chinh' to 'ky_thuat'.`);

    // Update 'bo_sung' and 'ho_tro' to 'don_le'
    const res2 = await client.query(`
      UPDATE dich_vu 
      SET loai_dich_vu = 'don_le' 
      WHERE loai_dich_vu = 'bo_sung' OR loai_dich_vu = 'ho_tro'
    `);
    console.log(`Updated ${res2.rowCount} rows from 'bo_sung'/'ho_tro' to 'don_le'.`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
