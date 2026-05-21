// Estado vazio: moldura tracejada com mensagem centralizada.
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/40 px-6 py-10 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
