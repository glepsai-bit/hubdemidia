// Contratos da camada de IA — agnóstica de provedor (Claude / OpenAI / Grok).
// Os agentes (Leitor, Imagem, SEO) dependem destas interfaces, nunca de um SDK específico.

export type ProviderName = "claude" | "openai" | "grok";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateTextOptions {
  system?: string;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Provedor capaz de gerar texto (usado pelos agentes Leitor e SEO). */
export interface TextProvider {
  name: ProviderName;
  generateText(opts: GenerateTextOptions): Promise<string>;
}

export interface GenerateImageOptions {
  prompt: string;
  size?: string; // ex.: "1024x1024"
}

export interface GeneratedImage {
  url?: string;
  b64?: string;
}

/** Provedor capaz de gerar imagem (usado pelo agente Imagem). */
export interface ImageProvider {
  name: ProviderName;
  generateImage(opts: GenerateImageOptions): Promise<GeneratedImage>;
}
