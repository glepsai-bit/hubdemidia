// Visão geral do painel: resumo + atalho para gerenciar os sites (respeita RBAC).
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { Badge, Card, EmptyState, PageHeader, Stat, TextLink, buttonClass } from "@/components/ui";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrador", EDITOR: "Editor" };
const SITE_STATUS: Record<string, { label: string; tone: "success" | "neutral" | "warning" }> = {
  LIVE: { label: "No ar", tone: "success" },
  DRAFT: { label: "Rascunho", tone: "neutral" },
  PAUSED: { label: "Pausado", tone: "warning" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // proxy já redireciona; guarda extra

  const { id: userId, role } = session.user;
  const siteIds = await accessibleSiteIds(userId, role);

  const [sites, publishedCount] = await Promise.all([
    db.site.findMany({
      where: { id: { in: siteIds } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { posts: true } } },
    }),
    db.post.count({ where: { siteId: { in: siteIds }, status: "PUBLISHED" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Visão geral" description="Resumo dos seus sites e conteúdo no hub.">
        {role === "ADMIN" && (
          <Link href="/dashboard/sites" className={buttonClass({ size: "sm" })}>
            Novo site
          </Link>
        )}
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sites" value={sites.length} />
        <Stat label="Posts publicados" value={publishedCount} />
        <Stat label="Seu papel" value={ROLE_LABEL[role] ?? role} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Seus sites</h2>
          <TextLink href="/dashboard/sites">Gerenciar →</TextLink>
        </div>

        {sites.length === 0 ? (
          <EmptyState>
            Nenhum site ainda.{" "}
            {role === "ADMIN" && <TextLink href="/dashboard/sites">Criar o primeiro</TextLink>}
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sites.map((site) => {
              const status = SITE_STATUS[site.status] ?? { label: site.status, tone: "neutral" as const };
              return (
                <li key={site.id}>
                  <Link href={`/dashboard/sites/${site.id}`} className="group block">
                    <Card className="p-4 transition-colors group-hover:border-neutral-300">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-neutral-900">{site.name}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <div className="mt-1 truncate text-sm text-neutral-500">
                        {site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · {site._count.posts} posts
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
