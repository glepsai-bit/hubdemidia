// Bloco de uma editoria na capa: título + 4 posts em grade.
import Link from "next/link";
import { PostCardGrid } from "./PostCard";
import type { PortalPost } from "./types";

export function CategoryStrip({
  category,
  posts,
}: {
  category: { id: string; slug: string; name: string; color: string | null };
  posts: PortalPost[];
}) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby={`cat-${category.slug}`}>
      <div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-neutral-900 pb-2">
        <h2
          id={`cat-${category.slug}`}
          className="flex items-center gap-2 text-xl font-bold uppercase tracking-tight text-neutral-900"
        >
          <span
            className="inline-block h-3 w-1.5"
            style={{ background: category.color ?? "var(--portal-primary, #111)" }}
            aria-hidden
          />
          {category.name}
        </h2>
        <Link
          href={`/c/${category.slug}`}
          className="whitespace-nowrap text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          Ver tudo →
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p) => (
          <PostCardGrid key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
