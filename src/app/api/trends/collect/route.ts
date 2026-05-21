// Trigger de coleta de tendências para automação (n8n/cron).
// Autoriza por header `x-cron-secret` (== CRON_SECRET) OU por sessão de admin.
import { NextResponse } from "next/server";
import { isAuthorizedAutomation } from "@/lib/automation";
import { collectActiveSources } from "@/lib/trends";

export async function POST(req: Request) {
  if (!(await isAuthorizedAutomation(req))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const summary = await collectActiveSources({});
  return NextResponse.json(summary);
}
