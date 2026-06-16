// robots.txt por tenant — referencia o sitemap do próprio domínio.
import { resolveSiteByHost } from "@/lib/tenant";
import { siteOrigin } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) return new Response("User-agent: *\nDisallow: /\n", { status: 200 });

  const origin = siteOrigin({ slug: site.slug, domain: site.domain });
  const body = `User-agent: *
Allow: /
Disallow: /busca
Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
