"use server";

import { revalidatePath } from "next/cache";
import type { AiProvider, AutopilotImageStrategy } from "@prisma/client";
import { db } from "@/lib/db";
import { autopilotSchema } from "@/lib/validation";
import {
  runAutopilotForSite,
  resolveAutopilotUserId,
  checkProviderKey,
} from "@/lib/autopilot";
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

  // Log da execução manual — fica visível no /dashboard/autopilot.
  const run = await db.autopilotRun.create({
    data: { siteId, status: "RUNNING" },
  });
  const t0 = Date.now();

  const finish = async (
    status: "OK" | "ERROR" | "SKIPPED",
    posted: number,
    errors: number,
    notes: string,
  ) => {
    await db.autopilotRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        posted,
        errors,
        durationMs: Date.now() - t0,
        notes: `MANUAL · ${notes}`.slice(0, 480),
      },
    });
    revalidatePath(`/dashboard/sites/${siteId}/autopilot`);
    revalidatePath(`/dashboard/autopilot`);
  };

  try {
    const site = await db.site.findUnique({
      where: { id: siteId },
      select: { autopilotEnabled: true, autopilotProvider: true },
    });
    if (!site) {
      const msg = "Site não encontrado.";
      await finish("ERROR", 0, 1, msg);
      return { ok: false, posted: 0, errors: 1, collected: 0, message: msg };
    }
    if (!site.autopilotEnabled) {
      const msg = "Piloto automático está desativado para este site.";
      await finish("SKIPPED", 0, 0, msg);
      return { ok: false, posted: 0, errors: 0, collected: 0, message: msg };
    }

    // Pré-checa BYOK do provider escolhido — evita loop silencioso por trend.
    const userId = await resolveAutopilotUserId();
    if (!userId) {
      const msg = "Nenhum admin disponível p/ BYOK.";
      await finish("ERROR", 0, 1, msg);
      return { ok: false, posted: 0, errors: 1, collected: 0, message: msg };
    }
    const keyError = await checkProviderKey(userId, site.autopilotProvider);
    if (keyError) {
      const provLabel = PROVIDER_LABEL[site.autopilotProvider];
      const userMsg = `Provedor selecionado é ${provLabel} mas não há chave BYOK cadastrada. Vá em Chaves IA ou troque o provedor nas configurações deste autopilot.`;
      await finish("ERROR", 0, 1, keyError);
      return { ok: false, posted: 0, errors: 1, collected: 0, message: userMsg };
    }

    // Força coleta global + por site (collectActiveSources com {} pega ambos).
    let collected = 0;
    try {
      const summary = await collectActiveSources({});
      collected = summary.inserted;
    } catch {
      // segue mesmo se uma fonte falhar
    }

    const summary = await runAutopilotForSite(siteId);

    const status: "OK" | "ERROR" | "SKIPPED" =
      summary.posted > 0 ? "OK" : summary.errors > 0 ? "ERROR" : "SKIPPED";

    const message =
      summary.posted > 0
        ? `Publicou ${summary.posted} pauta(s)${summary.errors > 0 ? ` · ${summary.errors} falharam` : ""}.`
        : summary.errors > 0
          ? `Tentou ${summary.errors} pauta(s) e todas falharam. Detalhes: ${summary.details.slice(0, 2).join(" · ")}`
          : `Sem pautas NEW pra processar${collected > 0 ? ` (coleta trouxe ${collected} novas, mas filtros descartaram tudo)` : " — todas as fontes não trouxeram nada novo. Verifique se os feeds estão vivos em /dashboard/sources"}.`;

    await finish(status, summary.posted, summary.errors, `+${collected} novas na coleta · ${summary.details.join(" · ")}`);

    return { ok: summary.posted > 0, posted: summary.posted, errors: summary.errors, collected, message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finish("ERROR", 0, 1, `throw: ${msg}`);
    return { ok: false, posted: 0, errors: 1, collected: 0, message: `Erro inesperado: ${msg}` };
  }
}
