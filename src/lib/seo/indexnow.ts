// IndexNow — protocolo aberto (Bing, Yandex, Seznam) p/ avisar agregadores quando
// publicamos conteúdo novo. Acelera a indexação em segundos vs horas/dias.
// Setup: defina INDEXNOW_KEY=<32-64 hex chars>. A rota /<KEY>.txt é servida automaticamente.
import { siteOrigin } from "./metadata";

const ENDPOINT = "https://api.indexnow.org/indexnow";

export async function pingIndexNow(
  site: { slug: string; domain: string | null },
  postSlugs: string[],
): Promise<void> {
  const KEY = process.env.INDEXNOW_KEY;
  if (!KEY || postSlugs.length === 0) return;

  const origin = siteOrigin(site);
  const host = origin.replace(/^https?:\/\//, "");
  const urlList = postSlugs.map((s) => `${origin}/${s}`);

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${origin}/${KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // silencioso — a publicação não pode falhar por causa do ping
  }
}
