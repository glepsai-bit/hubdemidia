// Baixa uma imagem por URL e salva em /public/uploads/<uuid>.<ext>.
// Devolve o caminho público (/uploads/...). Nunca lança — retorna null em falha.
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MIN_BYTES = 2000; // descarta thumbnails/placeholders
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const TIMEOUT_MS = 15_000;

function pickExt(contentType: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function persistImageFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (HubDeMidiaBot/1.0)" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES || buf.length > MAX_BYTES) return null;

    await mkdir(UPLOADS_DIR, { recursive: true });
    const ext = pickExt(res.headers.get("content-type"));
    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(path.join(UPLOADS_DIR, fileName), buf);
    return `/uploads/${fileName}`;
  } catch {
    return null;
  }
}
