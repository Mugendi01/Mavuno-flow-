import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const farm = await prisma.farm.findFirst({
    include: {
      enterprises: true,
      categories: true,
      members: { include: { user: true } },
    },
  });

  console.log("FARM ID:", farm?.id);
  console.log("FARM SLUG:", farm?.slug);
  console.log("FARM NAME:", farm?.name);
  console.log("ENTERPRISES:", farm?.enterprises.map((e) => ({ id: e.id, name: e.name })));
  console.log("CATEGORIES COUNT:", farm?.categories.length);
  const rawCols = await prisma.$queryRawUnsafe('PRAGMA table_info("Farm")');
  console.log("FARM COLUMNS:", rawCols.map(c => c.name));

  const users = await prisma.user.findMany();
  console.log("USERS:", users.map(u => ({ id: u.id, email: u.email, fullName: u.fullName })));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
