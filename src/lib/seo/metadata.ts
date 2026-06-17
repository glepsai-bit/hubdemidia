// Helpers de SEO: gera URL base do site, metadata default e por matéria/categoria.
import type { Metadata } from "next";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";
const ROOT_HOST = ROOT_DOMAIN.split(":")[0];
const ROOT_PORT = ROOT_DOMAIN.includes(":") ? `:${ROOT_DOMAIN.split(":")[1]}` : "";

export interface SiteForSeo {
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  tagline?: string | null;
  language?: string;
  logoUrl?: string | null;
}

/** Origin público do site: usa domínio custom se houver; senão slug.ROOT_DOMAIN. */
export function siteOrigin(site: { slug: string; domain: string | null }): string {
  // Em dev e prod sem TLS configurado o esquema é http. Em prod, https é o padrão.
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  if (site.domain) return `${proto}://${site.domain}`;
  return `${proto}://${site.slug}.${ROOT_HOST}${ROOT_PORT}`;
}

export function absoluteUrl(site: { slug: string; domain: string | null }, path = "/"): string {
  const base = siteOrigin(site);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Metadata default para a home do portal. */
export function siteMetadata(site: SiteForSeo): Metadata {
  const title = site.tagline ? `${site.name} — ${site.tagline}` : site.name;
  const description = site.description ?? `Portal de notícias ${site.name}.`;
  const url = siteOrigin({ slug: site.slug, domain: site.domain });
  const images = site.logoUrl
    ? [{ url: site.logoUrl, alt: site.name, width: 1200, height: 630 }]
    : undefined;
  return {
    title: { default: title, template: `%s — ${site.name}` },
    description,
    metadataBase: new URL(url),
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: site.name,
      locale: (site.language ?? "pt-BR").replace("-", "_"),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((i) => i.url),
    },
    alternates: {
      canonical: "/",
      types: { "application/rss+xml": "/feed.xml" },
    },
    ...(process.env.GSC_VERIFICATION
      ? { verification: { google: process.env.GSC_VERIFICATION } }
      : {}),
  };
}

/** Metadata da página de matéria. */
export function articleMetadata(
  site: SiteForSeo,
  post: {
    title: string;
    excerpt: string | null;
    imageUrl: string | null;
    heroAlt: string | null;
    slug: string;
    publishedAt: Date | null;
    authorName: string | null;
  },
): Metadata {
  const url = absoluteUrl({ slug: site.slug, domain: site.domain }, `/${post.slug}`);
  const description = post.excerpt ?? `Leia em ${site.name}.`;
  const images = post.imageUrl
    ? [{ url: post.imageUrl, alt: post.heroAlt ?? post.title, width: 1200, height: 630 }]
    : undefined;
  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      siteName: site.name,
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: images?.map((i) => i.url),
    },
    alternates: { canonical: `/${post.slug}` },
  };
}

export function categoryMetadata(
  site: SiteForSeo,
  category: { name: string; slug: string; description: string | null },
  page = 1,
): Metadata {
  const title = page > 1 ? `${category.name} — página ${page}` : category.name;
  const description =
    category.description ?? `Notícias da editoria ${category.name} em ${site.name}.`;
  const canonical = page > 1 ? `/c/${category.slug}?page=${page}` : `/c/${category.slug}`;
  return {
    title,
    description,
    openGraph: { type: "website", title, description, siteName: site.name },
    alternates: { canonical },
  };
}
