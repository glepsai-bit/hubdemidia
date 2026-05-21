// Provedor OpenAI (GPT). Gera texto e imagem.
import OpenAI from "openai";
import type {
  GenerateImageOptions,
  GenerateTextOptions,
  ImageProvider,
  TextProvider,
} from "../types";

const DEFAULT_TEXT_MODEL = "gpt-4o";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";

export function createOpenAIProvider(apiKey: string): TextProvider & ImageProvider {
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    async generateText({
      system,
      messages,
      model = DEFAULT_TEXT_MODEL,
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
    async generateImage({ prompt, size = "1024x1024" }: GenerateImageOptions) {
      const res = await client.images.generate({
        model: DEFAULT_IMAGE_MODEL,
        prompt,
        size: size as "1024x1024",
      });
      const item = res.data?.[0];
      return { url: item?.url, b64: item?.b64_json };
    },
  };
}
