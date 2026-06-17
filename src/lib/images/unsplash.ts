// Busca de imagem editorial no Unsplash (free tier — 5000 req/h aprovado).
// Requer UNSPLASH_ACCESS_KEY no env. Sem chave, retorna null.
import type { ImageHit } from "./types";

interface UnsplashSearchPayload {
  results?: Array<{
    width?: number;
    height?: number;
    urls?: { regular?: string; full?: string };
    user?: { name?: string };
  }>;
}

export async function searchUnsplash(query: string): Promise<ImageHit | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query.trim()) return null;

  const url =
    "https://api.unsplash.com/search/photos" +
    `?query=${encodeURIComponent(query)}` +
    "&per_page=5&orientation=landscape&content_filter=high";

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as UnsplashSearchPayload;
    const photo = data.results?.[0];
    if (!photo) return null;
    const photoUrl = photo.urls?.regular ?? photo.urls?.full;
    if (!photoUrl) return null;
    return {
      url: photoUrl,
      source: "unsplash",
      width: photo.width,
      height: photo.height,
      credit: photo.user?.name ? `Foto: ${photo.user.name} / Unsplash` : "Foto: Unsplash",
    };
  } catch {
    return null;
  }
}
