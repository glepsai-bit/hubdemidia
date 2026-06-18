"use server";

import { revalidatePath } from "next/cache";
import type { AiProvider, AutopilotImageStrategy } from "@prisma/client";
import { db } from "@/lib/db";
import { autopilotSchema } from "@/lib/validation";
import { runAutopilotForSite } from "@/lib/autopilot";
import { collectActiveSources } from "@/lib/trends";
import { assertSiteAccess } from "../../actions";
import type { ActionState } from "../../actions";

function onOff(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true";
}

export async function updateAutopilot(
  siteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSiteAccess(siteId);

  const parsed = autopilotSchema.safeParse({
    enabled: formData.get("enabled") ?? "off",
    postsPerRun: formData.get("postsPerRun") ?? 3,
    featuredThreshold: formData.get("featuredThreshold") ?? 70,
    provider: formData.get("provider") ?? "CLAUDE",
    withImage: formData.get("withImage") ?? "off",
    imageStrategy: formData.get("imageStrategy") ?? "BANK_FIRST",
    autoCategory: formData.get("autoCategory") ?? "off",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const d = parsed.data;
  await db.site.update({
    where: { id: siteId },
    data: {
      autopilotEnabled: onOff(formData.get("enabled")),
      autopilotPostsPerRun: d.postsPerRun,
      autopilotFeaturedThreshold: d.featuredThreshold,
      autopilotProvider: d.provider as AiProvider,
      autopilotWithImage: onOff(formData.get("withImage")),
      autopilotImageStrategy: d.imageStrategy as AutopilotImageStrategy,
      autopilotAutoCategory: onOff(formData.get("autoCategory")),
    },
  });
  revalidatePath(`/dashboard/sites/${siteId}/autopilot`);
  return { error: undefined };
}

/** Resultado da execução manual — usado pelo botão "Rodar agora" pra dar feedback na UI. */
export type RunAutopilotResult = {
  ok: boolean;
  posted: number;
  errors: number;
  collected: number;
  message: string;
};

const PROVIDER_LABEL: Record<AiProvider, string> = {
  CLAUDE: "Claude",
  OPENAI: "OpenAI",
  GROK: "Grok",
};

/** Dispara o autopilot AGORA para esse site. Cria AutopilotRun, força coleta e retorna feedback. */
export async function runAutopilotNow(siteId: string): Promise<RunAutopilotResult> {
  await assertSiteAccess(siteId);

  // Cria log da execução manual (pra ficar visível no /dashboard/autopilot).
  const run = await db.autopilotRun.create({
    data: { siteId, status: "RUNNING" },
  });
  const t0 = Date.now();

  try {
    // 1) Carrega site pra checar provider/chave antes de gastar a coleta.
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: {
        autopilotEnabled: true,
        autopilotProvider: true,
        name: true,
      },
    });
    if (!site) {
      const r: RunAutopilotResult = { ok: false, posted: 0, errors: 1, collected: 0, message: "Site não encontrado." };
      await db.autopilotRun.update({
        where: { id: run.id },
        data: { status: "ERROR", finishedAt: new Date(), durationMs: Date.now() - t0, notes: `MANUAL · ${r.message}` },
      });
      return r;
    }
    if (!site.autopilotEnabled) {
      const r: RunAutopilotResult = { ok: false, posted: 0, errors: 0, collected: 0, message: "Piloto automático está desativado para este site." };
      await db.autopilotRun.update({
        where: { id: run.id },
        data: { status: "SKIPPED", finishedAt: new Date(), durationMs: Date.now() - t0, notes: `MANUAL · ${r.message}` },
      });
      return r;
    }

    // 2) Pré-checa BYOK do provider escolhido — evita falha silenciosa em loop.
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const automationEmail = process.env.AUTOMATION_USER_EMAIL;
    const automationUser = automationEmail
      ? await db.user.findUnique({ where: { email: automationEmail }, select: { id: true } })
      : null;
    const userId = automationUser?.id ?? adminUser?.id;
    if (!userId) {
      const r: RunAutopilotResult = { ok: false, posted: 0, errors: 1, collected: 0, message: "Nenhum admin disponível p/ BYOK." };
      await db.autopilotRun.update({
        where: { id: run.id },
        data: { status: "ERROR", finishedAt: new Date(), durationMs: Date.now() - t0, notes: `MANUAL · ${r.message}` },
      });
      return r;
    }
    const hasKey = await db.aiKey.findFirst({
      where: { userId, provider: site.autopilotProvider },
      select: { id: true },
    });
    if (!hasKey) {
      const provLabel = PROVIDER_LABEL[site.autopilotProvider];
      const r: RunAutopilotResult = {
        ok: false,
        posted: 0,
        errors: 1,
        collected: 0,
        message: `Provedor selecionado é ${provLabel} mas não há chave BYOK cadastrada. Vá em Chaves IA ou troque o provedor nas configurações deste autopilot.`,
      };
      await db.autopilotRun.update({
        where: { id: run.id },
        data: { status: "ERROR", finishedAt: new Date(), durationMs: Date.now() - t0, notes: `MANUAL · sem chave ${provLabel}` },
      });
      return r;
    }

    // 3) Força coleta antes (pega trends do site E globais).
    let collected = 0;
    try {
      const siteCollect = await collectActiveSources({ siteId });
      collected += siteCollect.inserted;
    } catch {
      // segue
    }
    try {
      const globalCollect = await collectActiveSources({ siteId: null });
      collected += globalCollect.inserted;
    } catch {
      // segue
    }

    // 4) Roda o autopilot.
    const summary = await runAutopilotForSite(siteId);

    const status =
      summary.posted > 0 ? "OK" : summary.errors > 0 ? "ERROR" : "SKIPPED";

    const message =
      summary.posted > 0
        ? `Publicou ${summary.posted} pauta(s)${summary.errors > 0 ? ` · ${summary.errors} falharam` : ""}.`
        : summary.errors > 0
          ? `Tentou ${summary.errors} pauta(s) e todas falharam. Detalhes: ${summary.details.slice(0, 2).join(" · ")}`
          : `Sem pautas NEW pra processar${collected > 0 ? ` (coleta trouxe ${collected} novas, mas filtros descartaram tudo)` : " — todas as fontes não trouxeram nada novo. Verifique se os feeds estão vivos em /dashboard/sources"}.`;

    await db.autopilotRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        posted: summary.posted,
        errors: summary.errors,
        durationMs: Date.now() - t0,
        notes: `MANUAL · +${collected} novas na coleta · ${summary.details.join(" · ")}`.slice(0, 480),
      },
    });

    revalidatePath(`/dashboard/sites/${siteId}/autopilot`);
    revalidatePath(`/dashboard/autopilot`);

    return {
      ok: summary.posted > 0,
      posted: summary.posted,
      errors: summary.errors,
      collected,
      message,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.autopilotRun.update({
      where: { id: run.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        durationMs: Date.now() - t0,
        notes: `MANUAL · throw: ${msg}`.slice(0, 480),
      },
    });
    return { ok: false, posted: 0, errors: 1, collected: 0, message: `Erro inesperado: ${msg}` };
  }
}
