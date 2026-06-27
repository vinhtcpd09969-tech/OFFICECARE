const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care'
  });
  await client.connect();
  try {
    const res = await client.query('SELECT id, ma_lich_dat, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, bac_si_id FROM lich_dat');
    console.log("lich_dat table contents:");
    console.log(res.rows);

    const res2 = await client.query('SELECT id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai, ky_thuat_vien_id FROM buoi_tri_lieu');
    console.log("buoi_tri_lieu table contents:");
    console.log(res2.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
