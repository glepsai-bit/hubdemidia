// Footer do portal: nome, ano, RSS.
import Link from "next/link";
import type { NavCategory, PortalSite } from "./types";

export function PortalFooter({
  site,
  categories,
}: {
  site: PortalSite;
  categories: NavCategory[];
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="text-base font-bold text-neutral-900">{site.name}</div>
            {site.description && (
              <p className="mt-2 text-sm text-neutral-600">{site.description}</p>
            )}
          </div>
          {categories.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Editorias
              </div>
              <ul className="space-y-1">
                {categories.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/c/${c.slug}`}
                      className="text-sm text-neutral-700 hover:text-neutral-900"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Acompanhe
            </div>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/feed.xml" className="text-neutral-700 hover:text-neutral-900">
                  Feed RSS
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-neutral-700 hover:text-neutral-900">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          © {year} {site.name}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
