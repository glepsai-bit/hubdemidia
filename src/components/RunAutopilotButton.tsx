"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { runAutopilotNow } from "@/app/dashboard/sites/[siteId]/autopilot/actions";

export function RunAutopilotButton({ siteId }: { siteId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() => start(() => runAutopilotNow(siteId))}
    >
      {pending ? "Executando..." : "Rodar agora"}
    </Button>
  );
}
