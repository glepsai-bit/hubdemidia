// Título de seção do portal (linha grossa embaixo, caixa alta).
export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mb-4 border-b-2 border-neutral-900 pb-2 text-xl font-bold uppercase tracking-tight text-neutral-900"
    >
      {children}
    </h2>
  );
}
