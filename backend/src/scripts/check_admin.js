const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'd:/VLTT/VLTT/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient();

async function run() {
  try {
    const email = 'admin@physioflow.vn';
    console.log("Querying raw SQL...");
    const rawRes = await pool.query('SELECT id, ho_ten, email FROM nguoi_dung WHERE email = $1', [email]);
    console.log("Raw SQL results:", rawRes.rows);

    console.log("Querying Prisma...");
    const prismaRes = await prisma.nguoi_dung.findFirst({
      where: { email: email }
    });
    console.log("Prisma results:", prismaRes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

run();
