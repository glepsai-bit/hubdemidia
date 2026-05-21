// Pipeline de conteúdo: encadeia os agentes Leitor → Imagem → SEO e devolve um rascunho de Post.
// Pode ser disparado manualmente, pelo monitor de tendências ou por um fluxo do n8n.
import { getImageProvider, getTextProvider } from "./index";
import type { ProviderName } from "./types";
import { runReaderAgent } from "./agents/reader";
import { runImageAgent } from "./agents/image";
import { runSeoAgent } from "./agents/seo";

export interface PipelineInput {
  userId: string; // dono da chave BYOK
  textProvider: ProviderName; // claude | openai | grok
  raw: string; // material/notícia bruta
  niche?: string;
  sourceUrl?: string;
  keywords: string[]; // palavras-chave reais (pesquisa externa)
  withImage?: boolean;
}

export interface PipelineResult {
  title: string;
  excerpt: string;
  content: string;
  metaDescription: string;
  seoScore: number;
  imageUrl?: string;
  imageB64?: string;
  suggestions: string[];
}

export async function runContentPipeline(input: PipelineInput): Promise<PipelineResult> {
  const text = await getTextProvider(input.userId, input.textProvider);

  // 1) Leitor: reescreve a notícia
  const draft = await runReaderAgent(text, {
    raw: input.raw,
    niche: input.niche,
    sourceUrl: input.sourceUrl,
  });

  // 2) SEO: avalia e melhora
  const seo = await runSeoAgent(text, {
    title: draft.title,
    content: draft.content,
    keywords: input.keywords,
  });

  // 3) Imagem (opcional)
  let imageUrl: string | undefined;
  let imageB64: string | undefined;
  if (input.withImage) {
    const imageProvider = await getImageProvider(input.userId);
    const img = await runImageAgent(imageProvider, {
      title: seo.title,
      context: draft.excerpt,
    });
    imageUrl = img.url;
    imageB64 = img.b64;
  }

  return {
    title: seo.title,
    excerpt: draft.excerpt,
    content: seo.content,
    metaDescription: seo.metaDescription,
    seoScore: seo.score,
    imageUrl,
    imageB64,
    suggestions: seo.suggestions,
  };
}
