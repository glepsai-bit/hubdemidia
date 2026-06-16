"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/dashboard/sites/actions";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";

type PostAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  action: PostAction;
  categories?: CategoryOption[];
  defaults?: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    imageUrl?: string | null;
    heroAlt?: string | null;
    authorName?: string | null;
    categoryId?: string | null;
    featured?: boolean;
    tags?: string;
  };
  submitLabel?: string;
}

export function PostForm({ action, categories = [], defaults, submitLabel = "Salvar" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Título">
        <Input name="title" required defaultValue={defaults?.title} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug">
          <Input name="slug" required placeholder="minha-noticia" defaultValue={defaults?.slug} />
        </Field>
        <Field label="Autor (opcional)">
          <Input name="authorName" defaultValue={defaults?.authorName ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Editoria (opcional)" hint={categories.length === 0 ? "Cadastre editorias para classificar." : undefined}>
          <Select name="categoryId" defaultValue={defaults?.categoryId ?? ""}>
            <option value="">— sem editoria —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tags (separadas por vírgula)" hint="Ex.: ia, startups, mercado">
          <Input name="tags" defaultValue={defaults?.tags ?? ""} />
        </Field>
      </div>

      <Field label="Resumo (opcional)" hint="Aparece como deck/lide e na busca.">
        <Textarea name="excerpt" rows={2} defaultValue={defaults?.excerpt ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URL da imagem hero (opcional)">
          <Input name="imageUrl" defaultValue={defaults?.imageUrl ?? ""} />
        </Field>
        <Field label="Alt da imagem (opcional)" hint="Descrição da imagem para acessibilidade/SEO.">
          <Input name="heroAlt" defaultValue={defaults?.heroAlt ?? ""} />
        </Field>
      </div>

      <Field label="Conteúdo (markdown)">
        <Textarea
          name="content"
          required
          rows={14}
          defaultValue={defaults?.content}
          className="font-mono text-sm"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={!!defaults?.featured}
          className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
        />
        Marcar como <strong className="font-semibold">destaque</strong> (entra na manchete/destaques da capa)
      </label>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
