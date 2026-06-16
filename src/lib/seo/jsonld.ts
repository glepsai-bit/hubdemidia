// JSON-LD (schema.org) — melhora distribuição (Google News, Discover, etc.).
import { absoluteUrl, siteOrigin } from "./metadata";

interface SiteRef {
  name: string;
  slug: string;
  domain: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

export function organizationLd(site: SiteRef) {
  const url = siteOrigin(site);
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: site.name,
    url,
    ...(site.logoUrl ? { logo: { "@type": "ImageObject", url: site.logoUrl } } : {}),
    ...(site.description ? { description: site.description } : {}),
  };
}

export function websiteLd(site: SiteRef) {
  const url = siteOrigin(site);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/busca?q={query}`,
      "query-input": "required name=query",
    },
  };
}

export function articleLd(
  site: SiteRef,
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    imageUrl: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    authorName: string | null;
    category?: { name: string } | null;
  },
) {
  const url = absoluteUrl(site, `/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.imageUrl
      ? [{ "@type": "ImageObject", url: post.imageUrl, width: 1200, height: 630 }]
      : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@type": "Organization", name: site.name },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: site.name,
      ...(site.logoUrl ? { logo: { "@type": "ImageObject", url: site.logoUrl } } : {}),
    },
    articleSection: post.category?.name,
  };
}

export function breadcrumbLd(site: SiteRef, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : absoluteUrl(site, item.url),
    })),
  };
}

/** Serializa LD para script tag (escapando </script>). */
export function ldScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
