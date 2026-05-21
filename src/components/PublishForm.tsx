"use client";

import { useActionState } from "react";
import { publishToAll, type PublishState } from "@/app/dashboard/publish/actions";

interface SiteOption {
  id: string;
  name: string;
}

export function PublishForm({ sites }: { sites: SiteOption[] }) {
  const [state, formAction, pending] = useActionState<PublishState, FormData>(
    publishToAll,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-700">
          Sites (nenhum marcado = todos)
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {sites.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="siteIds" value={s.id} />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <input
        name="title"
        required
        placeholder="Título"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
      <input
        name="slug"
        required
        placeholder="slug-da-noticia"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
      <input
        name="imageUrl"
        placeholder="URL da imagem (opcional)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
      <textarea
        name="excerpt"
        rows={2}
        placeholder="Resumo (opcional)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
      <textarea
        name="content"
        required
        rows={10}
        placeholder="Conteúdo (markdown)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Publicando..." : "Publicar"}
      </button>
    </form>
  );
}
