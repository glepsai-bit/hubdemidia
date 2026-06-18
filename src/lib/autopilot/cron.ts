// Worker interno do autopilot — roda a cada AUTOPILOT_INTERVAL_MINUTES.
// Singleton (lock global por process) — não dispara overlapping.
// Desliga sozinho se AUTOPILOT_ENABLED não for "true".

import { runAutopilotAll } from "./index";

let started = false;
let running = false;

async function tick() {
  if (running) {
    console.log("[autopilot] já em execução — pulando este tick");
    return;
  }
  running = true;
  const t0 = Date.now();
  try {
    const summary = await runAutopilotAll({ collectFirst: true });
    const sites = summary.perSite.map((s) => `${s.siteName}(+${s.posted}/✗${s.errors})`).join(", ");
    console.log(
      `[autopilot] tick ${Date.now() - t0}ms ` +
        `sites=${summary.sitesProcessed} +${summary.posted} ✗${summary.errors}` +
        (sites ? ` ${sites}` : " (sem sites ativos no DB)"),
    );
    if (summary.sitesProcessed === 0) {
      console.log("[autopilot] DEBUG: nenhum site com autopilotEnabled=true encontrado");
    }
  } catch (e) {
    console.error("[autopilot] tick erro:", e);
  } finally {
    running = false;
  }
}

/** Inicia o loop. Idempotente — chamadas extras viram no-op. */
export function startAutopilotCron(): void {
  if (started) return;
  if (process.env.AUTOPILOT_ENABLED !== "true") {
    console.log("[autopilot] desabilitado (AUTOPILOT_ENABLED != true)");
    return;
  }

  const intervalMin = Math.max(
    5,
    parseInt(process.env.AUTOPILOT_INTERVAL_MINUTES ?? "120", 10) || 120,
  );
  const intervalMs = intervalMin * 60_000;
  const bootDelayMs = 60_000; // 1 min após o boot pra estabilizar

  console.log(`[autopilot] habilitado — intervalo ${intervalMin}min (1º tick em 60s)`);
  started = true;
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), intervalMs);
  }, bootDelayMs);
}
