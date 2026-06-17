// Busca de imagem editorial no Pexels (free — 200 req/h, 20k/mês).
// Requer PEXELS_API_KEY no env. Sem chave, retorna null.
import type { ImageHit } from "./types";

interface PexelsSearchPayload {
  photos?: Array<{
    width?: number;
    height?: number;
    src?: { large2x?: string; large?: string; original?: string };
    photographer?: string;
  }>;
}

export async function searchPexels(query: string): Promise<ImageHit | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query.trim()) return null;

  const url =
    "https://api.pexels.com/v1/search" +
    `?query=${encodeURIComponent(query)}` +
    "&per_page=5&orientation=landscape";

  try {
    const res = await fetch(url, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PexelsSearchPayload;
    const photo = data.photos?.[0];
    if (!photo) return null;
    const photoUrl = photo.src?.large2x ?? photo.src?.large ?? photo.src?.original;
    if (!photoUrl) return null;
    return {
      url: photoUrl,
      source: "pexels",
      width: photo.width,
      height: photo.height,
      credit: photo.photographer ? `Foto: ${photo.photographer} / Pexels` : "Foto: Pexels",
    };
  } catch {
    return null;
  }
}
