"use client";

// Navegação do painel: barra responsiva com destaque do item ativo e menu
// colapsável no mobile. Recebe papel/identidade do layout (Server Component).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { SignOutButton } from "./SignOutButton";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", exact: true },
  { href: "/dashboard/sites", label: "Sites" },
  { href: "/dashboard/generate", label: "Gerar" },
  { href: "/dashboard/trends", label: "Tendências" },
  { href: "/dashboard/sources", label: "Fontes" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

const ADMIN_NAV: NavItem[] = [{ href: "/dashboard/publish", label: "Publicação geral" }];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function DashboardNav({ email, isAdmin }: { email?: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = isAdmin ? [...NAV, ...ADMIN_NAV] : NAV;

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="mr-2 flex items-center gap-2 py-3 text-sm font-semibold tracking-tight text-neutral-900"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-neutral-900 text-xs font-bold text-white">
              H
            </span>
            HubDeMidia
          </Link>
          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(pathname, item)
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            className={cn(
              "hidden rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:block",
              pathname.startsWith("/dashboard/settings")
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            Configurações
          </Link>
          {email && (
            <span className="hidden max-w-[14rem] truncate text-sm text-neutral-400 lg:block">
              {email}
            </span>
          )}
          <div className="hidden sm:block">
            <SignOutButton />
          </div>
          {/* Botão do menu mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Painel mobile */}
      {open && (
        <nav className="border-t border-neutral-200 bg-white px-4 py-2 md:hidden">
          {[...items, { href: "/dashboard/settings", label: "Configurações" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium",
                isActive(pathname, item)
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 px-3 pt-3">
            {email && <span className="truncate text-sm text-neutral-400">{email}</span>}
            <SignOutButton />
          </div>
        </nav>
      )}
    </header>
  );
}
