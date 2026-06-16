// Botões de compartilhamento (links — sem JS, funciona em qualquer navegador).
export function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const items = [
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-neutral-200 py-3">
      <span className="text-sm font-medium text-neutral-700">Compartilhar:</span>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`Compartilhar no ${it.label} (abre em nova janela)`}
          className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}
