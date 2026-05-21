"use client";

import { useActionState } from "react";
import { generateDraft, type GenerateState } from "@/app/dashboard/generate/actions";

interface SiteOption {
  id: string;
  name: string;
}

export function GenerateForm({ sites }: { sites: SiteOption[] }) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generateDraft,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Site de destino</span>
          <select name="siteId" required className="w-full rounded-lg border border-gray-300 px-3 py-2">
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Provedor de IA</span>
          <select name="provider" className="w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue="claude">
            <option value="claude">Claude</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="grok">Grok</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Material da notícia (texto bruto)
        </span>
        <textarea
          name="raw"
          required
          rows={8}
          placeholder="Cole aqui o texto da notícia que será reescrita..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Nicho/tom (opcional)</span>
          <input name="niche" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">URL da fonte (opcional)</span>
          <input name="sourceUrl" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Palavras-chave (separadas por vírgula)
        </span>
        <input
          name="keywords"
          placeholder="palavra1, palavra2, palavra3"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="withImage" />
        Gerar imagem (requer chave da OpenAI configurada)
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Gerando... (pode levar alguns segundos)" : "Gerar rascunho"}
      </button>
    </form>
  );
}
