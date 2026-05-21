// Contratos da camada de pesquisa de palavras-chave (keyword research).
// Agnóstica de fonte: hoje Google Suggest (grátis); amanhã DataForSEO/SEMrush (BYOK) com volume real.

export interface KeywordMetric {
  keyword: string;
  /** Volume de busca mensal (quando a fonte fornecer; Google Suggest não fornece). */
  volume?: number;
  /** Sinal relativo de interesse 0-100 (quando houver). */
  interest?: number;
  source: "google-suggest" | "manual" | "fallback" | string;
}

export interface KeywordResearchOptions {
  /** Locale, ex.: "pt-BR". */
  lang?: string;
  /** Máximo de palavras-chave retornadas. */
  max?: number;
}

export interface KeywordProvider {
  name: string;
  research(seed: string, opts?: KeywordResearchOptions): Promise<KeywordMetric[]>;
}
