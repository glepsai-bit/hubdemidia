"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validation";
import { notifyN8n } from "@/lib/n8n";

export type PublishState = { error?: string; ok?: string } | undefined;

/**
 * Publicação geral: cria o mesmo post (já PUBLISHED) em todos os sites — ou nos selecionados.
 * Apenas ADMIN. Slugs que já existirem num site são ignorados (skipDuplicates).
 */
export async function publishToAll(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem usar a publicação geral." };
  }

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  // Sites alvo: os selecionados no form ou, se nenhum, todos.
  const selected = formData.getAll("siteIds").map(String).filter(Boolean);
  const sites = await db.site.findMany({
    where: selected.length ? { id: { in: selected } } : undefined,
    select: { id: true },
  });
  if (sites.length === 0) return { error: "Nenhum site para publicar." };

  const data = parsed.data;
  const now = new Date();
  const result = await db.post.createMany({
    data: sites.map((s) => ({
      siteId: s.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      imageUrl: data.imageUrl || null,
      status: "PUBLISHED" as const,
      publishedAt: now,
    })),
    skipDuplicates: true,
  });

  await notifyN8n("posts.published_all", { count: result.count, sites: sites.length, slug: data.slug });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sites");
  return { ok: `Publicado em ${result.count} de ${sites.length} site(s).` };
}
