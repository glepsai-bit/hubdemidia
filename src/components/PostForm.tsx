"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/dashboard/sites/actions";

type PostAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface Props {
  action: PostAction;
  defaults?: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    imageUrl?: string | null;
  };
  submitLabel?: string;
}

export function PostForm({ action, defaults, submitLabel = "Salvar" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Título">
        <input
          name="title"
          required
          defaultValue={defaults?.title}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Slug">
        <input
          name="slug"
          required
          placeholder="minha-noticia"
          defaultValue={defaults?.slug}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Resumo (opcional)">
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={defaults?.excerpt ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="URL da imagem (opcional)">
        <input
          name="imageUrl"
          defaultValue={defaults?.imageUrl ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Conteúdo (markdown)">
        <textarea
          name="content"
          required
          rows={10}
          defaultValue={defaults?.content}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
        />
      </Field>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
