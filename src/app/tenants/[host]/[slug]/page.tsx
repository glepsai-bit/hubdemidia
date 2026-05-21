// Post público individual (resolvido por host + slug).
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";
import { recordView } from "@/lib/analytics";

type Params = Promise<{ host: string; slug: string }>;

async function load(params: Params) {
  const { host, slug } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) return null;
  const post = await db.post.findFirst({
    where: { siteId: site.id, slug, status: "PUBLISHED" },
  });
  if (!post) return null;
  return { site, post };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Não encontrado" };
  return {
    title: `${data.post.title} · ${data.site.name}`,
    description: data.post.excerpt ?? undefined,
  };
}

export default async function TenantPost({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { site, post } = data;

  await recordView({ siteId: site.id, postId: post.id, path: `/${post.slug}` }); // analytics

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {site.name}
      </Link>
      <article className="mt-6">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900">
          {post.title}
        </h1>
        {post.publishedAt && (
          <time className="mt-3 block text-sm text-neutral-400">
            {post.publishedAt.toLocaleDateString("pt-BR")}
          </time>
        )}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={post.title} className="mt-8 w-full rounded-xl" />
        )}
        <div className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-neutral-800">
          {post.content}
        </div>
      </article>
    </main>
  );
}
