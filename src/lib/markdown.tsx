// Renderer de markdown para o corpo das matérias. react-markdown + GFM.
// Sanitiza por design (nada de HTML cru bruto). URLs de img filtradas (só http(s) ou /uploads).
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeImageUrl } from "@/lib/portal/safe-url";

interface Props {
  children: string;
  className?: string;
}

function isSafeHref(href: string | undefined): href is string {
  if (!href) return false;
  if (href.startsWith("#") || href.startsWith("/")) return true;
  return /^(https?|mailto|tel):/i.test(href);
}

export function Markdown({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: kids, ...rest }) => {
            if (!isSafeHref(href)) return <>{kids}</>;
            const external = /^https?:\/\//i.test(href);
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...rest}
              >
                {kids}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const safe = safeImageUrl(typeof src === "string" ? src : null);
            if (!safe) return null;
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={safe} alt={alt ?? ""} loading="lazy" />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
