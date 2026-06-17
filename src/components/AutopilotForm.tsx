"use client";

import { useActionState } from "react";
import { Button, Field, FormError, Input, Select } from "@/components/ui";
import type { ActionState } from "@/app/dashboard/sites/actions";

type UpdateAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface Props {
  action: UpdateAction;
  defaults: {
    enabled: boolean;
    postsPerRun: number;
    featuredThreshold: number;
    provider: string;
    withImage: boolean;
    imageStrategy: string;
    autoCategory: boolean;
  };
}

export function AutopilotForm({ action, defaults }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={defaults.enabled}
          className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
        />
        <span className="font-semibold text-neutral-900">
          Ativar Piloto Automático para este site
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Pautas por ciclo"
          hint="Quantos posts gerar a cada execução. Default: 3"
        >
          <Input
            type="number"
            name="postsPerRun"
            defaultValue={defaults.postsPerRun}
            min={1}
            max={20}
          />
        </Field>

        <Field
          label="Threshold de destaque (score)"
          hint="Pautas com score ≥ este valor entram como destaque na manchete. 70 = bombásticas."
        >
          <Input
            type="number"
            name="featuredThreshold"
            defaultValue={defaults.featuredThreshold}
            min={0}
            max={100}
          />
        </Field>
      </div>

      <Field
        label="Provedor de IA"
        hint="Usa a chave BYOK do usuário AUTOMATION_USER_EMAIL (ou 1º admin). Claude é o mais barato e bom em PT-BR."
      >
        <Select name="provider" defaultValue={defaults.provider}>
          <option value="CLAUDE">Claude (Anthropic)</option>
          <option value="OPENAI">OpenAI (GPT)</option>
          <option value="GROK">Grok (xAI)</option>
        </Select>
      </Field>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/40 p-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="withImage"
            defaultChecked={defaults.withImage}
            className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
          />
          <span className="font-medium text-neutral-900">Gerar imagem hero</span>
        </label>
        <Field
          label="Estratégia de imagem"
          hint="Bancos grátis (Unsplash/Pexels) = qualidade boa, custo ZERO. OpenAI = imagem sintética única, ~R$ 0,30/post."
        >
          <Select name="imageStrategy" defaultValue={defaults.imageStrategy}>
            <option value="BANK_FIRST">
              Banco grátis (Unsplash/Pexels) → OpenAI como fallback (recomendado)
            </option>
            <option value="BANK_ONLY">
              Banco grátis SÓ (custo ZERO; sem imagem se não achar)
            </option>
            <option value="OPENAI_ONLY">OpenAI sempre (premium, mais caro)</option>
            <option value="NONE">Nunca gerar imagem</option>
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="autoCategory"
          defaultChecked={defaults.autoCategory}
          className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
        />
        Atribuir editoria automaticamente (matching nome/slug com palavras do título)
      </label>

      <FormError>{state?.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar configuração"}
      </Button>
    </form>
  );
}
