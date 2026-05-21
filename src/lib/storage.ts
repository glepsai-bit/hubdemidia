// Storage de mídia local (V1). Persiste imagens geradas pela IA em /public/uploads
// e devolve o caminho público. (Em produção/escala, trocar por MinIO/S3 — ver ARQUITETURA.)
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { GeneratedImage } from "@/lib/ai/types";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Resolve uma imagem gerada para uma URL utilizável:
 * - se vier `url` (provedor hospeda), retorna a própria URL;
 * - se vier `b64`, salva como arquivo e retorna `/uploads/<id>.png`.
 * Retorna null se não houver imagem.
 */
export async function persistGeneratedImage(image: GeneratedImage): Promise<string | null> {
  if (image.url) return image.url;
  if (!image.b64) return null;

  await mkdir(UPLOADS_DIR, { recursive: true });
  const fileName = `${randomUUID()}.png`;
  await writeFile(path.join(UPLOADS_DIR, fileName), Buffer.from(image.b64, "base64"));
  return `/uploads/${fileName}`;
}
