// Página de editoria: lista posts da categoria com hero do mais recente + grid.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveSiteByHost } from "@/lib/tenant";
import { recordView } from "@/lib/analytics";
import { getCategoryBySlug, listPublishedPosts, getMostRead } from "@/lib/portal/queries";
import { categoryMetadata } from "@/lib/seo/metadata";
import { breadcrumbLd, ldScript } from "@/lib/seo/jsonld";
import { safeImageUrl } from "@/lib/portal/safe-url";
import {
  Breadcrumb,
  MostReadList,
  PostCardGrid,
  PostCardHorizontal,
} from "@/components/portal";

type Params = Promise<{ host: string; categorySlug: string }>;

export const revalidate = 60;

async function load(params: Params, page: number) {
  const { host, categorySlug } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) return null;
  const category = await getCategoryBySlug(site.id, categorySlug);
  if (!category) return null;
  const pageSize = 16;
  const posts = await listPublishedPosts(site.id, {
    categoryId: category.id,
    take: pageSize,
    skip: (page - 1) * pageSize,
  });
  return { site, category, posts, page, pageSize };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const data = await load(params, page);
  if (!data) return { title: "Editoria não encontrada" };
  return categoryMetadata(
    {
      name: data.site.name,
      slug: data.site.slug,
      domain: data.site.domain,
      description: data.site.description,
    },
    {
      name: data.category.name,
      slug: data.category.slug,
      description: data.category.description,
    },
    page,
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const data = await load(params, page);
  if (!data) notFound();
  const { site, category, posts, pageSize } = data;

  await recordView({ siteId: site.id, path: `/c/${category.slug}` });

  const mostRead = await getMostRead(site.id, 7, 6);
  const hero = posts[0];
  const rest = posts.slice(1);

  const ldBreadcrumb = breadcrumbLd(
    { name: site.name, slug: site.slug, domain: site.domain, logoUrl: site.logoUrl },
    [
      { name: "Capa", url: "/" },
      { name: category.name, url: `/c/${category.slug}` },
    ],
  );

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { name: "Capa", href: "/" },
          { name: category.name },
        ]}
      />

      <header className="border-b-2 border-neutral-900 pb-3">
        <h1
          className="flex items-center gap-3 text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-4xl"
        >
          <span
            className="inline-block h-7 w-1.5"
            style={{ background: category.color ?? "var(--portal-primary, #111)" }}
            aria-hidden
          />
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-3xl text-neutral-600">{category.description}</p>
        )}
      </header>

      {posts.length === 0 && page === 1 ? (
        <p className="py-12 text-center text-neutral-500">
          Nenhuma matéria publicada nesta editoria.
        </p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            {hero && page === 1 && (() => {
              const heroSrc = safeImageUrl(hero.imageUrl);
              return (
              <article className="group relative">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-100">
                  {heroSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroSrc}
                      alt={hero.heroAlt ?? hero.title}
                      width={1200}
                      height={675}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="eager"
                      fetchPriority="high"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h2 className="text-2xl font-bold leading-tight text-neutral-900 group-hover:text-(--portal-primary,#111) sm:text-3xl">
                    <Link
                      href={`/${hero.slug}`}
                      className="outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-neutral-900 focus-visible:after:ring-offset-2"
                    >
                      {hero.title}
                    </Link>
                  </h2>
                  {hero.excerpt && (
                    <p className="mt-2 text-base text-neutral-600">{hero.excerpt}</p>
                  )}
                </div>
              </article>
              );
            })()}

            {page > 1 ? (
              <div className="space-y-6">
                {posts.map((p) => (
                  <PostCardHorizontal key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {rest.map((p) => (
                  <PostCardGrid key={p.id} post={p} />
                ))}
              </div>
            )}

            {/* Paginação */}
            <nav
              aria-label={`Paginação de ${category.name}`}
              className="flex items-center justify-between pt-4"
            >
              {page > 1 ? (
                <Link
                  href={`/c/${category.slug}?page=${page - 1}`}
                  rel="prev"
                  aria-label={`Ir para a página ${page - 1}`}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
                >
                  <span aria-hidden>←</span> Anterior
                </Link>
              ) : (
                <span />
              )}
              {posts.length === pageSize ? (
                <Link
                  href={`/c/${category.slug}?page=${page + 1}`}
                  rel="next"
                  aria-label={`Ir para a página ${page + 1}`}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
                >
                  Próxima <span aria-hidden>→</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
            <MostReadList posts={mostRead} />
          </aside>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldScript(ldBreadcrumb) }}
      />
    </div>
  );
}
