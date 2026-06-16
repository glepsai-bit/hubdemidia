// "Leia também" — 3-4 cards relacionados ao fim da matéria.
import { PostCardGrid } from "./PostCard";
import type { PortalPost } from "./types";

export function RelatedPosts({ posts }: { posts: PortalPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related" className="mt-12">
      <h2
        id="related"
        className="mb-4 border-b-2 border-neutral-900 pb-2 text-xl font-bold uppercase tracking-tight text-neutral-900"
      >
        Leia também
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p) => (
          <PostCardGrid key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
