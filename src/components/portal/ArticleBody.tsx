// Corpo da matéria com tipografia editorial (prose-like custom).
import { Markdown } from "@/lib/markdown";

export function ArticleBody({ content }: { content: string }) {
  return (
    <Markdown
      className="portal-prose text-[1.05rem] leading-[1.7] text-neutral-800"
    >
      {content}
    </Markdown>
  );
}
