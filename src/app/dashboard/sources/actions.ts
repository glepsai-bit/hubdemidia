"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessSite } from "@/lib/access";
import { sourceSchema } from "@/lib/validation";

export type SourceState = { error?: string; ok?: string } | undefined;

/** Cria uma fonte de monitoramento. Global (sem site) exige ADMIN; por site exige acesso ao site. */
export async function createSource(_prev: SourceState, formData: FormData): Promise<SourceState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const parsed = sourceSchema.safeParse({
    type: formData.get("type"),
    url: formData.get("url"),
    label: formData.get("label") ?? "",
    siteId: formData.get("siteId") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { type, url, label, siteId } = parsed.data;

  if (!siteId) {
    if (session.user.role !== "ADMIN") return { error: "Só admin cria fontes globais." };
  } else {
    const ok = await canAccessSite(session.user.id, session.user.role, siteId);
    if (!ok) return { error: "Sem acesso a este site." };
  }

  await db.source.create({
    data: { type, url, label: label || null, siteId: siteId || null },
  });
  revalidatePath("/dashboard/sources");
  return { ok: "Fonte adicionada." };
}

async function assertSourceAccess(sourceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada.");
  const source = await db.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Fonte não encontrada.");
  if (!source.siteId) {
    if (session.user.role !== "ADMIN") throw new Error("Sem permissão.");
  } else {
    const ok = await canAccessSite(session.user.id, session.user.role, source.siteId);
    if (!ok) throw new Error("Sem acesso a este site.");
  }
  return source;
}

export async function toggleSource(sourceId: string): Promise<void> {
  const source = await assertSourceAccess(sourceId);
  await db.source.update({ where: { id: sourceId }, data: { active: !source.active } });
  revalidatePath("/dashboard/sources");
}

export async function deleteSource(sourceId: string): Promise<void> {
  await assertSourceAccess(sourceId);
  await db.source.delete({ where: { id: sourceId } });
  revalidatePath("/dashboard/sources");
}
