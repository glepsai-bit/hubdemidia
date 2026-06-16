// Linha de meta da matéria: autor · data · tempo de leitura.
import { formatDate } from "./utils";

export function PostMeta({
  authorName,
  publishedAt,
  readingMinutes,
  className,
  lang,
}: {
  authorName?: string | null;
  publishedAt: Date | null;
  readingMinutes?: number | null;
  className?: string;
  lang?: string;
}) {
  const parts: string[] = [];
  if (authorName) parts.push(`Por ${authorName}`);
  if (publishedAt) parts.push(formatDate(publishedAt, lang));
  if (readingMinutes && readingMinutes > 0) parts.push(`${readingMinutes} min de leitura`);
  if (parts.length === 0) return null;
  return (
    <div className={`text-sm text-neutral-500 ${className ?? ""}`}>
      {parts.join(" · ")}
    </div>
  );
}
