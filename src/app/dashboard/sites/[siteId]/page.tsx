// Detalhe do site: editar dados (admin), gerenciar posts e publicar manualmente.
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteForm } from "@/components/SiteForm";
import { PostForm } from "@/components/PostForm";
import { Badge, Button, Card, EmptyState, PageHeader, TextLink } from "@/components/ui";
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
    <div className="space-y-8">
      <div className="space-y-3">
        <TextLink href="/dashboard/sites" className="text-sm text-neutral-500 no-underline hover:text-neutral-900">
          ← Sites
        </TextLink>
        <PageHeader
          title={site.name}
          description={`${site.domain ?? `${site.slug}.${process.env.ROOT_DOMAIN}`} · ${site.status}`}
        />
      </div>

      {/* Posts */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-neutral-900">Posts</h2>
        {site.posts.length === 0 ? (
          <EmptyState>Nenhum post ainda. Crie o primeiro abaixo.</EmptyState>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {site.posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/sites/${site.id}/posts/${post.id}`}
                    className="font-medium text-neutral-900 hover:text-brand"
                  >
                    {post.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-neutral-500">
                    <Badge tone={post.status === "PUBLISHED" ? "success" : "neutral"}>
                      {post.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                    </Badge>
                    {post.seoScore != null && <Badge tone="info">SEO {post.seoScore}</Badge>}
                    {post.createdByAi && <Badge tone="info">IA</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {post.status === "PUBLISHED" ? (
                    <form action={unpublishPost.bind(null, site.id, post.id)}>
                      <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                        Despublicar
                      </Button>
                    </form>
                  ) : (
                    <form action={publishPost.bind(null, site.id, post.id)}>
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                        Publicar
                      </Button>
                    </form>
                  )}
                  <Link
                    href={`/dashboard/sites/${site.id}/posts/${post.id}`}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    Editar
                  </Link>
                  <form action={deletePost.bind(null, site.id, post.id)}>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                      Excluir
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Novo post */}
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Novo post</h2>
        <PostForm action={createPost.bind(null, site.id)} submitLabel="Criar post (rascunho)" />
      </Card>

      {/* Configurações do site (admin) */}
      {isAdmin && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Configurações do site</h2>
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
          <form action={deleteSite.bind(null, site.id)} className="mt-6 border-t border-neutral-200 pt-4">
            <Button variant="danger" size="sm">
              Excluir site
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
