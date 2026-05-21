// Cartão base do design system: borda sutil, fundo branco, leve sombra.
import { cn } from "./cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}
