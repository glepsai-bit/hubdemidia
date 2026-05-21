// Webhooks de saída para o n8n. Fire-and-forget: nunca lança nem bloqueia o fluxo principal.
// Configurar N8N_WEBHOOK_URL no ambiente; sem ele, vira no-op.
const TIMEOUT_MS = 5000;

export type N8nEvent =
  | "trends.collected"
  | "post.published"
  | "posts.published_all"
  | "post.generated";

export async function notifyN8n(event: N8nEvent, payload: unknown): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, payload, at: new Date().toISOString() }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // silencioso: a automação externa não pode derrubar o painel
  }
}
