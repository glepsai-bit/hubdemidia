// Detalhe do site: editar dados (admin), gerenciar posts e publicar manualmente.
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteForm } from "@/components/SiteForm";
import { PostForm } from "@/components/PostForm";
import { assertSiteAccess, deleteSite, updateSite } from "../actions";
import { createPost, deletePost, publishPost, unpublishPost } from "./posts/actions";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const session = await assertSiteAccess(siteId);
  const isAdmin = session.user.role === "ADMIN";

  const site = await db.site.findUnique({
    where: { id: siteId },
    include: { posts: { orderBy: { updatedAt: "desc" } } },
  });
  if (!site) notFound();

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard/sites" className="text-sm text-gray-500 hover:underline">
          ← Sites
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{site.name}</h1>
        <p className="text-sm text-gray-500">
          {site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · {site.status}
        </p>
      </div>

      {/* Posts */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Posts</h2>
        {site.posts.length === 0 ? (
          <p className="text-gray-500">Nenhum post ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {site.posts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/sites/${site.id}/posts/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {post.status}
                    {post.seoScore != null && ` · SEO ${post.seoScore}`}
                    {post.createdByAi && " · IA"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  {post.status === "PUBLISHED" ? (
                    <form action={unpublishPost.bind(null, site.id, post.id)}>
                      <button className="text-amber-600 hover:underline">Despublicar</button>
                    </form>
                  ) : (
                    <form action={publishPost.bind(null, site.id, post.id)}>
                      <button className="text-green-600 hover:underline">Publicar</button>
                    </form>
                  )}
                  <Link
                    href={`/dashboard/sites/${site.id}/posts/${post.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <form action={deletePost.bind(null, site.id, post.id)}>
                    <button className="text-red-600 hover:underline">Excluir</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Novo post */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Novo post</h2>
        <PostForm action={createPost.bind(null, site.id)} submitLabel="Criar post (rascunho)" />
      </section>

      {/* Configurações do site (admin) */}
      {isAdmin && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Configurações do site</h2>
          <SiteForm
            action={updateSite.bind(null, site.id)}
            submitLabel="Salvar alterações"
            defaults={{
              name: site.name,
              slug: site.slug,
              domain: site.domain,
              description: site.description,
              status: site.status,
            }}
          />
          <form action={deleteSite.bind(null, site.id)} className="mt-6 border-t border-gray-200 pt-4">
            <button className="text-sm text-red-600 hover:underline">Excluir site</button>
          </form>
        </section>
      )}
    </div>
  );
}
