"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/dashboard/sites/actions";

type SiteAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface Props {
  action: SiteAction;
  defaults?: {
    name?: string;
    slug?: string;
    domain?: string | null;
    description?: string | null;
    status?: string;
  };
  submitLabel?: string;
}

export function SiteForm({ action, defaults, submitLabel = "Salvar" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome">
        <input
          name="name"
          required
          defaultValue={defaults?.name}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Slug (subdomínio interno)">
        <input
          name="slug"
          required
          placeholder="meu-site"
          defaultValue={defaults?.slug}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Domínio customizado (opcional)">
        <input
          name="domain"
          placeholder="meusite.com"
          defaultValue={defaults?.domain ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Descrição (opcional)">
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults?.description ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </Field>
      <Field label="Status">
        <select
          name="status"
          defaultValue={defaults?.status ?? "DRAFT"}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="DRAFT">Rascunho</option>
          <option value="LIVE">No ar</option>
          <option value="PAUSED">Pausado</option>
        </select>
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
