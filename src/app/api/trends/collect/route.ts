// Trigger de coleta de tendências para automação (n8n/cron).
// Autoriza por header `x-cron-secret` (== CRON_SECRET) OU por sessão de admin.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { collectActiveSources } from "@/lib/trends";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret");

  let authorized = Boolean(secret && provided && provided === secret);
  if (!authorized) {
    const session = await auth();
    authorized = session?.user?.role === "ADMIN";
  }
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const summary = await collectActiveSources({});
  return NextResponse.json(summary);
}
