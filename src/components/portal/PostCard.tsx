// Card de post em variantes (grid, horizontal, compact). Sempre evita anchor aninhada:
// CategoryBadge fica FORA do Link do título, com z-10 sobre o overlay clicável.
import Link from "next/link";
import { safeImageUrl } from "@/lib/portal/safe-url";
import { CategoryBadge } from "./CategoryBadge";
import { PostMeta } from "./PostMeta";
import type { PortalPost } from "./types";

export function PostCardGrid({ post }: { post: PortalPost }) {
  const src = safeImageUrl(post.imageUrl);
  return (
    <article className="group relative">
      <div className="relative aspect-video overflow-hidden rounded-md bg-neutral-100">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={post.heroAlt ?? post.title}
            width={800}
            height={450}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            Sem imagem
          </div>
        )}
      </div>
      <div className="mt-3">
        {post.category && (
          <div className="relative z-10">
            <CategoryBadge category={post.category} />
          </div>
        )}
        <h3 className="mt-2 line-clamp-3 text-lg font-semibold leading-snug text-neutral-900 group-hover:text-(--portal-primary,#111)">
          <Link
            href={`/${post.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-neutral-900 focus-visible:after:ring-offset-2"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{post.excerpt}</p>
        )}
        <PostMeta
          className="mt-2"
          authorName={post.authorName}
          publishedAt={post.publishedAt}
          readingMinutes={post.readingMinutes}
        />
      </div>
    </article>
  );
}

export function PostCardHorizontal({ post }: { post: PortalPost }) {
  const src = safeImageUrl(post.imageUrl);
  return (
    <article className="group relative flex gap-4">
      <div className="relative aspect-4/3 w-32 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-40">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={post.heroAlt ?? post.title}
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
        {post.category && (
          <div className="relative z-10">
            <CategoryBadge category={post.category} />
          </div>
        )}
        <h3 className="mt-1.5 line-clamp-3 text-base font-semibold leading-snug text-neutral-900 group-hover:text-(--portal-primary,#111) sm:text-lg">
          <Link
            href={`/${post.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-neutral-900"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{post.excerpt}</p>
        )}
        <PostMeta
          className="mt-1.5"
          authorName={post.authorName}
          publishedAt={post.publishedAt}
          readingMinutes={post.readingMinutes}
        />
      </div>
    </article>
  );
}

export function PostCardCompact({
  post,
  showImage = false,
}: {
  post: PortalPost;
  showImage?: boolean;
}) {
  const src = safeImageUrl(post.imageUrl);
  return (
    <article className="group relative flex items-start gap-3">
      {showImage && src ? (
        <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={post.heroAlt ?? post.title}
            width={64}
            height={64}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-(--portal-primary,#111)">
          <Link
            href={`/${post.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-neutral-900"
          >
            {post.title}
          </Link>
        </h3>
        {post.category && (
          <div className="relative z-10 mt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {post.category.name}
          </div>
        )}
      </div>
    </article>
  );
}
