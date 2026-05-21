// Agente SEO — avalia e melhora a matéria com base em palavras-chave reais.
// As keywords devem vir de uma fonte de dados real (ver TODO: integrar API de keyword research).
import type { TextProvider } from "../types";

export interface SeoInput {
  title: string;
  content: string;
  /** Palavras-chave reais (volume/relevância) vindas de pesquisa externa. */
  keywords: string[];
}

export interface SeoOutput {
  score: number; // 0-100
  title: string; // título otimizado
  metaDescription: string;
  content: string; // corpo otimizado
  suggestions: string[];
}

const SYSTEM = `Você é um especialista em SEO. Avalie e melhore a matéria usando as palavras-chave
fornecidas (priorize naturalidade, não faça keyword stuffing). Devolva APENAS JSON válido:
{"score": number 0-100, "title": string, "metaDescription": string, "content": string (markdown),
"suggestions": string[]}.`;

export async function runSeoAgent(
  provider: TextProvider,
  input: SeoInput,
): Promise<SeoOutput> {
  const text = await provider.generateText({
    system: SYSTEM,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: [
          `Palavras-chave alvo: ${input.keywords.join(", ")}`,
          `Título atual: ${input.title}`,
          "Conteúdo atual:",
          input.content,
        ].join("\n"),
      },
    ],
  });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Resposta da IA não contém JSON válido.");
  return JSON.parse(match[0]) as SeoOutput;
}
