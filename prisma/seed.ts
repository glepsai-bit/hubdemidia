// Seed inicial: cria um usuário ADMIN para o primeiro acesso ao painel.
// Defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente; há defaults só para dev.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
