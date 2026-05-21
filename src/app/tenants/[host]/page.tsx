// Home pública de um site (resolvido por host via proxy). Lista os posts publicados.
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";
import { recordView } from "@/lib/analytics";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) notFound();

  await recordView({ siteId: site.id, path: "/" }); // analytics first-party

  const posts = await db.post.findMany({
    where: { siteId: site.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-12 border-b border-neutral-200 pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">{site.name}</h1>
        {site.description && <p className="mt-3 text-lg text-neutral-600">{site.description}</p>}
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">Nenhuma publicação ainda.</p>
      ) : (
        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/${post.slug}`} className="group block">
                <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-brand">
                  {post.title}
                </h2>
                {post.excerpt && <p className="mt-1.5 text-neutral-600">{post.excerpt}</p>}
                {post.publishedAt && (
                  <time className="mt-2 block text-sm text-neutral-400">
                    {post.publishedAt.toLocaleDateString("pt-BR")}
                  </time>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
