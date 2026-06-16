// Capa do portal: manchete principal, destaques, blocos por editoria, mais lidas, últimas.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveSiteByHost } from "@/lib/tenant";
import { recordView } from "@/lib/analytics";
import { getHomepageData, listPublishedPosts } from "@/lib/portal/queries";
import {
  FeaturedHero,
  CategoryStrip,
  MostReadList,
  PostCardHorizontal,
  SectionTitle,
} from "@/components/portal";

export const revalidate = 60; // ISR: capa cacheada por 60s para performance

export default async function TenantHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) notFound();

  await recordView({ siteId: site.id, path: "/" });

  const data = await getHomepageData(site.id);

  // Total de posts publicados para mensagem de "vazio"
  if (!data.hero) {
    const total = await db.post.count({ where: { siteId: site.id, status: "PUBLISHED" } });
    if (total === 0) {
      return (
        <div className="py-16 text-center text-neutral-500">
          <h1 className="text-2xl font-bold text-neutral-900">{site.name}</h1>
          <p className="mt-2">Nenhuma matéria publicada ainda.</p>
        </div>
      );
    }
  }

  return (
    <div className="space-y-12">
      {/* h1 invisível para hierarquia semântica/SEO; a matéria principal continua em h2 no Hero */}
      <h1 className="sr-only">{site.name}{site.tagline ? ` — ${site.tagline}` : ""}</h1>

      {/* HERO + destaques */}
      {data.hero && <FeaturedHero hero={data.hero} secondary={data.secondary} />}

      {/* Mais lidas + Últimas em 2 colunas (desktop) */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="ultimas" className="space-y-6">
          <SectionTitle id="ultimas">Últimas</SectionTitle>
          <div className="space-y-6">
            {data.latest.length === 0 ? (
              <p className="text-neutral-500">Sem matérias recentes.</p>
            ) : (
              data.latest.slice(0, 8).map((p) => <PostCardHorizontal key={p.id} post={p} />)
            )}
          </div>
        </section>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <MostReadList posts={data.mostRead} />
        </aside>
      </div>

      {/* Blocos por editoria */}
      {data.categoryBlocks.map(({ category, posts }) => (
        <CategoryStrip key={category.id} category={category} posts={posts} />
      ))}

      {/* Fallback: se não houver editorias, mostra mais um bloco de últimas */}
      {data.categoryBlocks.length === 0 && (
        <FallbackMore siteId={site.id} excludeIds={[data.hero?.id, ...data.secondary.map((p) => p.id), ...data.latest.map((p) => p.id)].filter(Boolean) as string[]} />
      )}
    </div>
  );
}

async function FallbackMore({
  siteId,
  excludeIds,
}: {
  siteId: string;
  excludeIds: string[];
}) {
  const more = await listPublishedPosts(siteId, { take: 8, excludeIds });
  if (more.length === 0) return null;
  return (
    <section>
      <SectionTitle>Mais notícias</SectionTitle>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {more.map((p) => (
          <PostCardHorizontal key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
