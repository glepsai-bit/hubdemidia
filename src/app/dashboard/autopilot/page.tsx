// Monitor global do Piloto Automático — últimas execuções + status do cron.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader, Stat, TextLink } from "@/components/ui";
import { sinceHoursAgo } from "@/lib/autopilot";

export default async function AutopilotMonitorPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <div className="text-sm text-neutral-500">Acesso restrito a administradores.</div>;
  }

  const since24h = sinceHoursAgo(24);
  const [runs, enabledSites, totalPosts24h] = await Promise.all([
    db.autopilotRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    db.site.findMany({
      where: { autopilotEnabled: true },
      select: { id: true, name: true, slug: true, autopilotProvider: true, autopilotPostsPerRun: true },
    }),
    db.post.count({
      where: { createdByAi: true, publishedAt: { gte: since24h } },
    }),
  ]);
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cronOn = process.env.AUTOPILOT_ENABLED === "true";
  const intervalMin = process.env.AUTOPILOT_INTERVAL_MINUTES ?? "120";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Piloto Automático"
        description="Coleta + IA + publicação em ciclos. Painel global de todas as execuções."
      >
        <Badge tone={cronOn ? "success" : "warning"}>
          {cronOn ? `Cron ON · ${intervalMin}min` : "Cron OFF"}
        </Badge>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sites com autopilot" value={enabledSites.length} />
        <Stat label="Posts IA (24h)" value={totalPosts24h} />
        <Stat label="Últimas execuções" value={runs.length} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Sites com autopilot ativo</h2>
        {enabledSites.length === 0 ? (
          <EmptyState>
            Nenhum site com autopilot ativado.{" "}
            <TextLink href="/dashboard/sites">Ative em um site</TextLink>.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {enabledSites.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-neutral-900">{s.name}</div>
                  <div className="text-sm text-neutral-500">
                    {s.autopilotProvider} · {s.autopilotPostsPerRun} por ciclo
                  </div>
                </div>
                <Link
                  href={`/dashboard/sites/${s.id}/autopilot`}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-neutral-900"
                >
                  Configurar
                </Link>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Últimas execuções</h2>
        {runs.length === 0 ? (
          <EmptyState>Sem execuções registradas ainda.</EmptyState>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {runs.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        r.status === "OK"
                          ? "success"
                          : r.status === "ERROR"
                            ? "danger"
                            : r.status === "RUNNING"
                              ? "info"
                              : "neutral"
                      }
                    >
                      {r.status}
                    </Badge>
                    <span className="text-sm text-neutral-700">
                      {fmt.format(r.startedAt)}
                    </span>
                    {r.durationMs != null && (
                      <span className="text-xs text-neutral-500">
                        ({(r.durationMs / 1000).toFixed(1)}s)
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-neutral-500">
                    +{r.posted} publicados · {r.errors} erros
                  </div>
                  {r.notes && (
                    <div className="mt-1 truncate text-xs text-neutral-500">{r.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
