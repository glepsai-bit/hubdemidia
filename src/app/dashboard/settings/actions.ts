"use server";

import { revalidatePath } from "next/cache";
import type { AiProvider } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export type KeyState = { error?: string; ok?: string } | undefined;

const PROVIDERS: AiProvider[] = ["CLAUDE", "OPENAI", "GROK"];

/** Salva (ou substitui) a chave BYOK do usuário logado para um provedor. Nunca armazena em texto puro. */
export async function saveApiKey(_prev: KeyState, formData: FormData): Promise<KeyState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const provider = String(formData.get("provider") ?? "") as AiProvider;
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  if (!PROVIDERS.includes(provider)) return { error: "Provedor inválido." };
  if (apiKey.length < 8) return { error: "Chave de API muito curta." };

  let encrypted: string;
  try {
    encrypted = encrypt(apiKey);
  } catch {
    return { error: "Falha ao criptografar (verifique ENCRYPTION_KEY no ambiente)." };
  }

  await db.aiKey.upsert({
    where: { userId_provider: { userId: session.user.id, provider } },
    update: { encrypted },
    create: { userId: session.user.id, provider, encrypted },
  });

  revalidatePath("/dashboard/settings");
  return { ok: `Chave do ${provider} salva.` };
}

export async function deleteApiKey(provider: AiProvider): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await db.aiKey.deleteMany({ where: { userId: session.user.id, provider } });
  revalidatePath("/dashboard/settings");
}
