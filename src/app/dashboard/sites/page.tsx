// Lista de sites + criação (admin). Editores veem só os sites permitidos (sem criar).
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { SiteForm } from "@/components/SiteForm";
import { createSite } from "./actions";

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
      <h1 className="text-2xl font-bold">Sites</h1>

      {sites.length === 0 ? (
        <p className="text-gray-500">Nenhum site ainda.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {sites.map((site) => (
            <li key={site.id} className="flex items-center justify-between p-4">
              <div>
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="font-medium hover:underline"
                >
                  {site.name}
                </Link>
                <div className="text-sm text-gray-500">
                  {site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · {site.status} ·{" "}
                  {site._count.posts} posts
                </div>
              </div>
              <Link
                href={`/dashboard/sites/${site.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Abrir →
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Novo site</h2>
          <SiteForm action={createSite} submitLabel="Criar site" />
        </section>
      )}
    </div>
  );
}
