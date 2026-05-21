// Contratos da camada de monitoramento de tendências.
import type { SourceType } from "@prisma/client";

/** Item bruto extraído de um feed (antes de virar pauta/Trend). */
export interface FeedItem {
  title: string;
  url?: string;
  /** Tráfego aproximado (Google Trends), quando houver. */
  traffic?: number;
}

/** Pauta candidata, já pontuada, pronta para virar um registro Trend. */
export interface TrendCandidate {
  siteId: string | null;
  sourceId: string;
  title: string;
  url?: string;
  type: SourceType;
  score: number;
}

export interface CollectSummary {
  sources: number;
  fetched: number; // itens lidos dos feeds
  inserted: number; // pautas novas gravadas (sem duplicar)
  errors: { sourceId: string; message: string }[];
}
