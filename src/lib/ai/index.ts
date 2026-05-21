// Factory da camada de IA. Resolve a chave BYOK do usuário (descriptografando) e devolve o provedor.
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import type { ImageProvider, ProviderName, TextProvider } from "./types";
import { createClaudeProvider } from "./providers/claude";
import { createOpenAIProvider } from "./providers/openai";
import { createGrokProvider } from "./providers/grok";

const PROVIDER_MAP = {
  CLAUDE: "claude",
  OPENAI: "openai",
  GROK: "grok",
} as const;

/** Busca a chave BYOK do usuário no banco e instancia o provedor de texto pedido. */
export async function getTextProvider(
  userId: string,
  provider: ProviderName,
): Promise<TextProvider> {
  const apiKey = await resolveApiKey(userId, provider);
  switch (provider) {
    case "claude":
      return createClaudeProvider(apiKey);
    case "openai":
      return createOpenAIProvider(apiKey);
    case "grok":
      return createGrokProvider(apiKey);
  }
}

/** Provedor de imagem (apenas OpenAI por enquanto). */
export async function getImageProvider(userId: string): Promise<ImageProvider> {
  const apiKey = await resolveApiKey(userId, "openai");
  return createOpenAIProvider(apiKey);
}

async function resolveApiKey(userId: string, provider: ProviderName): Promise<string> {
  const dbProvider = (Object.keys(PROVIDER_MAP) as (keyof typeof PROVIDER_MAP)[]).find(
    (k) => PROVIDER_MAP[k] === provider,
  )!;
  const row = await db.aiKey.findUnique({
    where: { userId_provider: { userId, provider: dbProvider } },
  });
  if (!row) throw new Error(`Chave de API do provedor "${provider}" não configurada.`);
  return decrypt(row.encrypted);
}
