"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input, Textarea } from "@/components/ui";
import type { ActionState } from "@/app/dashboard/sites/actions";

type CategoryAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface Props {
  action: CategoryAction;
  defaults?: {
    name?: string;
    slug?: string;
    description?: string | null;
    color?: string | null;
    order?: number;
  };
  submitLabel?: string;
}

export function CategoryForm({ action, defaults, submitLabel = "Salvar" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input name="name" required defaultValue={defaults?.name ?? ""} />
        </Field>
        <Field label="Slug">
          <Input
            name="slug"
            required
            placeholder="economia"
            defaultValue={defaults?.slug ?? ""}
          />
        </Field>
      </div>
      <Field label="Descrição (opcional)">
        <Textarea name="description" rows={2} defaultValue={defaults?.description ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cor (hex, opcional)" hint="Ex.: #c8102e">
          <Input name="color" placeholder="#c8102e" defaultValue={defaults?.color ?? ""} />
        </Field>
        <Field label="Ordem">
          <Input
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={defaults?.order ?? 0}
          />
        </Field>
      </div>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
