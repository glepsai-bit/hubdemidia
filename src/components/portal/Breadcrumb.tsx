import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Trilha" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-neutral-900">
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? "text-neutral-900" : ""}>{item.name}</span>
              )}
              {!isLast && (
                <span aria-hidden className="text-neutral-500">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
