"use client";

import { useActionState } from "react";
import { collectNow, type CollectState } from "@/app/dashboard/trends/actions";

export function CollectTrendsButton() {
  const [state, formAction, pending] = useActionState<CollectState, FormData>(collectNow, undefined);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Coletando..." : "Coletar agora"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-600">{state.ok}</span>}
    </form>
  );
}
