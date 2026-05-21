// Busca e parsing de feeds RSS (inclui o RSS do Google Trends, com namespace ht:).
import { XMLParser } from "fast-xml-parser";
import type { FeedItem } from "./types";

const TIMEOUT_MS = 8000;

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
});

/** Converte tráfego do Google Trends ("20.000+", "1.500+") em número. */
function parseTraffic(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const digits = String(raw).replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Baixa um feed RSS e devolve os itens normalizados. Lança em caso de falha de rede/parse. */
export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (HubDeMidia bot)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar o feed.`);
    const xml = await res.text();
    const doc = parser.parse(xml);

    const channel = doc?.rss?.channel ?? doc?.feed; // RSS ou Atom
    const rawItems = asArray(channel?.item ?? channel?.entry);

    return rawItems
      .map((item: Record<string, unknown>): FeedItem => {
        const title = String(item?.title ?? "").trim();
        // link pode ser string (RSS) ou objeto (Atom). Em Google Trends usamos a primeira news item.
        const newsItems = asArray<Record<string, unknown>>(
          item["ht:news_item"] as Record<string, unknown> | Record<string, unknown>[] | undefined,
        );
        const newsUrl = newsItems[0]?.["ht:news_item_url"];
        const link = item.link ?? newsUrl;
        const url = typeof link === "string" ? link.trim() : undefined;
        const traffic = parseTraffic(item["ht:approx_traffic"]);
        return { title, url, traffic };
      })
      .filter((it: FeedItem) => it.title.length > 0);
  } finally {
    clearTimeout(timer);
  }
}
