"use client";

import { useActionState, useState, useTransition } from "react";
import { createSource, type SourceState } from "@/app/dashboard/sources/actions";
import { Button, Field, FormError, FormSuccess, Input, Select } from "@/components/ui";

interface SiteOption {
  id: string;
  name: string;
}

type TestResult =
  | { kind: "ok"; count: number; titles: string[] }
  | { kind: "fail"; error: string }
  | null;

export function SourceForm({ sites, isAdmin }: { sites: SiteOption[]; isAdmin: boolean }) {
  const [state, formAction, pending] = useActionState<SourceState, FormData>(createSource, undefined);
  const [url, setUrl] = useState("");
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<TestResult>(null);

  function handleTest() {
    setTestResult(null);
    const target = url.trim();
    if (!target) {
      setTestResult({ kind: "fail", error: "Cole uma URL pra testar." });
      return;
    }
    startTest(async () => {
      try {
        const res = await fetch("/api/sources/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: target }),
        });
        const data = await res.json();
        if (data.ok) setTestResult({ kind: "ok", count: data.count, titles: data.titles ?? [] });
        else setTestResult({ kind: "fail", error: data.error ?? "Feed inválido." });
      } catch (e) {
        setTestResult({ kind: "fail", error: e instanceof Error ? e.message : String(e) });
      }
    });
  }

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
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://site.com/rss  ·  https://trends.google.com/trending/rss?geo=BR"
        />
      </Field>

      <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-neutral-600">
            Antes de cadastrar, teste se o feed responde e tem itens.
          </span>
          <Button type="button" size="sm" variant="secondary" onClick={handleTest} disabled={testing}>
            {testing ? "Testando..." : "Testar feed"}
          </Button>
        </div>
        {testResult?.kind === "ok" && (
          <div className="text-sm text-emerald-700">
            ✓ {testResult.count} itens encontrados.
            {testResult.titles.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-neutral-700">
                {testResult.titles.map((t, i) => (
                  <li key={i} className="truncate">{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {testResult?.kind === "fail" && (
          <div className="text-sm text-red-700">✗ {testResult.error}</div>
        )}
      </div>

      <Field label="Rótulo (opcional)">
        <Input name="label" />
      </Field>

      <Field
        label="Palavras-chave para filtrar (opcional)"
        hint='CSV — só capta pautas que contenham alguma delas no título. Ex.: "copa, futebol, brasileirão"'
      >
        <Input name="keywords" placeholder="copa, mundial, neymar, vinicius" />
      </Field>

      <FormError>{state?.error}</FormError>
      <FormSuccess>{state?.ok}</FormSuccess>

      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar fonte"}
      </Button>
    </form>
  );
}
