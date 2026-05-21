// Autorização para endpoints de automação (n8n / cron).
// Aceita header `x-cron-secret` == CRON_SECRET OU uma sessão de admin.
import { auth } from "@/lib/auth";

export async function isAuthorizedAutomation(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret");
  if (secret && provided && provided === secret) return true;

  const session = await auth();
  return session?.user?.role === "ADMIN";
}
