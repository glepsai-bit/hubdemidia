// Coleta de tendências: lê as fontes ativas, pontua o "fora da curva" e grava pautas novas (sem duplicar).
import type { Source, SourceType } from "@prisma/client";
import { db } from "@/lib/db";
import { fetchFeed } from "./rss";
import type { CollectSummary, FeedItem, TrendCandidate } from "./types";

export type { CollectSummary } from "./types";

/**
 * Pontuação "fora da curva":
 * - Google Trends: usa o tráfego aproximado (normalizado em 0-100; trends já são, por definição, picos).
 * - RSS/site: novidade + posição no feed (itens no topo tendem a ser mais recentes/relevantes).
 */
function scoreItem(type: SourceType, item: FeedItem, index: number): number {
  if (type === "GOOGLE_TRENDS" && item.traffic) {
    // 20.000 → ~80; 100.000+ → 100. Escala log-ish simples.
    return Math.min(100, Math.round((Math.log10(item.traffic) - 2) * 33));
  }
  // RSS/WEBSITE: topo do feed pontua mais alto.
  return Math.max(10, 90 - index * 6);
}

/** Coleta os itens de uma fonte e devolve candidatos pontuados. */
export async function collectFromSource(source: Source): Promise<TrendCandidate[]> {
  const items = await fetchFeed(source.url);
  return items.slice(0, 25).map((item, i) => ({
    siteId: source.siteId,
    sourceId: source.id,
    title: item.title,
    url: item.url,
    type: source.type,
    score: scoreItem(source.type, item, i),
  }));
}

/**
 * Coleta todas as fontes ativas (ou as de um site/global), grava pautas novas e devolve um resumo.
 * Dedup: não regrava uma pauta com o mesmo título já existente para o mesmo escopo (site/global).
 */
export async function collectActiveSources(opts: { siteId?: string | null } = {}): Promise<CollectSummary> {
  const where = opts.siteId === undefined ? { active: true } : { active: true, siteId: opts.siteId };
  const sources = await db.source.findMany({ where });

  const summary: CollectSummary = { sources: sources.length, fetched: 0, inserted: 0, errors: [] };
  const candidates: TrendCandidate[] = [];

  for (const source of sources) {
    try {
      const found = await collectFromSource(source);
      summary.fetched += found.length;
      candidates.push(...found);
    } catch (e) {
      summary.errors.push({
        sourceId: source.id,
        message: e instanceof Error ? e.message : "Falha ao coletar a fonte.",
      });
    }
  }

  if (candidates.length === 0) return summary;

  // Dedup dentro do lote (por escopo + título, case-insensitive).
  const byKey = new Map<string, TrendCandidate>();
  for (const c of candidates) {
    const key = `${c.siteId ?? "global"}::${c.title.toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, c);
  }
  const unique = [...byKey.values()];

  // Dedup contra o que já existe no banco.
  const titles = unique.map((c) => c.title);
  const existing = await db.trend.findMany({
    where: { title: { in: titles } },
    select: { siteId: true, title: true },
  });
  const existingKeys = new Set(existing.map((t) => `${t.siteId ?? "global"}::${t.title.toLowerCase()}`));

  const toInsert = unique.filter(
    (c) => !existingKeys.has(`${c.siteId ?? "global"}::${c.title.toLowerCase()}`),
  );

  if (toInsert.length > 0) {
    const res = await db.trend.createMany({
      data: toInsert.map((c) => ({
        siteId: c.siteId,
        sourceId: c.sourceId,
        title: c.title,
        url: c.url ?? null,
        type: c.type,
        score: c.score,
      })),
    });
    summary.inserted = res.count;
  }

  return summary;
}
