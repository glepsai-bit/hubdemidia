// Piloto automático: coleta tendências, escolhe as bombásticas, busca a matéria,
// reescreve com IA, publica e pinga IndexNow. Fire-and-forget — nunca lança.

/** Helper para Server Components evitarem chamar Date.now() direto (regra react-hooks/purity). */
export function sinceHoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
import type { AiProvider } from "@prisma/client";
import { db } from "@/lib/db";
import { generatePostForSite } from "@/lib/ai/generate";
import { extractArticle } from "@/lib/scraper";
import { collectActiveSources } from "@/lib/trends";
import { pingIndexNow } from "@/lib/seo/indexnow";
import { slugify } from "@/lib/validation";
import type { ProviderName } from "@/lib/ai/types";

interface RunSummary {
  siteId: string;
  siteName: string;
  posted: number;
  errors: number;
  details: string[];
}

const PROVIDER_TO_NAME: Record<AiProvider, ProviderName> = {
  CLAUDE: "claude",
  OPENAI: "openai",
  GROK: "grok",
};

/** Resolve usuário cujas chaves BYOK serão usadas pelo autopilot. */
async function resolveAutopilotUserId(): Promise<string | null> {
  const email = process.env.AUTOMATION_USER_EMAIL;
  if (email) {
    const u = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (u) return u.id;
  }
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

/** Tenta atribuir uma editoria via matching de slug/nome com keyword no título. */
async function pickCategoryForTitle(siteId: string, title: string): Promise<string | null> {
  const cats = await db.category.findMany({
    where: { siteId },
    select: { id: true, name: true, slug: true },
  });
  if (cats.length === 0) return null;
  const hay = title.toLowerCase();
  // Match por slug/nome da editoria que aparecer no título.
  for (const c of cats) {
    const tokens = [c.slug, c.name.toLowerCase(), slugify(c.name)];
    if (tokens.some((t) => t && hay.includes(t))) return c.id;
  }
  return null;
}

/** Roda 1 ciclo de autopilot para 1 site. Cada falha individual é capturada. */
export async function runAutopilotForSite(siteId: string): Promise<RunSummary> {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      autopilotEnabled: true,
      autopilotPostsPerRun: true,
      autopilotFeaturedThreshold: true,
      autopilotProvider: true,
      autopilotWithImage: true,
      autopilotImageStrategy: true,
      autopilotAutoCategory: true,
    },
  });
  const sum: RunSummary = {
    siteId,
    siteName: site?.name ?? "?",
    posted: 0,
    errors: 0,
    details: [],
  };
  if (!site || !site.autopilotEnabled) {
    sum.details.push("autopilot desativado");
    return sum;
  }

  const userId = await resolveAutopilotUserId();
  if (!userId) {
    sum.errors++;
    sum.details.push("nenhum admin disponível p/ BYOK");
    return sum;
  }

  // Pega top N pautas NEW (deste site OU globais, ordenadas por score).
  const trends = await db.trend.findMany({
    where: { status: "NEW", OR: [{ siteId }, { siteId: null }] },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: site.autopilotPostsPerRun,
  });
  if (trends.length === 0) {
    sum.details.push("nenhuma pauta NEW disponível");
    return sum;
  }

  const provider = PROVIDER_TO_NAME[site.autopilotProvider];
  const postedSlugs: string[] = [];

  for (const trend of trends) {
    try {
      // 1) Tenta puxar o artigo de origem; senão usa só o título.
      const scraped = trend.url ? await extractArticle(trend.url) : {};
      const rawText = scraped.text
        ? `${scraped.title ?? trend.title}\n\n${scraped.text}`
        : `${trend.title}${scraped.description ? `\n\n${scraped.description}` : ""}`;

      // Se o material ainda está muito curto, não dá pra IA reescrever bem — pula.
      if (rawText.length < 80) {
        sum.errors++;
        sum.details.push(`pauta "${trend.title}" sem conteúdo suficiente`);
        await db.trend.update({ where: { id: trend.id }, data: { status: "DISMISSED" } });
        continue;
      }

      // 2) Roda o pipeline (Leitor → SEO → Imagem) e publica direto.
      // Estratégia de imagem: respeita o site config; se a flag withImage estiver off,
      // força NONE pra economizar tempo/custo independentemente da estratégia.
      const effectiveStrategy = site.autopilotWithImage ? site.autopilotImageStrategy : "NONE";
      const result = await generatePostForSite({
        userId,
        siteId,
        provider,
        raw: rawText,
        sourceUrl: trend.url ?? undefined,
        imageStrategy: effectiveStrategy,
        autoPublish: true,
      });

      // 3) Pós-processamento: featured se score alto + categoria automática.
      const patch: { featured?: boolean; categoryId?: string | null } = {};
      if (trend.score >= site.autopilotFeaturedThreshold) patch.featured = true;
      if (site.autopilotAutoCategory) {
        const catId = await pickCategoryForTitle(siteId, result.title);
        if (catId) patch.categoryId = catId;
      }
      if (Object.keys(patch).length > 0) {
        await db.post.update({ where: { id: result.postId }, data: patch });
      }

      // 4) Marca pauta como usada.
      await db.trend.update({ where: { id: trend.id }, data: { status: "USED" } });

      // 5) Coleta slug pra IndexNow.
      const post = await db.post.findUnique({
        where: { id: result.postId },
        select: { slug: true },
      });
      if (post) postedSlugs.push(post.slug);

      sum.posted++;
      sum.details.push(`✔ ${result.title}`);
    } catch (e) {
      sum.errors++;
      const msg = e instanceof Error ? e.message : String(e);
      sum.details.push(`✗ "${trend.title.slice(0, 60)}": ${msg.slice(0, 120)}`);
    }
  }

  // 6) IndexNow (Bing/Yandex) — silencioso.
  if (postedSlugs.length > 0) {
    await pingIndexNow({ slug: site.slug, domain: site.domain }, postedSlugs);
  }

  return sum;
}

