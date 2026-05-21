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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← {site.name}
      </Link>
      <article className="mt-4">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {post.publishedAt && (
          <time className="mt-1 block text-sm text-gray-400">
            {post.publishedAt.toLocaleDateString("pt-BR")}
          </time>
        )}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={post.title} className="mt-6 w-full rounded-lg" />
        )}
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-800">
          {post.content}
        </div>
      </article>
    </main>
  );
}
