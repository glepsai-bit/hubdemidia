// Scraper de artigo — extrai título e corpo de uma URL pública.
// Best-effort: tenta seletores comuns; se falhar volta {title: undefined, text: undefined}.
// Nunca lança: pipeline continua mesmo se o scrape falhar.
import { parse } from "node-html-parser";

const TIMEOUT_MS = 12_000;
const UA = "Mozilla/5.0 (compatible; HubDeMidiaBot/1.0; +https://hub.gleps.com.br)";

const CONTENT_SELECTORS = [
  "article",
  "main article",
  "[itemtype*='Article']",
  "[itemtype*='NewsArticle']",
  ".article-body",
  ".post-content",
  ".entry-content",
  ".content-body",
  "main",
];

export interface ScrapedArticle {
  title?: string;
  text?: string;
  description?: string;
}

/** Faz fetch e extrai conteúdo. Sempre retorna objeto (nunca lança). */
export async function extractArticle(url: string): Promise<ScrapedArticle> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,*/*;q=0.8" },
      redirect: "follow",
    });
    if (!res.ok) return {};
    const html = await res.text();
    const root = parse(html, {
      blockTextElements: { script: false, noscript: false, style: false, pre: true },
    });

    // Limpa ruído.
    root.querySelectorAll("script, style, noscript, nav, footer, aside, header, .ads, .ad, [class*='related']").forEach((n) => n.remove());

    const title =
      root.querySelector("h1")?.text?.trim() ||
      root.querySelector("meta[property='og:title']")?.getAttribute("content")?.trim() ||
      root.querySelector("title")?.text?.trim();

    const description =
      root.querySelector("meta[property='og:description']")?.getAttribute("content")?.trim() ||
      root.querySelector("meta[name='description']")?.getAttribute("content")?.trim();

    // Tenta cada seletor de "container do artigo".
    let container = null;
    for (const sel of CONTENT_SELECTORS) {
      container = root.querySelector(sel);
      if (container) break;
    }
    const root2 = container ?? root;

    const paragraphs = root2
      .querySelectorAll("p")
      .map((p) => p.text.replace(/\s+/g, " ").trim())
      .filter((t) => t.length > 60); // descarta crumbs/legenda

    const text = paragraphs.slice(0, 30).join("\n\n");
    if (text.length < 200) {
      return { title, description, text: undefined };
    }
    return { title, description, text };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}
