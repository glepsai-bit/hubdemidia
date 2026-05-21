"use client";

import { useActionState } from "react";
import { generateDraft, type GenerateState } from "@/app/dashboard/generate/actions";
import { Button, Field, FormError, Input, Select, Textarea } from "@/components/ui";

interface SiteOption {
  id: string;
  name: string;
}

export function GenerateForm({ sites }: { sites: SiteOption[] }) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generateDraft,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Site de destino">
          <Select name="siteId" required>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Provedor de IA">
          <Select name="provider" defaultValue="claude">
            <option value="claude">Claude</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="grok">Grok</option>
          </Select>
        </Field>
      </div>

      <Field label="Material da notícia (texto bruto)">
        <Textarea
          name="raw"
          required
          rows={8}
          placeholder="Cole aqui o texto da notícia que será reescrita..."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nicho/tom (opcional)">
          <Input name="niche" />
        </Field>
        <Field label="URL da fonte (opcional)">
          <Input name="sourceUrl" />
        </Field>
      </div>

      <Field
        label="Palavras-chave / sementes (opcional — a IA pesquisa o resto)"
        hint="Separe por vírgula. Deixe em branco e a IA descobre as palavras-chave a partir do texto."
      >
        <Input name="keywords" placeholder="palavra1, palavra2, palavra3" />
      </Field>

      <div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="withImage" className="accent-neutral-900" />
          Gerar imagem da notícia
        </label>
        <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
          A imagem é sempre gerada pela OpenAI, mesmo que o texto use outro provedor. Requer uma chave
          da OpenAI configurada em Configurações; sem ela, o texto é gerado e só o passo de imagem falha.
        </span>
      </div>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Gerando... (pode levar alguns segundos)" : "Gerar rascunho"}
      </Button>
    </form>
  );
}
