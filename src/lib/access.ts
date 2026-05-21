// Helpers de controle de acesso (RBAC).
// ADMIN vê tudo; EDITOR só os sites em UserSiteAccess.
import { db } from "@/lib/db";

/** Retorna os IDs de sites que o usuário pode acessar. ADMIN => todos. */
export async function accessibleSiteIds(userId: string, role: string): Promise<string[]> {
  if (role === "ADMIN") {
    const sites = await db.site.findMany({ select: { id: true } });
    return sites.map((s) => s.id);
  }
  const access = await db.userSiteAccess.findMany({
    where: { userId },
    select: { siteId: true },
  });
  return access.map((a) => a.siteId);
}

/** True se o usuário pode acessar o site informado. */
export async function canAccessSite(
  userId: string,
  role: string,
  siteId: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const found = await db.userSiteAccess.findUnique({
    where: { userId_siteId: { userId, siteId } },
  });
  return !!found;
}
