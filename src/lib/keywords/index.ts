// Camada de pesquisa de palavras-chave. Combina sementes manuais com a pesquisa real (Google Suggest)
// e, se nada vier (sem rede), extrai termos relevantes do próprio texto como fallback.
import { googleSuggestProvider } from "./google-suggest";
import type { KeywordMetric, KeywordResearchOptions } from "./types";

export type { KeywordMetric } from "./types";

// Stopwords PT-BR (lista enxuta para o fallback de extração).
const STOPWORDS = new Set([
  "a","o","os","as","um","uma","uns","umas","de","do","da","dos","das","e","ou","que","com","sem",
  "por","para","pra","no","na","nos","nas","em","ao","aos","à","às","se","sua","seu","suas","seus",
  "como","mais","mas","já","não","sim","ser","está","são","foi","era","entre","sobre","após","até",
  "isso","este","esta","esse","essa","ele","ela","eles","elas","seu","num","numa","pelo","pela",
]);

/**
 * Pesquisa palavras-chave a partir de uma semente (ex.: o título da matéria), combinando com
 * sementes manuais informadas. Resultado deduplicado e limitado.
 */
export async function researchKeywords(
  seed: string,
  manualSeeds: string[] = [],
  opts: KeywordResearchOptions = {},
): Promise<KeywordMetric[]> {
  const max = opts.max ?? 12;

  const researched = await googleSuggestProvider.research(seed, opts);
  const manual: KeywordMetric[] = manualSeeds
    .map((k) => k.trim())
    .filter(Boolean)
    .map((keyword) => ({ keyword, source: "manual" as const }));

  let combined = dedupe([...manual, ...researched]);

  // Sem rede / sem resultados → extrai do texto base (semente + sementes manuais).
  if (combined.length === 0) {
    const text = [seed, ...manualSeeds].join(" ");
    combined = extractFromText(text).map((keyword) => ({ keyword, source: "fallback" as const }));
  }

  return combined.slice(0, max);
}

/** Conveniência: devolve só as strings de keyword. */
export async function researchKeywordStrings(
  seed: string,
  manualSeeds: string[] = [],
  opts: KeywordResearchOptions = {},
): Promise<string[]> {
  const metrics = await researchKeywords(seed, manualSeeds, opts);
  return metrics.map((m) => m.keyword);
}

function dedupe(list: KeywordMetric[]): KeywordMetric[] {
  const seen = new Set<string>();
  const out: KeywordMetric[] = [];
  for (const m of list) {
    const key = m.keyword.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

/** Extrai termos relevantes de um texto (fallback offline): frequência simples sem stopwords. */
export function extractFromText(text: string, max = 8): string[] {
  const freq = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    const word = raw.trim();
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}
