// Analytics por site: acessos totais, no período, por dia e posts mais vistos. Tela básica.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { getSiteStats } from "@/lib/analytics";

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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">
          Nenhum site disponível.{" "}
          <Link href="/dashboard/sites" className="text-blue-600 hover:underline">
            Ver sites
          </Link>
          .
        </p>
      </div>
    );
  }

  const { siteId } = await searchParams;
  const current = sites.find((s) => s.id === siteId) ?? sites[0];
  const stats = await getSiteStats(current.id, 30);
  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <nav className="flex flex-wrap gap-2">
          {sites.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/analytics?siteId=${s.id}`}
              className={`rounded-lg border px-3 py-1 text-sm ${
                s.id === current.id
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Acessos (total)" value={stats.totalAllTime} />
        <Stat label={`Acessos (${stats.days}d)`} value={stats.totalPeriod} />
        <Stat label="Posts no top 5" value={stats.topPosts.length} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Acessos por dia (últimos {stats.days} dias)</h2>
        {stats.byDay.length === 0 ? (
          <p className="text-gray-500">Sem dados ainda. Os acessos às páginas públicas aparecem aqui.</p>
        ) : (
          <ul className="space-y-1">
            {stats.byDay.map((d) => (
              <li key={d.day} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-gray-500">{d.day}</span>
                <span
                  className="inline-block h-4 rounded bg-black"
                  style={{ width: `${(d.count / maxDay) * 100}%`, minWidth: "4px" }}
                />
                <span className="text-gray-700">{d.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Posts mais vistos ({stats.days}d)</h2>
        {stats.topPosts.length === 0 ? (
          <p className="text-gray-500">Sem visualizações de posts ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {stats.topPosts.map((p) => (
              <li key={p.postId} className="flex items-center justify-between p-4">
                <Link
                  href={`/dashboard/sites/${current.id}/posts/${p.postId}`}
                  className="truncate font-medium hover:underline"
                >
                  {p.title}
                </Link>
                <span className="shrink-0 text-sm text-gray-500">{p.count} acessos</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
