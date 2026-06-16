// Header editorial do portal: logo/nome + tagline, nav por editorias, busca.
// Client component p/ marcar a editoria ativa via usePathname + aria-current.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { safeImageUrl } from "@/lib/portal/safe-url";
import type { NavCategory, PortalSite } from "./types";

function isHomePath(path: string): boolean {
  return path === "/" || path === "";
}

function isCategoryActive(path: string, slug: string): boolean {
  return path === `/c/${slug}` || path.startsWith(`/c/${slug}/`);
}

export function PortalHeader({
  site,
  categories,
}: {
  site: PortalSite;
  categories: NavCategory[];
}) {
  const pathname = usePathname() ?? "/";
  const logoSrc = safeImageUrl(site.logoUrl);

  return (
    <header className="border-b border-neutral-200 bg-white">
      {/* Top: logo + busca */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 rounded"
          aria-label={`${site.name} — Capa`}
        >
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={site.name}
              className="h-9 w-auto"
              loading="eager"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: "var(--portal-primary, #111)" }}
                aria-hidden
              />
              <span className="text-xl font-extrabold tracking-tight text-neutral-900">
                {site.name}
              </span>
            </div>
          )}
          {site.tagline && (
            <span className="text-xs text-neutral-500 sm:text-sm">{site.tagline}</span>
          )}
        </Link>

        <form
          action="/busca"
          method="get"
          role="search"
          className="hidden items-center gap-2 sm:flex"
        >
          <label htmlFor="portal-q" className="sr-only">
            Buscar
          </label>
          <input
            id="portal-q"
            name="q"
            placeholder="Buscar..."
            className="w-56 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          />
        </form>
      </div>

      {/* Nav editorias */}
      {categories.length > 0 && (
        <nav className="border-t border-neutral-100 bg-neutral-50" aria-label="Editorias">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            <Link
              href="/"
              aria-current={isHomePath(pathname) ? "page" : undefined}
              className={navLinkClass(isHomePath(pathname))}
            >
              Capa
            </Link>
            {categories.map((c) => {
              const active = isCategoryActive(pathname, c.slug);
              return (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap ${navLinkClass(active)}`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

function navLinkClass(active: boolean): string {
  const base =
    "rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900";
  return active
    ? `${base} bg-white text-neutral-900 shadow-sm`
    : `${base} text-neutral-700 hover:bg-white hover:text-neutral-900`;
}
