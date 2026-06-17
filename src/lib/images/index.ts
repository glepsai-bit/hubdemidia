// Camada de imagem: orquestra busca em bancos grátis (Unsplash → Pexels).
// Devolve a URL relativa (/uploads/...) já persistida no volume — ou null.
import { searchUnsplash } from "./unsplash";
import { searchPexels } from "./pexels";
import { buildImageQuery } from "./keywords";
import { persistImageFromUrl } from "./persist";

export interface FindImageInput {
  title: string;
  keywords?: string[];
  categoryName?: string | null;
}

/** Tenta achar imagem no Unsplash, depois Pexels, depois (opcional) PT-only fallback.
 *  Já baixa e persiste. Retorna caminho /uploads/... ou null se nada bater. */
export async function findAndPersistStockImage(input: FindImageInput): Promise<string | null> {
  const baseQuery = buildImageQuery(input.title, input.keywords ?? [], input.categoryName);
  const queries = Array.from(new Set([baseQuery, input.title.slice(0, 40)])); // tentamos EN primeiro, depois título cru

  for (const q of queries) {
    if (!q.trim()) continue;
    // Unsplash
    const u = await searchUnsplash(q);
    if (u) {
      const saved = await persistImageFromUrl(u.url);
      if (saved) return saved;
    }
    // Pexels
    const p = await searchPexels(q);
    if (p) {
      const saved = await persistImageFromUrl(p.url);
      if (saved) return saved;
    }
  }
  return null;
}
