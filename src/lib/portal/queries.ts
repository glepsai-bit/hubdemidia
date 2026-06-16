// Queries da camada pública (portal). Tudo escopado por siteId.
import { db } from "@/lib/db";

const POST_PUBLIC_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  imageUrl: true,
  heroAlt: true,
  publishedAt: true,
  authorName: true,
  readingMinutes: true,
  featured: true,
  category: { select: { id: true, slug: true, name: true, color: true } },
} as const;

export type PortalPostCard = Awaited<ReturnType<typeof listPublishedPosts>>[number];

/** Lista posts publicados (com filtros opcionais), ordenados por publishedAt desc. */
export async function listPublishedPosts(
  siteId: string,
  opts: { categoryId?: string; take?: number; skip?: number; excludeIds?: string[] } = {},
) {
  return db.post.findMany({
    where: {
      siteId,
      status: "PUBLISHED",
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.excludeIds?.length ? { id: { notIn: opts.excludeIds } } : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: opts.take ?? 20,
    skip: opts.skip ?? 0,
    select: POST_PUBLIC_SELECT,
  });
}

/** Dados da capa: hero (featured + recente), destaques, blocos por editoria, últimas. */
export async function getHomepageData(siteId: string) {
  // 1. Featured posts (curadoria) — mais recente vira hero, próximos viram destaques.
  const featured = await db.post.findMany({
    where: { siteId, status: "PUBLISHED", featured: true },
    orderBy: [{ publishedAt: "desc" }],
    take: 4,
    select: POST_PUBLIC_SELECT,
  });

  // 2. Se não há featured suficiente, completa com mais recentes.
  let hero = featured[0] ?? null;
  let secondary = featured.slice(1, 4);
  if (!hero) {
    const recent = await db.post.findMany({
      where: { siteId, status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }],
      take: 4,
      select: POST_PUBLIC_SELECT,
    });
    hero = recent[0] ?? null;
    secondary = recent.slice(1, 4);
  } else if (secondary.length < 3) {
    const fill = await db.post.findMany({
      where: {
        siteId,
        status: "PUBLISHED",
        id: { notIn: [hero.id, ...secondary.map((p) => p.id)] },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 3 - secondary.length,
      select: POST_PUBLIC_SELECT,
    });
    secondary = [...secondary, ...fill];
  }

  const usedIds = [hero?.id, ...secondary.map((p) => p.id)].filter(Boolean) as string[];

  // 3. Categorias ativas (com posts publicados) e suas matérias mais recentes.
  const categories = await db.category.findMany({
    where: { siteId, posts: { some: { status: "PUBLISHED" } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    take: 6,
  });
  const categoryBlocks = await Promise.all(
    categories.map(async (c) => ({
      category: c,
      posts: await db.post.findMany({
        where: { siteId, status: "PUBLISHED", categoryId: c.id, id: { notIn: usedIds } },
        orderBy: [{ publishedAt: "desc" }],
        take: 4,
        select: POST_PUBLIC_SELECT,
      }),
    })),
  );

  // 4. Mais lidas nos últimos 7 dias (via PageView count).
  const mostRead = await getMostRead(siteId, 7, 6, usedIds);

  // 5. Últimas (cronológicas) — exclui as já usadas no hero.
  const latest = await listPublishedPosts(siteId, { take: 12, excludeIds: usedIds });

  return { hero, secondary, categoryBlocks, mostRead, latest };
}

/** Posts mais lidos no período (dias). */
export async function getMostRead(
  siteId: string,
  days = 7,
  take = 6,
  excludeIds: string[] = [],
) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const grouped = await db.pageView.groupBy({
    by: ["postId"],
    where: { siteId, createdAt: { gte: since }, postId: { not: null } },
    _count: { postId: true },
    orderBy: { _count: { postId: "desc" } },
    take: take * 2, // pega mais e filtra
  });
  const ids = grouped.map((g) => g.postId).filter((id): id is string => !!id);
  if (ids.length === 0) return [];
  const posts = await db.post.findMany({
    where: {
      id: { in: ids, ...(excludeIds.length ? { notIn: excludeIds } : {}) },
      status: "PUBLISHED",
    },
    select: POST_PUBLIC_SELECT,
  });
  // Preserva a ordem do ranking.
  const byId = new Map(posts.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, take);
}

/** Resolve categoria por slug dentro de um site. */
export async function getCategoryBySlug(siteId: string, slug: string) {
  return db.category.findUnique({ where: { siteId_slug: { siteId, slug } } });
}

export async function listCategories(siteId: string) {
  return db.category.findMany({
    where: { siteId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

/** Posts relacionados: mesma categoria, exclui o próprio post. */
export async function getRelatedPosts(
  siteId: string,
  postId: string,
  categoryId: string | null,
  take = 4,
) {
  if (categoryId) {
    const related = await db.post.findMany({
      where: { siteId, status: "PUBLISHED", categoryId, id: { not: postId } },
      orderBy: [{ publishedAt: "desc" }],
      take,
      select: POST_PUBLIC_SELECT,
    });
    if (related.length >= take) return related;
    // Completa com gerais.
    const fill = await db.post.findMany({
      where: { siteId, status: "PUBLISHED", id: { notIn: [postId, ...related.map((r) => r.id)] } },
      orderBy: [{ publishedAt: "desc" }],
      take: take - related.length,
      select: POST_PUBLIC_SELECT,
    });
    return [...related, ...fill];
  }
  return db.post.findMany({
    where: { siteId, status: "PUBLISHED", id: { not: postId } },
    orderBy: [{ publishedAt: "desc" }],
    take,
    select: POST_PUBLIC_SELECT,
  });
}

/** Busca textual simples por título/excerpt/conteúdo (case-insensitive). */
export async function searchPosts(siteId: string, q: string, take = 30) {
  const term = q.trim();
  if (term.length < 2) return [];
  return db.post.findMany({
    where: {
      siteId,
      status: "PUBLISHED",
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { excerpt: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: [{ publishedAt: "desc" }],
    take,
    select: POST_PUBLIC_SELECT,
  });
}

/** Categorias do site para uso no menu/header do portal. */
export async function listNavCategories(siteId: string) {
  return db.category.findMany({
    where: { siteId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    take: 8,
    select: { id: true, name: true, slug: true, color: true },
  });
}
