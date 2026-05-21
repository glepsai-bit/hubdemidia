// Provedor Grok (xAI). API compatível com OpenAI — reutilizamos o SDK da OpenAI com baseURL da xAI.
import OpenAI from "openai";
import type { GenerateTextOptions, TextProvider } from "../types";

const BASE_URL = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4";

export function createGrokProvider(apiKey: string): TextProvider {
  const client = new OpenAI({ apiKey, baseURL: BASE_URL });

  return {
    name: "grok",
    async generateText({
      system,
      messages,
      model = DEFAULT_MODEL,
      maxTokens = 2048,
      temperature,
    }: GenerateTextOptions) {
      const res = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          ...messages,
        ],
      });
      return res.choices[0]?.message?.content ?? "";
    },
  };
}
