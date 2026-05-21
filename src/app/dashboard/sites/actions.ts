"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessSite } from "@/lib/access";
import { siteSchema } from "@/lib/validation";

export type ActionState = { error?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar sites.");
  }
  return session;
}

export async function createSite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = siteSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    domain: formData.get("domain") ?? "",
    description: formData.get("description") ?? "",
    status: formData.get("status") ?? "DRAFT",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const exists = await db.site.findFirst({
    where: { OR: [{ slug: data.slug }, ...(data.domain ? [{ domain: data.domain }] : [])] },
  });
  if (exists) return { error: "Já existe um site com esse slug ou domínio." };

  await db.site.create({
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain || null,
      description: data.description || null,
      status: data.status,
    },
  });
  revalidatePath("/dashboard/sites");
  redirect("/dashboard/sites");
}

export async function updateSite(siteId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = siteSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    domain: formData.get("domain") ?? "",
    description: formData.get("description") ?? "",
    status: formData.get("status") ?? "DRAFT",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const clash = await db.site.findFirst({
    where: {
      id: { not: siteId },
      OR: [{ slug: data.slug }, ...(data.domain ? [{ domain: data.domain }] : [])],
    },
  });
  if (clash) return { error: "Slug ou domínio já usado por outro site." };

  await db.site.update({
    where: { id: siteId },
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain || null,
      description: data.description || null,
      status: data.status,
    },
  });
  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath("/dashboard/sites");
  return { error: undefined };
}

export async function deleteSite(siteId: string): Promise<void> {
  await requireAdmin();
  await db.site.delete({ where: { id: siteId } });
  revalidatePath("/dashboard/sites");
  redirect("/dashboard/sites");
}

/** Guard reutilizável: garante que a sessão atual pode acessar o site. */
export async function assertSiteAccess(siteId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const ok = await canAccessSite(session.user.id, session.user.role, siteId);
  if (!ok) throw new Error("Sem acesso a este site.");
  return session;
}
