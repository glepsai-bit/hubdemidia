"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/dashboard/sites/actions";
import { Button, Field, FormError, Input, Textarea } from "@/components/ui";

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
        <Input name="title" required defaultValue={defaults?.title} />
      </Field>
      <Field label="Slug">
        <Input name="slug" required placeholder="minha-noticia" defaultValue={defaults?.slug} />
      </Field>
      <Field label="Resumo (opcional)">
        <Textarea name="excerpt" rows={2} defaultValue={defaults?.excerpt ?? ""} />
      </Field>
      <Field label="URL da imagem (opcional)">
        <Input name="imageUrl" defaultValue={defaults?.imageUrl ?? ""} />
      </Field>
      <Field label="Conteúdo (markdown)">
        <Textarea name="content" required rows={12} defaultValue={defaults?.content} className="font-mono text-sm" />
      </Field>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
