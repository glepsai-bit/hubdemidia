// Feed RSS 2.0 das últimas 50 matérias publicadas.
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";
import { absoluteUrl, siteOrigin } from "@/lib/seo/metadata";

export const revalidate = 600;

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c,
  );
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) return new Response("Site não encontrado", { status: 404 });

  const siteRef = { slug: site.slug, domain: site.domain };
  const posts = await db.post.findMany({
    where: { siteId: site.id, status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }],
    take: 50,
    include: { category: { select: { name: true } } },
  });

  const origin = siteOrigin(siteRef);
  const buildDate = new Date().toUTCString();
  const imageXml = site.logoUrl
    ? `    <image>
      <url>${xmlEscape(site.logoUrl)}</url>
      <title>${cdata(site.name)}</title>
      <link>${xmlEscape(origin)}</link>
    </image>\n`
    : "";

  const itemsXml = posts
    .map((p) => {
      const link = absoluteUrl(siteRef, `/${p.slug}`);
      const pub = (p.publishedAt ?? p.createdAt).toUTCString();
      return `    <item>
      <title>${cdata(p.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${pub}</pubDate>
      ${p.category ? `<category>${cdata(p.category.name)}</category>` : ""}
      ${p.authorName ? `<author>${cdata(p.authorName)}</author>` : ""}
      <description>${cdata(p.excerpt ?? p.title)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(site.name)}</title>
    <link>${xmlEscape(origin)}</link>
    <description>${cdata(site.description ?? site.name)}</description>
    <language>${xmlEscape(site.language)}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${xmlEscape(`${origin}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${imageXml}${itemsXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
