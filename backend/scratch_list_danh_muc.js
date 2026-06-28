const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT id, ten_danh_muc, loai_danh_muc FROM danh_muc_dich_vu
    `);
    console.log("CATEGORIES:");
    console.log(res.rows.map(r => ({ id: String(r.id), ten_danh_muc: r.ten_danh_muc, loai_danh_muc: r.loai_danh_muc })));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
