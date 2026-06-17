// Configuração do Piloto Automático por site.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge, Card, PageHeader, Stat, TextLink } from "@/components/ui";
import { AutopilotForm } from "@/components/AutopilotForm";
import { RunAutopilotButton } from "@/components/RunAutopilotButton";
import { sinceHoursAgo } from "@/lib/autopilot";
import { assertSiteAccess } from "../../actions";
import { updateAutopilot } from "./actions";

export default async function SiteAutopilotPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  await assertSiteAccess(siteId);

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      autopilotEnabled: true,
      autopilotPostsPerRun: true,
      autopilotFeaturedThreshold: true,
      autopilotProvider: true,
      autopilotWithImage: true,
      autopilotImageStrategy: true,
      autopilotAutoCategory: true,
    },
  });
  if (!site) notFound();

  const since24h = sinceHoursAgo(24);
  const [activeSources, pendingTrends, postedToday] = await Promise.all([
    db.source.count({
      where: { active: true, OR: [{ siteId }, { siteId: null }] },
    }),
    db.trend.count({
      where: { status: "NEW", OR: [{ siteId }, { siteId: null }] },
    }),
    db.post.count({
      where: { siteId, createdByAi: true, publishedAt: { gte: since24h } },
    }),
  ]);

  const intervalMin = process.env.AUTOPILOT_INTERVAL_MINUTES ?? "120";
  const cronOn = process.env.AUTOPILOT_ENABLED === "true";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <TextLink
          href={`/dashboard/sites/${siteId}`}
          className="text-sm text-neutral-500 no-underline hover:text-neutral-900"
        >
          ← {site.name}
        </TextLink>
        <PageHeader
          title="Piloto Automático"
          description="Coleta tendências, escolhe as bombásticas, reescreve com IA e publica — tudo sozinho, em ciclos."
        >
          <div className="flex items-center gap-2">
            <Badge tone={site.autopilotEnabled ? "success" : "neutral"}>
              {site.autopilotEnabled ? "Ativo" : "Desativado"}
            </Badge>
            <RunAutopilotButton siteId={siteId} />
          </div>
        </PageHeader>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Fontes ativas" value={activeSources} />
        <Stat label="Pautas pendentes" value={pendingTrends} />
        <Stat label="Posts IA (24h)" value={postedToday} />
        <Stat
          label="Cron interno"
          value={cronOn ? `a cada ${intervalMin}min` : "OFF"}
        />
      </section>

      {!cronOn && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          O cron interno está <strong>desligado</strong>. Para rodar 24/7, defina{" "}
          <code className="font-mono">AUTOPILOT_ENABLED=true</code> e{" "}
          <code className="font-mono">AUTOPILOT_INTERVAL_MINUTES=120</code> nas variáveis de ambiente
          do projeto no Easypanel, e reimplante. Você ainda pode usar o botão{" "}
          <strong>Rodar agora</strong> manualmente acima.
        </div>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Configuração</h2>
        <AutopilotForm
          action={updateAutopilot.bind(null, siteId)}
          defaults={{
            enabled: site.autopilotEnabled,
            postsPerRun: site.autopilotPostsPerRun,
            featuredThreshold: site.autopilotFeaturedThreshold,
            provider: site.autopilotProvider,
            withImage: site.autopilotWithImage,
            imageStrategy: site.autopilotImageStrategy,
            autoCategory: site.autopilotAutoCategory,
          }}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 text-base font-semibold text-neutral-900">Como usar</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-700">
          <li>
            Cadastre chave BYOK em <TextLink href="/dashboard/settings">Chaves IA</TextLink>{" "}
            (Claude é recomendado).
          </li>
          <li>
            Cadastre <TextLink href="/dashboard/sources">Fontes</TextLink> ligadas a este site, com{" "}
            <strong>palavras-chave</strong> do tema (ex.: <em>copa, futebol, mundial</em>).
          </li>
          <li>Crie pelo menos 1 Editoria para que o &ldquo;auto-categoria&rdquo; tenha onde encaixar.</li>
          <li>Ative o Piloto acima e <strong>Rodar agora</strong> para validar o ciclo.</li>
          <li>Depois, com cron ligado, ele roda sozinho a cada {intervalMin} min.</li>
        </ol>
      </Card>
    </div>
  );
}
