// Analytics first-party (self-host, custo zero): registra visualizações das páginas públicas
// e agrega métricas por site sob demanda. Sem dependência externa (alternativa barata a GA4/Plausible).
import { headers } from "next/headers";
import { db } from "@/lib/db";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|headless/i;

/** Registra uma visualização. Nunca lança (analytics não pode quebrar a página). Ignora bots. */
export async function recordView(input: {
  siteId: string;
  postId?: string;
  path: string;
}): Promise<void> {
  try {
    const h = await headers();
    const ua = h.get("user-agent") ?? "";
    if (!ua || BOT_RE.test(ua)) return; // ignora bots/prefetch óbvios

    await db.pageView.create({
      data: {
        siteId: input.siteId,
        postId: input.postId ?? null,
        path: input.path,
        referrer: h.get("referer") ?? null,
        country: h.get("x-vercel-ip-country") ?? null,
      },
    });
  } catch {
    // silencioso de propósito
  }
}

export interface SiteStats {
  totalAllTime: number;
  totalPeriod: number;
  days: number;
  byDay: { day: string; count: number }[];
  topPosts: { postId: string; title: string; count: number }[];
}

/** Agrega métricas de um site nos últimos `days` dias. */
export async function getSiteStats(siteId: string, days = 30): Promise<SiteStats> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalAllTime, totalPeriod, byDayRaw, topGrouped] = await Promise.all([
    db.pageView.count({ where: { siteId } }),
    db.pageView.count({ where: { siteId, createdAt: { gte: since } } }),
    db.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "PageView"
      WHERE "siteId" = ${siteId} AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    db.pageView.groupBy({
      by: ["postId"],
      where: { siteId, createdAt: { gte: since }, postId: { not: null } },
      _count: { postId: true },
      orderBy: { _count: { postId: "desc" } },
      take: 5,
    }),
  ]);

  const byDay = byDayRaw.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    count: Number(r.count),
  }));

  const postIds = topGrouped.map((g) => g.postId).filter((id): id is string => !!id);
  const posts = await db.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true },
  });
  const titleById = new Map(posts.map((p) => [p.id, p.title]));

  const topPosts = topGrouped
    .filter((g) => g.postId)
    .map((g) => ({
      postId: g.postId as string,
      title: titleById.get(g.postId as string) ?? "(post removido)",
      count: g._count.postId,
    }));

  return { totalAllTime, totalPeriod, days, byDay, topPosts };
}
