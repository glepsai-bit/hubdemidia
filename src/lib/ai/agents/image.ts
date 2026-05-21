// Agente Imagem — gera uma imagem nova para a matéria, a partir do título/contexto.
import type { ImageProvider, GeneratedImage } from "../types";

export interface ImageAgentInput {
  title: string;
  context?: string;
  style?: string; // ex.: "fotojornalismo, realista"
}

export async function runImageAgent(
  provider: ImageProvider,
  input: ImageAgentInput,
): Promise<GeneratedImage> {
  const prompt = [
    `Imagem editorial para a matéria: "${input.title}".`,
    input.context ? `Contexto: ${input.context}.` : "",
    input.style ? `Estilo: ${input.style}.` : "Estilo: realista, alta qualidade.",
    "Sem texto sobreposto.",
  ]
    .filter(Boolean)
    .join(" ");

  return provider.generateImage({ prompt, size: "1024x1024" });
}
