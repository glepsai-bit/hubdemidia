// Bloco hero da capa: 1 manchete principal grande + 3 destaques secundários.
// Padrão "stretched-link": article inteiro é clicável via overlay no Link do título,
// mas o CategoryBadge (que é um <Link>) fica FORA dessa âncora — evita <a> dentro de <a>.
import Link from "next/link";
import { safeImageUrl } from "@/lib/portal/safe-url";
import { CategoryBadge } from "./CategoryBadge";
import { PostMeta } from "./PostMeta";
import type { PortalPost } from "./types";

export function FeaturedHero({
  hero,
  secondary,
}: {
  hero: PortalPost;
  secondary: PortalPost[];
}) {
  const heroSrc = safeImageUrl(hero.imageUrl);
  return (
    <section className="grid gap-6 lg:grid-cols-3" aria-label="Manchete e destaques">
      {/* Hero principal — 2/3 da grade no desktop */}
      <article className="group relative lg:col-span-2">
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
          {hero.category && (
            <div className="relative z-10">
              <CategoryBadge category={hero.category} size="md" />
            </div>
          )}
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-neutral-900 group-hover:text-(--portal-primary,#111) sm:text-4xl lg:text-5xl lg:leading-[1.05]">
            <Link
              href={`/${hero.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-neutral-900 focus-visible:after:ring-offset-2"
            >
              {hero.title}
            </Link>
          </h2>
          {hero.excerpt && (
            <p className="mt-2 text-base text-neutral-600 sm:text-lg">{hero.excerpt}</p>
          )}
          <PostMeta
            className="mt-3"
            authorName={hero.authorName}
            publishedAt={hero.publishedAt}
            readingMinutes={hero.readingMinutes}
          />
        </div>
      </article>

      {/* Destaques laterais — 1/3 */}
      <aside className="space-y-5">
        {secondary.map((p) => {
          const src = safeImageUrl(p.imageUrl);
          return (
          <article key={p.id} className="group relative flex gap-3">
            <div className="relative aspect-4/3 w-32 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-36">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={p.heroAlt ?? p.title}
                  width={400}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                  —
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {p.category && (
                <div className="relative z-10">
                  <CategoryBadge category={p.category} />
                </div>
              )}
              <h3 className="mt-1.5 line-clamp-3 text-base font-semibold leading-snug text-neutral-900 group-hover:text-(--portal-primary,#111)">
                <Link
                  href={`/${p.slug}`}
                  className="outline-none after:absolute after:inset-0 after:rounded after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-neutral-900"
                >
                  {p.title}
                </Link>
              </h3>
            </div>
          </article>
          );
        })}
      </aside>
    </section>
  );
}
