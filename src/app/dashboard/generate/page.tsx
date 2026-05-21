// Geração de conteúdo por IA: roda o pipeline (Leitor → SEO → Imagem) e cria um rascunho de post.
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { GenerateForm } from "@/components/GenerateForm";
import { Card, EmptyState, PageHeader, TextLink } from "@/components/ui";

export default async function GeneratePage() {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, role } = session.user;
  const siteIds = await accessibleSiteIds(userId, role);

  const [sites, keyCount] = await Promise.all([
    db.site.findMany({
      where: { id: { in: siteIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.aiKey.count({ where: { userId } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerar conteúdo com IA"
        description="O pipeline reescreve a notícia, otimiza o SEO e (opcional) gera a imagem, salvando como rascunho."
      />

      {keyCount === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Você ainda não configurou nenhuma chave de IA.{" "}
          <TextLink href="/dashboard/settings" className="text-amber-900">
            Configurar chaves (BYOK)
          </TextLink>
          .
        </div>
      )}

      {sites.length === 0 ? (
        <EmptyState>
          Você não tem sites disponíveis. <TextLink href="/dashboard/sites">Ver sites</TextLink>.
        </EmptyState>
      ) : (
        <Card className="p-6">
          <GenerateForm sites={sites} />
        </Card>
      )}
    </div>
  );
}
