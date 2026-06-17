// Tradução PT→EN de termos visuais comuns. Bancos grátis devolvem MUITO mais resultados
// pra queries em inglês. Quando nada bate, deixamos o termo original.

const PT_TO_EN: Record<string, string> = {
  // futebol
  futebol: "soccer",
  "futebol americano": "american football",
  jogador: "soccer player",
  jogadora: "soccer player woman",
  estádio: "stadium",
  estadio: "stadium",
  campo: "soccer field",
  gol: "soccer goal",
  bola: "soccer ball",
  arbitro: "referee",
  árbitro: "referee",
  juiz: "referee",
  técnico: "soccer coach",
  tecnico: "soccer coach",
  treinador: "soccer coach",
  torcida: "soccer fans",
  torcedor: "soccer fans",
  // copa / mundial
  copa: "world cup",
  mundial: "world cup",
  "copa do mundo": "world cup",
  fifa: "fifa world cup",
  // seleção
  seleção: "national team",
  selecao: "national team",
  brasil: "brazil flag",
  brasileiro: "brazil",
  argentina: "argentina football",
  // clubes (genérico)
  brasileirão: "brazilian league soccer",
  brasileirao: "brazilian league soccer",
  libertadores: "copa libertadores",
  championsleague: "champions league",
  "champions league": "champions league",
  // outros esportes
  basquete: "basketball",
  vôlei: "volleyball",
  volei: "volleyball",
  tênis: "tennis",
  tenis: "tennis",
  olimpíadas: "olympics",
  olimpiadas: "olympics",
  fórmula: "formula one",
  formula: "formula one",
  f1: "formula one",
  mma: "mma fighter",
  ufc: "mma fighter",
  // notícias gerais
  política: "politics",
  politica: "politics",
  economia: "economy",
  mercado: "stock market",
  bolsa: "stock market",
  tecnologia: "technology",
  ia: "artificial intelligence",
  inteligência: "artificial intelligence",
  inteligencia: "artificial intelligence",
  startups: "startup business",
  startup: "startup business",
};

const STOP_WORDS = new Set([
  "a","o","os","as","e","de","da","do","das","dos","em","no","na","nas","nos","um","uma",
  "uns","umas","para","por","com","que","como","se","ao","aos","à","às",
]);

/** Constrói query EN priorizando termos mapeados; fallback: pega 1-2 nouns úteis do título. */
export function buildImageQuery(
  title: string,
  keywords: string[] = [],
  categoryName?: string | null,
): string {
  const text = `${title} ${keywords.join(" ")} ${categoryName ?? ""}`.toLowerCase();

  // 1) Multi-palavra primeiro (ex.: "copa do mundo").
  const multi = Object.keys(PT_TO_EN).filter((k) => k.includes(" "));
  const found: string[] = [];
  for (const m of multi) {
    if (text.includes(m) && !found.includes(PT_TO_EN[m])) found.push(PT_TO_EN[m]);
  }

  // 2) Palavras únicas.
  const tokens = text.split(/[^\p{L}\p{N}]+/u).filter((t) => t && !STOP_WORDS.has(t));
  for (const tok of tokens) {
    if (PT_TO_EN[tok] && !found.includes(PT_TO_EN[tok])) found.push(PT_TO_EN[tok]);
    if (found.length >= 3) break;
  }

  if (found.length > 0) return found.slice(0, 3).join(" ");

  // 3) Fallback: 2-3 palavras significativas do título no PT (banco aceita, só piora resultado).
  const ptTokens = tokens.filter((t) => t.length > 3).slice(0, 3);
  return ptTokens.length > 0 ? ptTokens.join(" ") : title.slice(0, 40);
}
