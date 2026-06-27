import prisma from '../config/prisma';
import { pool } from '../config/db';

async function run() {
  try {
    const id = '07c067b4-5fd9-4cca-9182-e593ba7a8fdc';
    console.log(`Checking appointment ID ${id} in Postgres via Prisma:`);
    const apptPrisma = await prisma.lich_dat.findUnique({
      where: { id }
    });
    console.log("Prisma findUnique result:", apptPrisma);

    console.log("\nChecking via raw sql query:");
    const rawRes = await pool.query('SELECT * FROM lich_dat WHERE id = $1', [id]);
    console.log("Raw SQL result rows:", rawRes.rows);

    if (rawRes.rows.length === 0) {
      console.log("\nQuerying all appointments in database to see what we have:");
      const allAppts = await pool.query('SELECT id, ma_lich_dat, ho_ten_khach, trang_thai FROM lich_dat LIMIT 10');
      console.log(allAppts.rows);
    }
  } catch (err) {
    console.error("Error checking appointment:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
