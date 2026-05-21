// Configurações de IA (BYOK): cada usuário cadastra suas próprias chaves (criptografadas).
import type { AiProvider } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AiKeyForm } from "@/components/AiKeyForm";
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
      <div>
        <h1 className="text-2xl font-bold">Configurações de IA</h1>
        <p className="text-sm text-gray-500">
          Use suas próprias chaves (BYOK). Elas são criptografadas e nunca exibidas de volta.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Provedores configurados</h2>
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {(["CLAUDE", "OPENAI", "GROK"] as AiProvider[]).map((p) => {
            const when = configured.get(p);
            return (
              <li key={p} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{LABELS[p]}</div>
                  <div className="text-sm text-gray-500">
                    {when ? `Configurado · atualizado ${when.toLocaleDateString("pt-BR")}` : "Não configurado"}
                  </div>
                </div>
                {when && (
                  <form action={deleteApiKey.bind(null, p)}>
                    <button className="text-sm text-red-600 hover:underline">Remover</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Adicionar / substituir chave</h2>
        <AiKeyForm />
      </section>
    </div>
  );
}
