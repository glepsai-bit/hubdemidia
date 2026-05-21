// Lista de sites + criação (admin). Editores veem só os sites permitidos (sem criar).
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { SiteForm } from "@/components/SiteForm";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { createSite } from "./actions";

const SITE_STATUS: Record<string, { label: string; tone: "success" | "neutral" | "warning" }> = {
  LIVE: { label: "No ar", tone: "success" },
  DRAFT: { label: "Rascunho", tone: "neutral" },
  PAUSED: { label: "Pausado", tone: "warning" },
};

export default async function SitesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, role } = session.user;
  const isAdmin = role === "ADMIN";
  const siteIds = await accessibleSiteIds(userId, role);
  const sites = await db.site.findMany({
    where: { id: { in: siteIds } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Sites" description="Cada site é servido pelo hub e roteado por domínio." />

      {sites.length === 0 ? (
        <EmptyState>Nenhum site ainda.</EmptyState>
      ) : (
        <Card className="divide-y divide-neutral-100">
          {sites.map((site) => {
            const status = SITE_STATUS[site.status] ?? { label: site.status, tone: "neutral" as const };
            return (
              <Link
                key={site.id}
                href={`/dashboard/sites/${site.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-neutral-900">{site.name}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="mt-0.5 truncate text-sm text-neutral-500">
                    {site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · {site._count.posts} posts
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-brand">Abrir →</span>
              </Link>
            );
          })}
        </Card>
      )}

      {isAdmin && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Novo site</h2>
          <SiteForm action={createSite} submitLabel="Criar site" />
        </Card>
      )}
    </div>
  );
}
