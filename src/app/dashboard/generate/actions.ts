"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessSite } from "@/lib/access";
import { slugify } from "@/lib/validation";
import { persistGeneratedImage } from "@/lib/storage";
import { runContentPipeline, type PipelineResult } from "@/lib/ai/pipeline";
import type { ProviderName } from "@/lib/ai/types";

export type GenerateState = { error?: string } | undefined;

const PROVIDERS: ProviderName[] = ["claude", "openai", "grok"];

/** Gera um rascunho de post rodando o pipeline (Leitor → SEO → Imagem) com a chave BYOK do usuário. */
export async function generateDraft(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const siteId = String(formData.get("siteId") ?? "");
  const provider = String(formData.get("provider") ?? "claude") as ProviderName;
  const raw = String(formData.get("raw") ?? "").trim();
  const niche = String(formData.get("niche") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const withImage = formData.get("withImage") === "on";

  if (!siteId) return { error: "Selecione um site." };
  if (!PROVIDERS.includes(provider)) return { error: "Provedor inválido." };
  if (raw.length < 20) return { error: "Cole o material da notícia (mínimo ~20 caracteres)." };

  const ok = await canAccessSite(session.user.id, session.user.role, siteId);
  if (!ok) return { error: "Sem acesso a este site." };

  let result: PipelineResult;
  try {
    result = await runContentPipeline({
      userId: session.user.id,
      textProvider: provider,
      raw,
      niche: niche || undefined,
      sourceUrl: sourceUrl || undefined,
      keywords, // sementes manuais (opcionais)
      researchKeywords: true, // pesquisa palavras-chave reais (Google Suggest) a partir do título
      withImage,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao gerar conteúdo." };
  }

  // Persistência (imagem + post): captura falhas e devolve mensagem amigável,
  // em vez de estourar 500. O redirect fica FORA do try (ele lança um controle
  // de fluxo NEXT_REDIRECT que não deve ser capturado aqui).
  let postId: string;
  try {
    let imageUrl: string | null = null;
    if (withImage && (result.imageUrl || result.imageB64)) {
      imageUrl = await persistGeneratedImage({
        url: result.imageUrl,
        b64: result.imageB64,
      });
    }

    const slug = await uniqueSlug(siteId, slugify(result.title) || "rascunho");

    const post = await db.post.create({
      data: {
        siteId,
        title: result.title,
        slug,
        excerpt: result.excerpt || result.metaDescription || null,
        content: result.content,
        imageUrl,
        seoScore: result.seoScore,
        sourceUrl: sourceUrl || null,
        createdByAi: true,
        status: "DRAFT",
      },
    });
    postId = post.id;
  } catch (e) {
    // P2002 = violação de unique (slug colidiu numa corrida concorrente).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Já existe um post com esse slug neste site. Tente gerar novamente." };
    }
    return { error: e instanceof Error ? e.message : "Falha ao salvar o rascunho." };
  }

  revalidatePath(`/dashboard/sites/${siteId}`);
  redirect(`/dashboard/sites/${siteId}/posts/${postId}`);
}

/** Garante slug único dentro do site (append -2, -3, ...). */
async function uniqueSlug(siteId: string, base: string): Promise<string> {
  let slug = base.slice(0, 200);
  let n = 1;
  while (await db.post.findUnique({ where: { siteId_slug: { siteId, slug } } })) {
    n += 1;
    slug = `${base.slice(0, 190)}-${n}`;
  }
  return slug;
}
