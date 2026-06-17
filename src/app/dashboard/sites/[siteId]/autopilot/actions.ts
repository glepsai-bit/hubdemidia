"use server";

import { revalidatePath } from "next/cache";
import type { AiProvider, AutopilotImageStrategy } from "@prisma/client";
import { db } from "@/lib/db";
import { autopilotSchema } from "@/lib/validation";
import { runAutopilotForSite } from "@/lib/autopilot";
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

/** Dispara o autopilot AGORA para esse site (admin/editor com acesso). */
export async function runAutopilotNow(siteId: string): Promise<void> {
  await assertSiteAccess(siteId);
  await runAutopilotForSite(siteId);
  revalidatePath(`/dashboard/sites/${siteId}/autopilot`);
  revalidatePath(`/dashboard/autopilot`);
}
