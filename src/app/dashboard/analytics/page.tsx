// Analytics por site: acessos totais, no período, por dia e posts mais vistos.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { getSiteStats } from "@/lib/analytics";
import { Card, EmptyState, PageHeader, Stat, TextLink, cn } from "@/components/ui";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, role } = session.user;
  const siteIds = await accessibleSiteIds(userId, role);
  const sites = await db.site.findMany({
    where: { id: { in: siteIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" />
        <EmptyState>
          Nenhum site disponível. <TextLink href="/dashboard/sites">Ver sites</TextLink>.
        </EmptyState>
      </div>
    );
  }

  const { siteId } = await searchParams;
  const current = sites.find((s) => s.id === siteId) ?? sites[0];
  const stats = await getSiteStats(current.id, 30);
  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Acessos first-party às páginas públicas, por site.">
        <nav className="flex flex-wrap gap-1.5">
          {sites.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/analytics?siteId=${s.id}`}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                s.id === current.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50",
              )}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Acessos (total)" value={stats.totalAllTime} />
        <Stat label={`Acessos (${stats.days}d)`} value={stats.totalPeriod} />
        <Stat label="Posts no top 5" value={stats.topPosts.length} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">
          Acessos por dia (últimos {stats.days} dias)
        </h2>
        {stats.byDay.length === 0 ? (
          <EmptyState>Sem dados ainda. Os acessos às páginas públicas aparecem aqui.</EmptyState>
        ) : (
          <Card className="space-y-1.5 p-5">
            {stats.byDay.map((d) => (
              <div key={d.day} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-neutral-500">{d.day}</span>
                <span
                  className="inline-block h-4 rounded bg-brand/80"
                  style={{ width: `${(d.count / maxDay) * 100}%`, minWidth: "4px" }}
                />
                <span className="text-neutral-700">{d.count}</span>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Posts mais vistos ({stats.days}d)</h2>
        {stats.topPosts.length === 0 ? (
          <EmptyState>Sem visualizações de posts ainda.</EmptyState>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {stats.topPosts.map((p) => (
              <div key={p.postId} className="flex items-center justify-between gap-4 p-4">
                <Link
                  href={`/dashboard/sites/${current.id}/posts/${p.postId}`}
                  className="truncate font-medium text-neutral-900 hover:text-brand"
                >
                  {p.title}
                </Link>
                <span className="shrink-0 text-sm text-neutral-500">{p.count} acessos</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
