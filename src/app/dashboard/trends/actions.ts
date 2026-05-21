"use server";

import { revalidatePath } from "next/cache";
import type { TrendStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessSite } from "@/lib/access";
import { collectActiveSources } from "@/lib/trends";

export type CollectState = { error?: string; ok?: string } | undefined;

/** Dispara a coleta de fontes ativas (todas, ou de um site se vier `siteId`). Trigger manual = ADMIN. */
export async function collectNow(_prev: CollectState, formData: FormData): Promise<CollectState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Apenas admin pode coletar manualmente." };

  const siteId = (formData.get("siteId") as string) || undefined;
  try {
    const summary = await collectActiveSources(siteId ? { siteId } : {});
    revalidatePath("/dashboard/trends");
    const errs = summary.errors.length ? ` (${summary.errors.length} fonte(s) com erro)` : "";
    return { ok: `${summary.inserted} pauta(s) nova(s) de ${summary.fetched} item(ns)${errs}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha na coleta." };
  }
}

async function assertTrendAccess(trendId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada.");
  const trend = await db.trend.findUnique({ where: { id: trendId } });
  if (!trend) throw new Error("Pauta não encontrada.");
  if (!trend.siteId) {
    if (session.user.role !== "ADMIN") throw new Error("Sem permissão.");
  } else {
    const ok = await canAccessSite(session.user.id, session.user.role, trend.siteId);
    if (!ok) throw new Error("Sem acesso a este site.");
  }
  return trend;
}

async function setStatus(trendId: string, status: TrendStatus) {
  await assertTrendAccess(trendId);
  await db.trend.update({ where: { id: trendId }, data: { status } });
  revalidatePath("/dashboard/trends");
}

export async function markTrendUsed(trendId: string): Promise<void> {
  await setStatus(trendId, "USED");
}

export async function dismissTrend(trendId: string): Promise<void> {
  await setStatus(trendId, "DISMISSED");
}
