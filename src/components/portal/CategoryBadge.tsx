// Selo de editoria — usa cor da categoria como hint, com contraste WCAG automático.
import Link from "next/link";
import { bestTextColor } from "@/lib/portal/contrast";

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: { name: string; slug: string; color: string | null } | null;
  size?: "sm" | "md";
}) {
  if (!category) return null;
  const sizes = size === "md" ? "text-sm px-3 py-1" : "text-xs px-2.5 py-0.5";
  const bg = category.color ?? "#111111";
  const fg = bestTextColor(bg);
  return (
    <Link
      href={`/c/${category.slug}`}
      className={`inline-flex items-center font-semibold uppercase tracking-wide ${sizes} rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {category.name}
    </Link>
  );
}
