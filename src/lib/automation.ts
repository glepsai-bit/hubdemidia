// Autorização para endpoints de automação (n8n / cron).
// Aceita header `x-cron-secret` == CRON_SECRET OU uma sessão de admin.
import { timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";

/** Compara dois segredos em tempo constante (evita timing attack). */
function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual exige buffers do mesmo tamanho; tamanhos diferentes => não confere.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function isAuthorizedAutomation(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret");
  if (secret && provided && secretsMatch(provided, secret)) return true;

  const session = await auth();
  return session?.user?.role === "ADMIN";
}
