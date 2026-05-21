"use client";

import { useActionState } from "react";
import { saveApiKey, type KeyState } from "@/app/dashboard/settings/actions";

export function AiKeyForm() {
  const [state, formAction, pending] = useActionState<KeyState, FormData>(saveApiKey, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Provedor</span>
        <select
          name="provider"
          className="rounded-lg border border-gray-300 px-3 py-2"
          defaultValue="CLAUDE"
        >
          <option value="CLAUDE">Claude (Anthropic)</option>
          <option value="OPENAI">OpenAI (GPT)</option>
          <option value="GROK">Grok (xAI)</option>
        </select>
      </label>
      <label className="block flex-1">
        <span className="mb-1 block text-sm font-medium text-gray-700">Chave de API</span>
        <input
          name="apiKey"
          type="password"
          required
          placeholder="cole a chave aqui"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar chave"}
      </button>

      {state?.error && <p className="text-sm text-red-600 sm:w-full">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600 sm:w-full">{state.ok}</p>}
    </form>
  );
}
