"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { runAutopilotNow, type RunAutopilotResult } from "@/app/dashboard/sites/[siteId]/autopilot/actions";

export function RunAutopilotButton({ siteId }: { siteId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<RunAutopilotResult | null>(null);

  function handleClick() {
    setResult(null);
    start(async () => {
      try {
        const res = await runAutopilotNow(siteId);
        setResult(res);
      } catch (e) {
        setResult({
          ok: false,
          posted: 0,
          errors: 1,
          collected: 0,
          message: `Erro: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" size="sm" disabled={pending} onClick={handleClick}>
        {pending ? "Executando..." : "Rodar agora"}
      </Button>
      {result && (
        <span
          className={
            "text-sm " +
            (result.ok
              ? "text-emerald-700"
              : result.errors > 0
                ? "text-red-700"
                : "text-amber-700")
          }
          role="status"
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
