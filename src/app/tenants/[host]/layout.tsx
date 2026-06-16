// Layout do portal público (tenant). Resolve o site pelo host, injeta o tema
// (CSS var --portal-primary), o JSON-LD raiz e renderiza header/footer editoriais.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSiteByHost } from "@/lib/tenant";
import { listNavCategories } from "@/lib/portal/queries";
import { siteMetadata } from "@/lib/seo/metadata";
import { organizationLd, websiteLd, ldScript } from "@/lib/seo/jsonld";
import { PortalHeader, PortalFooter } from "@/components/portal";

interface Params {
  params: Promise<{ host: string }>;
}

async function loadSite(host: string) {
  return resolveSiteByHost(decodeURIComponent(host));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { host } = await params;
  const site = await loadSite(host);
  if (!site) return { title: "Não encontrado" };
  return siteMetadata({
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    description: site.description,
    tagline: site.tagline,
    language: site.language,
    logoUrl: site.logoUrl,
  });
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const site = await loadSite(host);
  if (!site) notFound();

  const categories = await listNavCategories(site.id);
  const primary = site.primaryColor ?? "#111111";

  const portalSite = {
    id: site.id,
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    description: site.description,
    tagline: site.tagline,
    primaryColor: site.primaryColor,
    logoUrl: site.logoUrl,
  };

  const orgLd = organizationLd({
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    logoUrl: site.logoUrl,
    description: site.description,
  });
  const webLd = websiteLd({
    name: site.name,
    slug: site.slug,
    domain: site.domain,
  });

  return (
    <div
      data-portal
      lang={site.language}
      style={{ ["--portal-primary" as string]: primary }}
      className="min-h-screen bg-white text-neutral-900"
    >
      <PortalHeader site={portalSite} categories={categories} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </main>
      <PortalFooter site={portalSite} categories={categories} />

      {/* JSON-LD raiz */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldScript(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldScript(webLd) }}
      />
    </div>
  );
}
