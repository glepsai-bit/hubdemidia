// Hook do Next chamado UMA VEZ quando o servidor sobe. Aqui ligamos o autopilot.
// Só roda no Node runtime (não em edge/middleware).

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startAutopilotCron } = await import("@/lib/autopilot/cron");
  startAutopilotCron();
}
