"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { postSchema, slugify } from "@/lib/validation";
import { computeReadingMinutes } from "@/lib/portal/readtime";
import { notifyN8n } from "@/lib/n8n";
import { assertSiteAccess } from "../../actions";
import type { ActionState } from "../../actions";

function parse(formData: FormData) {
  return postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl") ?? "",
    heroAlt: formData.get("heroAlt") ?? "",
    authorName: formData.get("authorName") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    featured: formData.get("featured") ?? "off",
    tags: formData.get("tags") ?? "",
  });
}

/** Garante existência das tags (CSV "a, b, c") no site e retorna os IDs. */
async function upsertTagsCsv(siteId: string, csv: string): Promise<string[]> {
  const names = Array.from(
    new Set(
      csv
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 20),
    ),
  );
  if (names.length === 0) return [];
  const tags = await Promise.all(
    names.map(async (name) => {
      const slug = slugify(name);
      if (!slug) return null;
      return db.tag.upsert({
        where: { siteId_slug: { siteId, slug } },
        update: { name },
        create: { siteId, slug, name },
      });
    }),
  );
  return tags.filter((t): t is NonNullable<typeof t> => !!t).map((t) => t.id);
}

async function setPostTags(postId: string, tagIds: string[]) {
  await db.postTag.deleteMany({ where: { postId } });
  if (tagIds.length === 0) return;
  await db.postTag.createMany({
    data: tagIds.map((tagId) => ({ postId, tagId })),
    skipDuplicates: true,
  });
}

export async function createPost(
  siteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSiteAccess(siteId);
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  const clash = await db.post.findUnique({
    where: { siteId_slug: { siteId, slug: data.slug } },
  });
  if (clash) return { error: "Já existe um post com esse slug neste site." };

  // Garante que a categoria pertence ao site (segurança extra).
  let categoryId: string | null = null;
  if (data.categoryId && data.categoryId !== "") {
    const cat = await db.category.findFirst({
      where: { id: data.categoryId, siteId },
      select: { id: true },
    });
    if (cat) categoryId = cat.id;
  }

  let post;
  try {
    post = await db.post.create({
      data: {
        siteId,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        imageUrl: data.imageUrl || null,
        heroAlt: data.heroAlt || null,
        authorName: data.authorName || null,
        categoryId,
        featured: data.featured === "on" || data.featured === true,
        readingMinutes: computeReadingMinutes(data.content),
        status: "DRAFT",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Já existe um post com esse slug neste site." };
    }
    return { error: "Falha ao criar o post." };
  }

  const tagIds = await upsertTagsCsv(siteId, String(data.tags ?? ""));
  await setPostTags(post.id, tagIds);

  revalidatePath(`/dashboard/sites/${siteId}`);
  redirect(`/dashboard/sites/${siteId}`);
}

export async function updatePost(
  siteId: string,
  postId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSiteAccess(siteId);
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  // Garante que o post pertence a este site (defesa multi-tenant).
  const owned = await db.post.findFirst({ where: { id: postId, siteId }, select: { id: true } });
  if (!owned) return { error: "Post não encontrado." };

  const data = parsed.data;
  const clash = await db.post.findFirst({
    where: { siteId, slug: data.slug, id: { not: postId } },
  });
  if (clash) return { error: "Slug já usado por outro post deste site." };

  let categoryId: string | null = null;
  if (data.categoryId && data.categoryId !== "") {
    const cat = await db.category.findFirst({
      where: { id: data.categoryId, siteId },
      select: { id: true },
    });
    if (cat) categoryId = cat.id;
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        imageUrl: data.imageUrl || null,
        heroAlt: data.heroAlt || null,
        authorName: data.authorName || null,
        categoryId,
        featured: data.featured === "on" || data.featured === true,
        readingMinutes: computeReadingMinutes(data.content),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Slug já usado por outro post deste site." };
    }
    return { error: "Falha ao salvar o post." };
  }

  const tagIds = await upsertTagsCsv(siteId, String(data.tags ?? ""));
  await setPostTags(postId, tagIds);

  revalidatePath(`/dashboard/sites/${siteId}`);
  await revalidateTenantPublic(siteId);
  return { error: undefined };
}

/** Confirma que o post pertence ao site. Defesa contra IDOR multi-tenant. */
async function assertPostBelongsToSite(siteId: string, postId: string) {
  const post = await db.post.findFirst({ where: { id: postId, siteId }, select: { id: true } });
  if (!post) throw new Error("Post não encontrado.");
}

/** Revalida as rotas públicas do tenant ao publicar/despublicar/editar. */
async function revalidateTenantPublic(siteId: string) {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { slug: true, domain: true },
  });
  if (!site) return;
  const rootDomain = (process.env.ROOT_DOMAIN ?? "localhost:3000").split(":")[0];
  const host = site.domain ?? `${site.slug}.${rootDomain}`;
  revalidatePath(`/tenants/${host}`, "layout");
  revalidatePath(`/tenants/${host}/sitemap.xml`);
  revalidatePath(`/tenants/${host}/feed.xml`);
}

/** Publica manualmente um post (status PUBLISHED + publishedAt). */
export async function publishPost(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await assertPostBelongsToSite(siteId, postId);
  await db.post.update({
    where: { id: postId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await notifyN8n("post.published", { siteId, postId });
  revalidatePath(`/dashboard/sites/${siteId}`);
  await revalidateTenantPublic(siteId);
}

export async function unpublishPost(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await assertPostBelongsToSite(siteId, postId);
  await db.post.update({
    where: { id: postId },
    data: { status: "DRAFT", publishedAt: null },
  });
  revalidatePath(`/dashboard/sites/${siteId}`);
  await revalidateTenantPublic(siteId);
}

export async function deletePost(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await assertPostBelongsToSite(siteId, postId);
  await db.post.delete({ where: { id: postId } });
  revalidatePath(`/dashboard/sites/${siteId}`);
  await revalidateTenantPublic(siteId);
}

/** Marca/desmarca um post como destaque (capa). */
export async function toggleFeatured(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  const post = await db.post.findFirst({
    where: { id: postId, siteId },
    select: { featured: true },
  });
  if (!post) return;
  await db.post.update({
    where: { id: postId },
    data: { featured: !post.featured },
  });
  revalidatePath(`/dashboard/sites/${siteId}`);
  await revalidateTenantPublic(siteId);
}
