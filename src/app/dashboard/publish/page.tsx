// Publicação geral (admin): cria e publica o mesmo conteúdo em vários sites de uma vez.
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublishForm } from "@/components/PublishForm";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function PublishPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const sites = await db.site.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publicação geral"
        description="Publique a mesma matéria em todos os sites (ou nos selecionados) de uma vez."
      />

      {sites.length === 0 ? (
        <EmptyState>Crie pelo menos um site antes de usar a publicação geral.</EmptyState>
      ) : (
        <Card className="p-6">
          <PublishForm sites={sites} />
        </Card>
      )}
    </div>
  );
}
