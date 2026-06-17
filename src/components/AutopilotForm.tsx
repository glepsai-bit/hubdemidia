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

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="withImage"
          defaultChecked={defaults.withImage}
          className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
        />
        Gerar imagem hero (exige chave da OpenAI configurada — custo extra ~R$ 0,30/post)
      </label>

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
