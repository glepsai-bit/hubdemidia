// Fontes de monitoramento: globais (admin) + por site (RBAC).
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { SourceForm } from "@/components/SourceForm";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
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
      <PageHeader
        title="Fontes de monitoramento"
        description="Cadastre feeds (Google Trends, RSS, sites) globais ou por site. As tendências são captadas a partir deles."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Fontes cadastradas</h2>
        {sources.length === 0 ? (
          <EmptyState>Nenhuma fonte ainda. Adicione a primeira abaixo.</EmptyState>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-neutral-900">{s.label || s.url}</span>
                    <Badge tone={s.active ? "success" : "warning"}>{s.active ? "Ativa" : "Inativa"}</Badge>
                  </div>
                  <div className="mt-0.5 truncate text-sm text-neutral-500">
                    {TYPE_LABEL[s.type]} · {s.site?.name ?? "Global"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={toggleSource.bind(null, s.id)}>
                    <button className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
                      {s.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deleteSource.bind(null, s.id)}>
                    <button className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Nova fonte</h2>
        <SourceForm sites={sites} isAdmin={isAdmin} />
      </Card>
    </div>
  );
}
