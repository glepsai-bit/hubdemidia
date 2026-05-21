// Configurações de IA (BYOK): cada usuário cadastra suas próprias chaves (criptografadas).
import type { AiProvider } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AiKeyForm } from "@/components/AiKeyForm";
import { Badge, Card, PageHeader } from "@/components/ui";
import { deleteApiKey } from "./actions";

const LABELS: Record<AiProvider, string> = {
  CLAUDE: "Claude (Anthropic)",
  OPENAI: "OpenAI (GPT)",
  GROK: "Grok (xAI)",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const keys = await db.aiKey.findMany({
    where: { userId: session.user.id },
    select: { provider: true, updatedAt: true },
  });
  const configured = new Map(keys.map((k) => [k.provider, k.updatedAt]));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações de IA"
        description="Use suas próprias chaves (BYOK). Elas são criptografadas e nunca exibidas de volta."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Provedores configurados</h2>
        <Card className="divide-y divide-neutral-100">
          {(["CLAUDE", "OPENAI", "GROK"] as AiProvider[]).map((p) => {
            const when = configured.get(p);
            return (
              <div key={p} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">{LABELS[p]}</span>
                    <Badge tone={when ? "success" : "neutral"}>
                      {when ? "Configurado" : "Não configurado"}
                    </Badge>
                  </div>
                  {when && (
                    <div className="mt-0.5 text-sm text-neutral-500">
                      Atualizado em {when.toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
                {when && (
                  <form action={deleteApiKey.bind(null, p)}>
                    <button className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      Remover
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </Card>
      </section>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Adicionar / substituir chave</h2>
        <AiKeyForm />
      </Card>
    </div>
  );
}
