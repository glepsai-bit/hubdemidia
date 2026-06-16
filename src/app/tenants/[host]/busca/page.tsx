// Busca: case-insensitive em título/excerpt/conteúdo do site corrente.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSiteByHost } from "@/lib/tenant";
import { recordView } from "@/lib/analytics";
import { searchPosts } from "@/lib/portal/queries";
import { PostCardHorizontal, SectionTitle } from "@/components/portal";

type Params = Promise<{ host: string }>;

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false },
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ q?: string }>;
}) {
  const { host } = await params;
  const { q = "" } = await searchParams;

  const site = await resolveSiteByHost(decodeURIComponent(host));
  if (!site) notFound();

  await recordView({ siteId: site.id, path: `/busca?q=${encodeURIComponent(q)}` });

  const term = q.trim();
  const results = term.length >= 2 ? await searchPosts(site.id, term, 50) : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Buscar</h1>
        <form action="/busca" method="get" className="mt-4">
          <label htmlFor="q" className="sr-only">
            Termo
          </label>
          <div className="flex max-w-2xl gap-2">
            <input
              id="q"
              name="q"
              defaultValue={term}
              placeholder="O que você está procurando?"
              className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Buscar
            </button>
          </div>
        </form>
      </header>

      {term.length === 0 ? (
        <p className="text-neutral-500">Digite ao menos 2 caracteres para buscar.</p>
      ) : term.length < 2 ? (
        <p className="text-neutral-500">Digite ao menos 2 caracteres.</p>
      ) : results.length === 0 ? (
        <p className="text-neutral-500">
          Nenhum resultado para <strong className="text-neutral-900">“{term}”</strong>.
        </p>
      ) : (
        <section>
          <SectionTitle>
            {results.length} resultado{results.length === 1 ? "" : "s"} para “{term}”
          </SectionTitle>
          <div className="space-y-6">
            {results.map((p) => (
              <PostCardHorizontal key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
