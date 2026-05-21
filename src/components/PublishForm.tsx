"use client";

import { useActionState } from "react";
import { publishToAll, type PublishState } from "@/app/dashboard/publish/actions";
import { Button, Field, FormError, FormSuccess, Input, Textarea } from "@/components/ui";

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
      <fieldset className="rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-700">
          Sites (nenhum marcado = todos)
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {sites.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="siteIds" value={s.id} className="accent-neutral-900" />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Título">
        <Input name="title" required placeholder="Título da matéria" />
      </Field>
      <Field label="Slug">
        <Input name="slug" required placeholder="slug-da-noticia" />
      </Field>
      <Field label="URL da imagem (opcional)">
        <Input name="imageUrl" placeholder="https://..." />
      </Field>
      <Field label="Resumo (opcional)">
        <Textarea name="excerpt" rows={2} />
      </Field>
      <Field label="Conteúdo (markdown)">
        <Textarea name="content" required rows={10} className="font-mono text-sm" />
      </Field>

      <FormError>{state?.error}</FormError>
      <FormSuccess>{state?.ok}</FormSuccess>

      <Button type="submit" disabled={pending}>
        {pending ? "Publicando..." : "Publicar"}
      </Button>
    </form>
  );
}
