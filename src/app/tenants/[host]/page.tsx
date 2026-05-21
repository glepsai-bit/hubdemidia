// Home pública de um site (resolvido por host via proxy). Lista os posts publicados.
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) notFound();

  const posts = await db.post.findMany({
    where: { siteId: site.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">{site.name}</h1>
        {site.description && <p className="mt-2 text-gray-600">{site.description}</p>}
      </header>

      {posts.length === 0 ? (
        <p className="text-gray-500">Nenhuma publicação ainda.</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/${post.slug}`} className="group block">
                <h2 className="text-xl font-semibold group-hover:underline">{post.title}</h2>
                {post.excerpt && <p className="mt-1 text-gray-600">{post.excerpt}</p>}
                {post.publishedAt && (
                  <time className="mt-1 block text-sm text-gray-400">
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
