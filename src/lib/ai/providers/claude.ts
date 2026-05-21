// Provedor Claude (Anthropic). Gera texto. Não gera imagem.
import Anthropic from "@anthropic-ai/sdk";
import type { GenerateTextOptions, TextProvider } from "../types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export function createClaudeProvider(apiKey: string): TextProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: "claude",
    async generateText({
      system,
      messages,
      model = DEFAULT_MODEL,
      maxTokens = 2048,
      temperature,
    }: GenerateTextOptions) {
      const res = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
      return res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    },
  };
}