interface OverallSummary {
  sitesProcessed: number;
  posted: number;
  errors: number;
  perSite: RunSummary[];
}

/** Roda 1 ciclo: para cada site com autopilot ativo, processa.
 *  Não filtra por status — sites em DRAFT podem gerar rascunhos pro humano publicar depois. */
export async function runAutopilotAll(opts: { collectFirst?: boolean } = {}): Promise<OverallSummary> {
  // Antes de processar, opcionalmente coleta novas pautas de TODAS as fontes ativas.
  let collectedNew = 0;
  if (opts.collectFirst !== false) {
    try {
      const summary = await collectActiveSources({});
      collectedNew = summary.inserted;
    } catch {
      // segue mesmo se coleta falhar parcialmente
    }
  }

  // IMPORTANTE: não filtramos por status="LIVE" — site DRAFT pode acumular rascunhos.
  const enabledSites = await db.site.findMany({
    where: { autopilotEnabled: true },
    select: { id: true, name: true, status: true },
  });

  // Pautas pendentes disponíveis (NEW) — global + por site.
  const pendingTrends = await db.trend.count({ where: { status: "NEW" } });

  // Log de execução agregada.
  const run = await db.autopilotRun.create({
    data: { status: "RUNNING" },
  });
  const t0 = Date.now();

  const overall: OverallSummary = {
    sitesProcessed: 0,
    posted: 0,
    errors: 0,
    perSite: [],
  };

  for (const s of enabledSites) {
    const r = await runAutopilotForSite(s.id);
    overall.perSite.push(r);
    overall.posted += r.posted;
    overall.errors += r.errors;
    overall.sitesProcessed++;
  }

  const status =
    enabledSites.length === 0
      ? "SKIPPED"
      : overall.errors === 0
        ? "OK"
        : overall.posted > 0
          ? "OK"
          : "ERROR";

  // Notes mais informativas: sites ativos, pautas, e detalhe por site.
  const perSiteNotes = overall.perSite
    .map((s) => `${s.siteName}: +${s.posted}/✗${s.errors}`)
    .join(" · ");
  const headline =
    enabledSites.length === 0
      ? "0 sites com autopilot ativo"
      : `${enabledSites.length} site(s) · ${pendingTrends} pautas NEW · +${collectedNew} novas na coleta`;
  const notes = `${headline}${perSiteNotes ? ` · ${perSiteNotes}` : ""}`.slice(0, 480);

  await db.autopilotRun.update({
    where: { id: run.id },
    data: {
      status,
      finishedAt: new Date(),
      posted: overall.posted,
      errors: overall.errors,
      durationMs: Date.now() - t0,
      notes,
    },
  });

  return overall;
}
