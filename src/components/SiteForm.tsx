"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/dashboard/sites/actions";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";

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
        <Input name="name" required defaultValue={defaults?.name} />
      </Field>
      <Field label="Slug (subdomínio interno)">
        <Input name="slug" required placeholder="meu-site" defaultValue={defaults?.slug} />
      </Field>
      <Field label="Domínio customizado (opcional)">
        <Input name="domain" placeholder="meusite.com" defaultValue={defaults?.domain ?? ""} />
      </Field>
      <Field label="Descrição (opcional)">
        <Textarea name="description" rows={2} defaultValue={defaults?.description ?? ""} />
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={defaults?.status ?? "DRAFT"}>
          <option value="DRAFT">Rascunho</option>
          <option value="LIVE">No ar</option>
          <option value="PAUSED">Pausado</option>
        </Select>
      </Field>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
