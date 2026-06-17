// Seed em CommonJS — roda em runtime de produção (sem tsx).
// Use: ADMIN_EMAIL=... ADMIN_PASSWORD=... node prisma/seed.cjs
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@hubdemidia.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name: "Administrador", role: "ADMIN", passwordHash },
  });

  console.log(`✔ Admin pronto: ${admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  ⚠ Senha padrão de DEV: "${password}" — troque em produção.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
