import prisma from '../src/config/prisma';

async function main() {
  const users = await prisma.nguoi_dung.findMany({
    select: { id: true, ho_ten: true, vai_tro_id: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);
