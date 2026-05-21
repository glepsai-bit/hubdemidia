"use client";

import { useActionState } from "react";
import { collectNow, type CollectState } from "@/app/dashboard/trends/actions";
import { Button } from "@/components/ui";

export function CollectTrendsButton() {
  const [state, formAction, pending] = useActionState<CollectState, FormData>(collectNow, undefined);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Coletando..." : "Coletar agora"}
      </Button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-emerald-600">{state.ok}</span>}
    </form>
  );
}
