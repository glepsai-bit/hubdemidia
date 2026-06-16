// Página de matéria do portal — estilo editorial (G1/InfoMoney).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";
import { recordView } from "@/lib/analytics";
import { getRelatedPosts } from "@/lib/portal/queries";
import { safeImageUrl } from "@/lib/portal/safe-url";
import { articleMetadata, absoluteUrl } from "@/lib/seo/metadata";
import { articleLd, breadcrumbLd, ldScript } from "@/lib/seo/jsonld";
import {
  ArticleBody,
  Breadcrumb,
  CategoryBadge,
  PostMeta,
  RelatedPosts,
  ShareButtons,
  type BreadcrumbItem,
} from "@/components/portal";

type Params = Promise<{ host: string; slug: string }>;

export const revalidate = 60;

async function load(params: Params) {
  const { host, slug } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) return null;
  const post = await db.post.findFirst({
    where: { siteId: site.id, slug, status: "PUBLISHED" },
    include: {
      category: { select: { id: true, slug: true, name: true, color: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  });
  if (!post) return null;
  return { site, post };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Não encontrado" };
  return articleMetadata(
    {
      name: data.site.name,
      slug: data.site.slug,
      domain: data.site.domain,
      description: data.site.description,
      tagline: data.site.tagline,
      language: data.site.language,
    },
    {
      title: data.post.title,
      excerpt: data.post.excerpt,
      imageUrl: data.post.imageUrl,
      heroAlt: data.post.heroAlt,
      slug: data.post.slug,
      publishedAt: data.post.publishedAt,
      authorName: data.post.authorName,
    },
  );
}

export default async function TenantPost({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { site, post } = data;

  await recordView({ siteId: site.id, postId: post.id, path: `/${post.slug}` });

  const related = await getRelatedPosts(site.id, post.id, post.categoryId, 4);

  const breadcrumb: BreadcrumbItem[] = [
    { name: "Capa", href: "/" },
    ...(post.category ? [{ name: post.category.name, href: `/c/${post.category.slug}` }] : []),
    { name: post.title },
  ];

  const siteRef = {
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    logoUrl: site.logoUrl,
    description: site.description,
  };
  const url = absoluteUrl({ slug: site.slug, domain: site.domain }, `/${post.slug}`);
  const ldArticle = articleLd(siteRef, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    imageUrl: post.imageUrl,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    authorName: post.authorName,
    category: post.category ? { name: post.category.name } : null,
  });
  const ldBreadcrumb = breadcrumbLd(
    siteRef,
    breadcrumb.map((b) => ({ name: b.name, url: b.href ?? `/${post.slug}` })),
  );

  return (
    <article className="mx-auto max-w-3xl">
      <Breadcrumb items={breadcrumb} />

      <header className="mt-5 space-y-4">
        {post.category && <CategoryBadge category={post.category} size="md" />}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.625rem] lg:leading-[1.1]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-lg text-neutral-600 sm:text-xl">{post.excerpt}</p>
        )}
        <PostMeta
          authorName={post.authorName}
          publishedAt={post.publishedAt}
          readingMinutes={post.readingMinutes}
          lang={site.language}
        />
      </header>

      {(() => {
        const heroSrc = safeImageUrl(post.imageUrl);
        if (!heroSrc) return null;
        return (
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt={post.heroAlt ?? post.title}
            width={1200}
            height={675}
            className="aspect-video w-full rounded-lg object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {post.heroAlt && (
            <figcaption className="mt-2 text-sm text-neutral-500">{post.heroAlt}</figcaption>
          )}
        </figure>
        );
      })()}

      <div className="mt-8">
        <ArticleBody content={post.content} />
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <span
              key={tag.slug}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10">
        <ShareButtons url={url} title={post.title} />
      </div>

      <RelatedPosts posts={related} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldScript(ldArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldScript(ldBreadcrumb) }}
      />
    </article>
  );
}
