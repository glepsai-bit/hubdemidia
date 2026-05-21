// Visão geral do painel: resumo + atalho para gerenciar os sites (respeita RBAC).
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";

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
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sites" value={sites.length} />
        <Stat label="Posts publicados" value={publishedCount} />
        <Stat label="Seu papel" value={role} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Seus sites</h2>
          <Link
            href="/dashboard/sites"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Gerenciar →
          </Link>
        </div>

        {sites.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Nenhum site ainda.{" "}
            {role === "ADMIN" && (
              <Link href="/dashboard/sites" className="text-blue-600 hover:underline">
                Criar o primeiro
              </Link>
            )}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sites.map((site) => (
              <li key={site.id}>
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400"
                >
                  <div className="font-medium">{site.name}</div>
                  <div className="text-sm text-gray-500">
                    {site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · {site.status} ·{" "}
                    {site._count.posts} posts
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
