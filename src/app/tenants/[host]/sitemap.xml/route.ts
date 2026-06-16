// Sitemap por tenant: capa + categorias + matérias publicadas.
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";
import { absoluteUrl, siteOrigin } from "@/lib/seo/metadata";

export const revalidate = 600; // 10 min

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c,
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) return new Response("Site não encontrado", { status: 404 });

  const siteRef = { slug: site.slug, domain: site.domain };
  const [categories, posts] = await Promise.all([
    db.category.findMany({ where: { siteId: site.id }, select: { slug: true, createdAt: true } }),
    db.post.findMany({
      where: { siteId: site.id, status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    }),
  ]);

  const urls: { loc: string; lastmod?: string; priority?: string }[] = [];
  urls.push({ loc: siteOrigin(siteRef), lastmod: new Date().toISOString(), priority: "1.0" });
  for (const c of categories) {
    urls.push({
      loc: absoluteUrl(siteRef, `/c/${c.slug}`),
      lastmod: c.createdAt.toISOString(),
      priority: "0.8",
    });
  }
  for (const p of posts) {
    urls.push({
      loc: absoluteUrl(siteRef, `/${p.slug}`),
      lastmod: (p.updatedAt ?? p.publishedAt ?? new Date()).toISOString(),
      priority: "0.9",
    });
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
          (u.priority ? `    <priority>${u.priority}</priority>\n` : "") +
          "  </url>",
      )
      .join("\n") +
    "\n</urlset>\n";

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
