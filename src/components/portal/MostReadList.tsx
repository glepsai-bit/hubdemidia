// "Mais lidas" — lista numerada (estilo G1).
import Link from "next/link";
import type { PortalPost } from "./types";

export function MostReadList({ posts }: { posts: PortalPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="mais-lidas">
      <h2
        id="mais-lidas"
        className="mb-4 border-b-2 border-neutral-900 pb-2 text-xl font-bold uppercase tracking-tight text-neutral-900"
      >
        Mais lidas
      </h2>
      <ol className="space-y-4">
        {posts.map((p, i) => (
          <li key={p.id} className="group flex gap-3">
            <span
              className="shrink-0 text-3xl font-extrabold leading-none"
              style={{ color: "var(--portal-primary, #c8102e)" }}
              aria-hidden
            >
              {i + 1}
            </span>
            <Link
              href={`/${p.slug}`}
              className="line-clamp-3 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-(--portal-primary,#111)"
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
