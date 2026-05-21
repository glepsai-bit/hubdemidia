// Selo de status compacto, com tonalidades semânticas.
import { cn } from "./cn";

export type BadgeTone = "neutral" | "success" | "warning" | "info" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
