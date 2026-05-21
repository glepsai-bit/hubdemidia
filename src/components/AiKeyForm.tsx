"use client";

import { useActionState } from "react";
import { saveApiKey, type KeyState } from "@/app/dashboard/settings/actions";
import { Button, Field, FormError, FormSuccess, Input, Select } from "@/components/ui";

export function AiKeyForm() {
  const [state, formAction, pending] = useActionState<KeyState, FormData>(saveApiKey, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <Field label="Provedor">
            <Select name="provider" defaultValue="CLAUDE">
              <option value="CLAUDE">Claude (Anthropic)</option>
              <option value="OPENAI">OpenAI (GPT)</option>
              <option value="GROK">Grok (xAI)</option>
            </Select>
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Chave de API">
            <Input name="apiKey" type="password" required placeholder="cole a chave aqui" />
          </Field>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar chave"}
        </Button>
      </div>

      <FormError>{state?.error}</FormError>
      <FormSuccess>{state?.ok}</FormSuccess>
    </form>
  );
}
