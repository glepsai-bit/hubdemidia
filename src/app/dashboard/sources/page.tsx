// Fontes de monitoramento: globais (admin) + por site (RBAC). Tela básica.
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { SourceForm } from "@/components/SourceForm";
import { deleteSource, toggleSource } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  GOOGLE_TRENDS: "Google Trends",
  RSS: "RSS",
  WEBSITE: "Site",
};

export default async function SourcesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, role } = session.user;
  const isAdmin = role === "ADMIN";
  const siteIds = await accessibleSiteIds(userId, role);

  const [sources, sites] = await Promise.all([
    db.source.findMany({
      where: { OR: [{ siteId: null }, { siteId: { in: siteIds } }] },
      orderBy: { createdAt: "desc" },
      include: { site: { select: { name: true } } },
    }),
    db.site.findMany({
      where: { id: { in: siteIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Fontes de monitoramento</h1>
        <p className="text-sm text-gray-500">
          Cadastre feeds (Google Trends, RSS, sites) globais ou por site. As tendências são captadas a
          partir deles.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Fontes cadastradas</h2>
        {sources.length === 0 ? (
          <p className="text-gray-500">Nenhuma fonte ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {sources.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.label || s.url}</div>
                  <div className="truncate text-sm text-gray-500">
                    {TYPE_LABEL[s.type]} · {s.site?.name ?? "Global"} · {s.active ? "ativa" : "inativa"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <form action={toggleSource.bind(null, s.id)}>
                    <button className="text-blue-600 hover:underline">
                      {s.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deleteSource.bind(null, s.id)}>
                    <button className="text-red-600 hover:underline">Excluir</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Nova fonte</h2>
        <SourceForm sites={sites} isAdmin={isAdmin} />
      </section>
    </div>
  );
}
