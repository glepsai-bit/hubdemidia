"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categorySchema, normalizeHex } from "@/lib/validation";
import { assertSiteAccess } from "../../actions";
import type { ActionState } from "../../actions";

export async function createCategory(
  siteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSiteAccess(siteId);
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    color: formData.get("color") ?? "",
    order: formData.get("order") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  const exists = await db.category.findUnique({
    where: { siteId_slug: { siteId, slug: data.slug } },
  });
  if (exists) return { error: "Já existe uma editoria com esse slug." };

  await db.category.create({
    data: {
      siteId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      color: normalizeHex(data.color),
      order: data.order ?? 0,
    },
  });
  revalidatePath(`/dashboard/sites/${siteId}/categories`);
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { error: undefined };
}

/** Garante que a categoria pertence ao site. Defesa multi-tenant. */
async function assertCategoryBelongsToSite(siteId: string, categoryId: string) {
  const cat = await db.category.findFirst({
    where: { id: categoryId, siteId },
    select: { id: true },
  });
  if (!cat) throw new Error("Editoria não encontrada.");
}

export async function updateCategory(
  siteId: string,
  categoryId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSiteAccess(siteId);
  // Confirma que a editoria pertence a este site antes de qualquer escrita.
  const owned = await db.category.findFirst({
    where: { id: categoryId, siteId },
    select: { id: true },
  });
  if (!owned) return { error: "Editoria não encontrada." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    color: formData.get("color") ?? "",
    order: formData.get("order") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  const clash = await db.category.findFirst({
    where: { siteId, slug: data.slug, id: { not: categoryId } },
  });
  if (clash) return { error: "Slug já usado por outra editoria." };

  try {
    await db.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        color: normalizeHex(data.color),
        order: data.order ?? 0,
      },
    });
  } catch {
    return { error: "Falha ao atualizar a editoria." };
  }
  revalidatePath(`/dashboard/sites/${siteId}/categories`);
  return { error: undefined };
}

export async function deleteCategory(siteId: string, categoryId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await assertCategoryBelongsToSite(siteId, categoryId);
  await db.category.delete({ where: { id: categoryId } });
  revalidatePath(`/dashboard/sites/${siteId}/categories`);
  revalidatePath(`/dashboard/sites/${siteId}`);
}
