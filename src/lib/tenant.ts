// Resolução multi-tenant: descobre qual Site responde por um host (domínio ou subdomínio).
// Usado pela renderização pública dos sites.
import { db } from "@/lib/db";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

/**
 * Resolve o Site a partir do host da requisição.
 * - domínio customizado (meusite.com) → busca por Site.domain
 * - subdomínio do root (meusite.localhost:3000) → busca por Site.slug
 */
export async function resolveSiteByHost(host: string) {
  const cleanHost = host.toLowerCase().split(":")[0];

  // domínio customizado
  const byDomain = await db.site.findFirst({
    where: { domain: cleanHost, status: "LIVE" },
  });
  if (byDomain) return byDomain;

  // subdomínio do root
  const rootHost = ROOT_DOMAIN.split(":")[0];
  if (cleanHost.endsWith(`.${rootHost}`)) {
    const slug = cleanHost.replace(`.${rootHost}`, "");
    return db.site.findFirst({ where: { slug, status: "LIVE" } });
  }

  return null;
}
