// Webhook de entrada: o n8n (ou cron) dispara a geração de conteúdo por IA para um site.
// Auth: header x-cron-secret (== CRON_SECRET) OU sessão de admin.
// A chave BYOK usada é a do usuário AUTOMATION_USER_EMAIL (ou o primeiro admin).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorizedAutomation } from "@/lib/automation";
import { generatePostForSite } from "@/lib/ai/generate";
import { notifyN8n } from "@/lib/n8n";
import type { ProviderName } from "@/lib/ai/types";

const PROVIDERS: ProviderName[] = ["claude", "openai", "grok"];

async function resolveAutomationUserId(): Promise<string | null> {
  const email = process.env.AUTOMATION_USER_EMAIL;
  if (email) {
    const u = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (u) return u.id;
  }
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

export async function POST(req: Request) {
  if (!(await isAuthorizedAutomation(req))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const siteId = String(body.siteId ?? "");
  const raw = String(body.raw ?? "").trim();
  const provider = (String(body.provider ?? "claude") as ProviderName);
  if (!siteId) return NextResponse.json({ error: "siteId é obrigatório." }, { status: 400 });
  if (raw.length < 20) return NextResponse.json({ error: "raw (texto) muito curto." }, { status: 400 });
  if (!PROVIDERS.includes(provider)) return NextResponse.json({ error: "provider inválido." }, { status: 400 });

  const site = await db.site.findUnique({ where: { id: siteId }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

  const userId = await resolveAutomationUserId();
  if (!userId) return NextResponse.json({ error: "Nenhum usuário de automação disponível." }, { status: 500 });

  const keywords = Array.isArray(body.keywords)
    ? (body.keywords as unknown[]).map(String)
    : typeof body.keywords === "string"
      ? body.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [];

  try {
    const result = await generatePostForSite({
      userId,
      siteId,
      provider,
      raw,
      niche: body.niche ? String(body.niche) : undefined,
      sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
      keywords,
      withImage: body.withImage === true,
      autoPublish: body.autoPublish === true,
    });
    await notifyN8n("post.generated", { siteId, ...result });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao gerar conteúdo." },
      { status: 500 },
    );
  }
}
