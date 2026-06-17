// Geração de post a partir do pipeline + persistência (imagem, slug único, registro).
// Reutilizável por server actions e por webhooks (n8n) e pelo autopilot.
import type { AutopilotImageStrategy } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/validation";
import { persistGeneratedImage } from "@/lib/storage";
import { computeReadingMinutes } from "@/lib/portal/readtime";
import { runContentPipeline } from "@/lib/ai/pipeline";
import { getImageProvider } from "@/lib/ai";
import { runImageAgent } from "@/lib/ai/agents/image";
import { findAndPersistStockImage } from "@/lib/images";
import type { ProviderName } from "@/lib/ai/types";

export interface GeneratePostInput {
  userId: string; // dono da chave BYOK
  siteId: string;
  provider: ProviderName;
  raw: string;
  niche?: string;
  sourceUrl?: string;
  keywords?: string[];
  /** Backwards-compat: true = gera imagem via OpenAI (a menos que `imageStrategy` esteja setado). */
  withImage?: boolean;
  /** Quando setado, controla a busca/geração de imagem (sobrescreve `withImage`). */
  imageStrategy?: AutopilotImageStrategy;
  autoPublish?: boolean;
  categoryId?: string;
  authorName?: string;
}

export interface GeneratePostResult {
  postId: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  seoScore: number;
  imageSource: "bank" | "openai" | "none";
}

async function generateOpenAiImage(userId: string, title: string): Promise<string | null> {
  try {
    const provider = await getImageProvider(userId);
    const img = await runImageAgent(provider, { title });
    if (!img.url && !img.b64) return null;
    return await persistGeneratedImage({ url: img.url, b64: img.b64 });
  } catch {
    return null;
  }
}

async function resolveImage(input: {
  userId: string;
  strategy: AutopilotImageStrategy | undefined;
  withImage: boolean;
  title: string;
  keywords: string[];
}): Promise<{ url: string | null; source: "bank" | "openai" | "none" }> {
  // Modo legado: sem estratégia explícita → respeita o boolean withImage.
  if (!input.strategy) {
    if (!input.withImage) return { url: null, source: "none" };
    const openai = await generateOpenAiImage(input.userId, input.title);
    return { url: openai, source: openai ? "openai" : "none" };
  }

  switch (input.strategy) {
    case "NONE":
      return { url: null, source: "none" };

    case "BANK_ONLY": {
      const bank = await findAndPersistStockImage({
        title: input.title,
        keywords: input.keywords,
      });
      return { url: bank, source: bank ? "bank" : "none" };
    }

    case "BANK_FIRST": {
      const bank = await findAndPersistStockImage({
        title: input.title,
        keywords: input.keywords,
      });
      if (bank) return { url: bank, source: "bank" };
      // Fallback OpenAI
      const openai = await generateOpenAiImage(input.userId, input.title);
      return { url: openai, source: openai ? "openai" : "none" };
    }

    case "OPENAI_ONLY": {
      const openai = await generateOpenAiImage(input.userId, input.title);
      return { url: openai, source: openai ? "openai" : "none" };
    }
  }
}

/** Roda o pipeline e grava o post (rascunho ou publicado). Lança em erro de IA/persistência. */
export async function generatePostForSite(input: GeneratePostInput): Promise<GeneratePostResult> {
  // Se estratégia foi setada, evita gastar OpenAI no pipeline (faremos no wrapper).
  const pipelineWithImage = !input.imageStrategy && Boolean(input.withImage);

  const result = await runContentPipeline({
    userId: input.userId,
    textProvider: input.provider,
    raw: input.raw,
    niche: input.niche,
    sourceUrl: input.sourceUrl,
    keywords: input.keywords,
    researchKeywords: true,
    withImage: pipelineWithImage,
  });

  // Imagem do pipeline (modo legado: pipeline gerou via OpenAI internamente).
  let imageUrl: string | null = null;
  let imageSource: "bank" | "openai" | "none" = "none";
  if (pipelineWithImage && (result.imageUrl || result.imageB64)) {
    imageUrl = await persistGeneratedImage({ url: result.imageUrl, b64: result.imageB64 });
    imageSource = imageUrl ? "openai" : "none";
  } else {
    // Modo nova estratégia: resolve via banco/OpenAI conforme config.
    const resolved = await resolveImage({
      userId: input.userId,
      strategy: input.imageStrategy,
      withImage: Boolean(input.withImage),
      title: result.title,
      keywords: result.keywords,
    });
    imageUrl = resolved.url;
    imageSource = resolved.source;
  }

  const slug = await uniqueSlug(input.siteId, slugify(result.title) || "rascunho");
  const status = input.autoPublish ? "PUBLISHED" : "DRAFT";

  // Categoria opcional — só atribui se pertencer ao site
  let categoryId: string | null = null;
  if (input.categoryId) {
    const cat = await db.category.findFirst({
      where: { id: input.categoryId, siteId: input.siteId },
      select: { id: true },
    });
    if (cat) categoryId = cat.id;
  }

  const post = await db.post.create({
    data: {
      siteId: input.siteId,
      title: result.title,
      slug,
      excerpt: result.excerpt || result.metaDescription || null,
      content: result.content,
      imageUrl,
      heroAlt: result.title,
      seoScore: result.seoScore,
      sourceUrl: input.sourceUrl || null,
      authorName: input.authorName ?? null,
      categoryId,
      readingMinutes: computeReadingMinutes(result.content),
      createdByAi: true,
      status,
      publishedAt: input.autoPublish ? new Date() : null,
    },
  });

  return { postId: post.id, title: post.title, status, seoScore: result.seoScore, imageSource };
}

async function uniqueSlug(siteId: string, base: string): Promise<string> {
  let slug = base.slice(0, 200);
  let n = 1;
  while (await db.post.findUnique({ where: { siteId_slug: { siteId, slug } } })) {
    n += 1;
    slug = `${base.slice(0, 190)}-${n}`;
  }
  return slug;
}
