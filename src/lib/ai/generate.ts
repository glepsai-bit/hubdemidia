// Geração de post a partir do pipeline + persistência (imagem, slug único, registro).
// Reutilizável por server actions e por webhooks (n8n).
import { db } from "@/lib/db";
import { slugify } from "@/lib/validation";
import { persistGeneratedImage } from "@/lib/storage";
import { computeReadingMinutes } from "@/lib/portal/readtime";
import { runContentPipeline } from "@/lib/ai/pipeline";
import type { ProviderName } from "@/lib/ai/types";

export interface GeneratePostInput {
  userId: string; // dono da chave BYOK
  siteId: string;
  provider: ProviderName;
  raw: string;
  niche?: string;
  sourceUrl?: string;
  keywords?: string[];
  withImage?: boolean;
  autoPublish?: boolean;
  categoryId?: string;
  authorName?: string;
}

export interface GeneratePostResult {
  postId: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  seoScore: number;
}

/** Roda o pipeline e grava o post (rascunho ou publicado). Lança em erro de IA/persistência. */
export async function generatePostForSite(input: GeneratePostInput): Promise<GeneratePostResult> {
  const result = await runContentPipeline({
    userId: input.userId,
    textProvider: input.provider,
    raw: input.raw,
    niche: input.niche,
    sourceUrl: input.sourceUrl,
    keywords: input.keywords,
    researchKeywords: true,
    withImage: input.withImage,
  });

  let imageUrl: string | null = null;
  if (input.withImage && (result.imageUrl || result.imageB64)) {
    imageUrl = await persistGeneratedImage({ url: result.imageUrl, b64: result.imageB64 });
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

  return { postId: post.id, title: post.title, status, seoScore: result.seoScore };
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
