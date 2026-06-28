const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT id, ten_dich_vu, danh_muc_id, loai_dich_vu FROM dich_vu
    `);
    console.log("SERVICES:");
    console.log(res.rows.map(r => ({ id: r.id, ten_dich_vu: r.ten_dich_vu, danh_muc_id: String(r.danh_muc_id), loai_dich_vu: r.loai_dich_vu })));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
