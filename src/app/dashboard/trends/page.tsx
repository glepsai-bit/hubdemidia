// Tendências captadas (pautas). Lista por relevância ("fora da curva"); ações: usar/descartar.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { CollectTrendsButton } from "@/components/CollectTrendsButton";
import { Badge, Card, EmptyState, PageHeader, TextLink } from "@/components/ui";
import { dismissTrend, markTrendUsed } from "./actions";

// Tonalidade do selo de score conforme o sinal de "fora da curva".
function scoreTone(score: number): "danger" | "warning" | "neutral" {
  if (score >= 70) return "danger";
  if (score >= 40) return "warning";
  return "neutral";
}

export default async function TrendsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, role } = session.user;
  const isAdmin = role === "ADMIN";
  const siteIds = await accessibleSiteIds(userId, role);

  const trends = await db.trend.findMany({
    where: {
      status: "NEW",
      OR: [{ siteId: null }, { siteId: { in: siteIds } }],
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { site: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tendências"
        description={'Pautas captadas das suas fontes, ordenadas pelo sinal de "fora da curva".'}
      >
        {isAdmin && <CollectTrendsButton />}
      </PageHeader>

      {trends.length === 0 ? (
        <EmptyState>
          Nenhuma pauta nova. <TextLink href="/dashboard/sources">Cadastrar fontes</TextLink>{" "}
          {isAdmin && "e clicar em “Coletar agora”."}
        </EmptyState>
      ) : (
        <Card className="divide-y divide-neutral-100">
          {trends.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={scoreTone(t.score)}>{t.score}</Badge>
                  {t.url ? (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium text-neutral-900 hover:text-brand"
                    >
                      {t.title}
                    </a>
                  ) : (
                    <span className="truncate font-medium text-neutral-900">{t.title}</span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-neutral-500">
                  {t.type} · {t.site?.name ?? "Global"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href="/dashboard/generate"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-brand hover:bg-neutral-100"
                >
                  Gerar conteúdo
                </Link>
                <form action={markTrendUsed.bind(null, t.id)}>
                  <button className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50">
                    Marcar usada
                  </button>
                </form>
                <form action={dismissTrend.bind(null, t.id)}>
                  <button className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100">
                    Descartar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
