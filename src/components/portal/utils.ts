// Formatadores e helpers de UI do portal.
export function formatDate(d: Date | null | undefined, lang = "pt-BR"): string {
  if (!d) return "";
  return new Intl.DateTimeFormat(lang, { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function formatDateTimeShort(d: Date | null | undefined, lang = "pt-BR"): string {
  if (!d) return "";
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(d: Date | null | undefined): string {
  if (!d) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
  return formatDate(d);
}
