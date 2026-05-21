"use client";

import { useActionState } from "react";
import { createSource, type SourceState } from "@/app/dashboard/sources/actions";

interface SiteOption {
  id: string;
  name: string;
}

export function SourceForm({ sites, isAdmin }: { sites: SiteOption[]; isAdmin: boolean }) {
  const [state, formAction, pending] = useActionState<SourceState, FormData>(createSource, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Tipo</span>
          <select name="type" className="w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue="RSS">
            <option value="RSS">RSS / Atom</option>
            <option value="GOOGLE_TRENDS">Google Trends (RSS)</option>
            <option value="WEBSITE">Site (feed)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Escopo</span>
          <select name="siteId" className="w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue="">
            {isAdmin && <option value="">Global (todos os sites)</option>}
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">URL do feed</span>
        <input
          name="url"
          required
          placeholder="https://site.com/rss  ·  https://trends.google.com/trending/rss?geo=BR"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-gray-500">
          Para Google Trends use o RSS de tendências do dia, ex.:
          https://trends.google.com/trending/rss?geo=BR
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Rótulo (opcional)</span>
        <input name="label" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adicionando..." : "Adicionar fonte"}
      </button>
    </form>
  );
}
