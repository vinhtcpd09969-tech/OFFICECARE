import prisma from '../config/prisma';
import { pool } from '../config/db';

async function run() {
  try {
    const email = 'admin@physioflow.vn';
    console.log("Querying raw SQL...");
    const rawRes = await pool.query('SELECT id, ho_ten, email FROM nguoi_dung WHERE email = $1', [email]);
    console.log("Raw SQL results:", rawRes.rows);

    console.log("Querying Prisma findFirst...");
    const prismaRes = await prisma.nguoi_dung.findFirst({
      where: { email: email }
    });
    console.log("Prisma findFirst results:", prismaRes);

    console.log("Querying Prisma findMany (all users)...");
    const allUsers = await prisma.nguoi_dung.findMany({
      select: { id: true, ho_ten: true, email: true }
    });
    console.log("All Prisma users count:", allUsers.length);
    console.log("All Prisma users:", allUsers);
  } catch (err) {
    console.error("Error in diagnostics:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
