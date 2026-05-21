"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validation";
import { assertSiteAccess } from "../../actions";
import type { ActionState } from "../../actions";

function parse(formData: FormData) {
  return postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl") ?? "",
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

  await db.post.create({
    data: {
      siteId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      imageUrl: data.imageUrl || null,
      status: "DRAFT",
    },
  });
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

  const data = parsed.data;
  const clash = await db.post.findFirst({
    where: { siteId, slug: data.slug, id: { not: postId } },
  });
  if (clash) return { error: "Slug já usado por outro post deste site." };

  await db.post.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      imageUrl: data.imageUrl || null,
    },
  });
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { error: undefined };
}

/** Publica manualmente um post (status PUBLISHED + publishedAt). */
export async function publishPost(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await db.post.update({
    where: { id: postId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  revalidatePath(`/dashboard/sites/${siteId}`);
}

export async function unpublishPost(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await db.post.update({
    where: { id: postId },
    data: { status: "DRAFT", publishedAt: null },
  });
  revalidatePath(`/dashboard/sites/${siteId}`);
}

export async function deletePost(siteId: string, postId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await db.post.delete({ where: { id: postId } });
  revalidatePath(`/dashboard/sites/${siteId}`);
}
