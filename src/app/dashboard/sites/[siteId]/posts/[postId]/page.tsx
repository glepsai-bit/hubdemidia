// Edição de um post.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostForm } from "@/components/PostForm";
import { Badge, Card, PageHeader, TextLink } from "@/components/ui";
import { assertSiteAccess } from "../../../actions";
import { updatePost } from "../actions";

export default async function PostEditPage({
  params,
}: {
  params: Promise<{ siteId: string; postId: string }>;
}) {
  const { siteId, postId } = await params;
  await assertSiteAccess(siteId);

  const [post, categories] = await Promise.all([
    db.post.findFirst({
      where: { id: postId, siteId },
      include: {
        site: true,
        tags: { include: { tag: { select: { name: true } } } },
      },
    }),
    db.category.findMany({
      where: { siteId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!post) notFound();

  const publicPath = `${post.site.slug}.${process.env.ROOT_DOMAIN}/${post.slug}`;
  const isPublished = post.status === "PUBLISHED";
  const tagsCsv = post.tags.map((t) => t.tag.name).join(", ");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <TextLink
          href={`/dashboard/sites/${siteId}`}
          className="text-sm text-neutral-500 no-underline hover:text-neutral-900"
        >
          ← {post.site.name}
        </TextLink>
        <PageHeader title="Editar post">
          <div className="flex items-center gap-2">
            <Badge tone={isPublished ? "success" : "neutral"}>
              {isPublished ? "Publicado" : "Rascunho"}
            </Badge>
            {post.featured && <Badge tone="warning">★ Destaque</Badge>}
          </div>
        </PageHeader>
        {isPublished && (
          <p className="text-sm text-neutral-500">
            <a
              href={`http://${publicPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900"
            >
              {publicPath} ↗
            </a>
          </p>
        )}
      </div>

      <Card className="p-6">
        <PostForm
          action={updatePost.bind(null, siteId, postId)}
          categories={categories}
          submitLabel="Salvar alterações"
          defaults={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            imageUrl: post.imageUrl,
            heroAlt: post.heroAlt,
            authorName: post.authorName,
            categoryId: post.categoryId,
            featured: post.featured,
            tags: tagsCsv,
          }}
        />
      </Card>
    </div>
  );
}
