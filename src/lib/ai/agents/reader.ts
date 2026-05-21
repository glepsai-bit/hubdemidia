// Agente Leitor — lê uma notícia (texto/URL) e devolve uma reescrita pronta para publicar.
import type { TextProvider } from "../types";

export interface ReaderInput {
  /** Conteúdo bruto da notícia (texto extraído) ou um resumo da fonte. */
  raw: string;
  /** Nicho/tom do site, para guiar a reescrita. */
  niche?: string;
  sourceUrl?: string;
}

export interface ReaderOutput {
  title: string;
  excerpt: string;
  content: string;
}

const SYSTEM = `Você é um redator de notícias. Reescreva o material recebido como uma matéria
original, clara e factual, em português do Brasil. Não invente fatos. Devolva APENAS um JSON
válido no formato: {"title": string, "excerpt": string, "content": string (markdown)}.`;

export async function runReaderAgent(
  provider: TextProvider,
  input: ReaderInput,
): Promise<ReaderOutput> {
  const text = await provider.generateText({
    system: SYSTEM,
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: [
          input.niche ? `Nicho do site: ${input.niche}` : "",
          input.sourceUrl ? `Fonte: ${input.sourceUrl}` : "",
          "Material:",
          input.raw,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });
  return parseJson<ReaderOutput>(text);
}

function parseJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Resposta da IA não contém JSON válido.");
  return JSON.parse(match[0]) as T;
}
