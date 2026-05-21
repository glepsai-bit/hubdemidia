// Painel inicial — lista os sites que o usuário logado pode acessar (RBAC).
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware já redireciona; guarda extra

  const userId = session.user.id;
  const role = session.user.role;
  const siteIds = await accessibleSiteIds(userId, role);
  const sites = await db.site.findMany({
    where: { id: { in: siteIds } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel HubDeMidia</h1>
          <p className="text-sm text-gray-500">
            {session.user.email} · {role}
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Seus sites</h2>
        {sites.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            Nenhum site ainda. {role === "ADMIN" && "Crie o primeiro para começar."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sites.map((site) => (
              <li key={site.id} className="rounded-lg border border-gray-200 p-4">
                <div className="font-medium">{site.name}</div>
                <div className="text-sm text-gray-500">
                  {site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · {site.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
