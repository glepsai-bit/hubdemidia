// Valida uma URL de feed antes de cadastrar como fonte.
// Devolve quantidade de itens e amostra dos 3 primeiros títulos.
// Requer sessão autenticada — não precisa de cron secret pois é só pra validação dentro do painel.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchFeed } from "@/lib/trends/rss";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

  let body: { url?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) return NextResponse.json({ ok: false, error: "URL é obrigatória." }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: "URL precisa começar com http(s)://" }, { status: 400 });
  }

  try {
    const items = await fetchFeed(url);
    const titles = items.slice(0, 3).map((it) => it.title);
    if (items.length === 0) {
      return NextResponse.json({
        ok: false,
        count: 0,
        error: "Feed respondeu, mas não tem itens. URL provavelmente está abandonada — não cadastre.",
      });
    }
    return NextResponse.json({ ok: true, count: items.length, titles });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: `Falha ao buscar o feed: ${msg}` });
  }
}
