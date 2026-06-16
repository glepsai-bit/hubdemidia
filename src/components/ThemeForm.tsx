"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input } from "@/components/ui";
import type { ActionState } from "@/app/dashboard/sites/actions";

type ThemeAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface Props {
  action: ThemeAction;
  defaults?: {
    primaryColor?: string | null;
    logoUrl?: string | null;
    tagline?: string | null;
    language?: string | null;
  };
}

export function ThemeForm({ action, defaults }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Cor primária (hex)"
          hint="Usada no destaque, links, badges. Ex.: #c8102e"
        >
          <Input
            name="primaryColor"
            placeholder="#c8102e"
            defaultValue={defaults?.primaryColor ?? ""}
          />
        </Field>
        <Field label="Idioma">
          <Input
            name="language"
            placeholder="pt-BR"
            defaultValue={defaults?.language ?? "pt-BR"}
          />
        </Field>
      </div>
      <Field label="URL do logo (opcional)" hint="Se vazio, mostra o nome do site no header.">
        <Input name="logoUrl" defaultValue={defaults?.logoUrl ?? ""} placeholder="https://..." />
      </Field>
      <Field label="Tagline (opcional)" hint="Aparece ao lado do nome no header.">
        <Input
          name="tagline"
          defaultValue={defaults?.tagline ?? ""}
          placeholder="ex.: Economia e Negócios"
        />
      </Field>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar tema"}
      </Button>
    </form>
  );
}
