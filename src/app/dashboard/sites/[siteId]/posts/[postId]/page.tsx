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

  const post = await db.post.findFirst({
    where: { id: postId, siteId },
    include: { site: true },
  });
  if (!post) notFound();

  const publicPath = `${post.site.slug}.${process.env.ROOT_DOMAIN}/${post.slug}`;
  const isPublished = post.status === "PUBLISHED";

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
          <Badge tone={isPublished ? "success" : "neutral"}>
            {isPublished ? "Publicado" : "Rascunho"}
          </Badge>
        </PageHeader>
        {isPublished && <p className="text-sm text-neutral-500">{publicPath}</p>}
      </div>

      <Card className="p-6">
        <PostForm
          action={updatePost.bind(null, siteId, postId)}
          submitLabel="Salvar alterações"
          defaults={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            imageUrl: post.imageUrl,
          }}
        />
      </Card>
    </div>
  );
}
