// Edição de um post.
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostForm } from "@/components/PostForm";
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

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/sites/${siteId}`} className="text-sm text-gray-500 hover:underline">
          ← {post.site.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar post</h1>
        <p className="text-sm text-gray-500">
          {post.status}
          {post.status === "PUBLISHED" && ` · ${publicPath}`}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
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
      </div>
    </div>
  );
}
