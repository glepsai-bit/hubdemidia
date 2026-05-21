"use client";

import { useActionState } from "react";
import { createSource, type SourceState } from "@/app/dashboard/sources/actions";
import { Button, Field, FormError, FormSuccess, Input, Select } from "@/components/ui";

interface SiteOption {
  id: string;
  name: string;
}

export function SourceForm({ sites, isAdmin }: { sites: SiteOption[]; isAdmin: boolean }) {
  const [state, formAction, pending] = useActionState<SourceState, FormData>(createSource, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select name="type" defaultValue="RSS">
            <option value="RSS">RSS / Atom</option>
            <option value="GOOGLE_TRENDS">Google Trends (RSS)</option>
            <option value="WEBSITE">Site (feed)</option>
          </Select>
        </Field>
        <Field label="Escopo">
          <Select name="siteId" defaultValue="">
            {isAdmin && <option value="">Global (todos os sites)</option>}
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="URL do feed"
        hint="Para Google Trends use o RSS de tendências do dia, ex.: https://trends.google.com/trending/rss?geo=BR"
      >
        <Input
          name="url"
          required
          placeholder="https://site.com/rss  ·  https://trends.google.com/trending/rss?geo=BR"
        />
      </Field>

      <Field label="Rótulo (opcional)">
        <Input name="label" />
      </Field>

      <FormError>{state?.error}</FormError>
      <FormSuccess>{state?.ok}</FormSuccess>

      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar fonte"}
      </Button>
    </form>
  );
}
