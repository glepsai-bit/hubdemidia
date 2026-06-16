"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { themeSchema, normalizeHex } from "@/lib/validation";
import { assertSiteAccess } from "../../actions";
import type { ActionState } from "../../actions";

export async function updateTheme(
  siteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSiteAccess(siteId);

  const parsed = themeSchema.safeParse({
    primaryColor: formData.get("primaryColor") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    tagline: formData.get("tagline") ?? "",
    language: formData.get("language") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  await db.site.update({
    where: { id: siteId },
    data: {
      primaryColor: normalizeHex(data.primaryColor),
      logoUrl: data.logoUrl || null,
      tagline: data.tagline || null,
      language: (data.language && data.language.trim()) || "pt-BR",
    },
  });
  revalidatePath(`/dashboard/sites/${siteId}/theme`);
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { error: undefined };
}
