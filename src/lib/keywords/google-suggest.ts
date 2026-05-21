// Provider de keyword research via Google Suggest (autocomplete) — gratuito, sem chave.
// Retorna as buscas reais que as pessoas digitam a partir da semente. Não fornece volume absoluto.
import type { KeywordMetric, KeywordProvider, KeywordResearchOptions } from "./types";

const ENDPOINT = "https://suggestqueries.google.com/complete/search";
const TIMEOUT_MS = 5000;

export const googleSuggestProvider: KeywordProvider = {
  name: "google-suggest",
  async research(seed: string, opts: KeywordResearchOptions = {}): Promise<KeywordMetric[]> {
    const lang = opts.lang ?? "pt-BR";
    const max = opts.max ?? 10;
    const query = seed.trim();
    if (!query) return [];

    const url = `${ENDPOINT}?client=firefox&hl=${encodeURIComponent(lang)}&q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) return [];
      // Formato (client=firefox): ["seed", ["sugestão1", "sugestão2", ...], ...]
      const data = (await res.json()) as [string, string[]];
      const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
      return suggestions
        .slice(0, max)
        .map((kw) => ({ keyword: kw.trim(), source: "google-suggest" as const }))
        .filter((m) => m.keyword.length > 0);
    } catch {
      // Rede indisponível / endpoint mudou → degrada para [] (o index faz fallback).
      return [];
    } finally {
      clearTimeout(timer);
    }
  },
};
