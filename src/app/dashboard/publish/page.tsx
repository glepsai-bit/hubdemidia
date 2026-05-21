// Publicação geral (admin): cria e publica o mesmo conteúdo em vários sites de uma vez.
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublishForm } from "@/components/PublishForm";

export default async function PublishPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const sites = await db.site.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Publicação geral</h1>
        <p className="text-sm text-gray-500">
          Publique a mesma matéria em todos os sites (ou nos selecionados) de uma vez.
        </p>
      </div>

      {sites.length === 0 ? (
        <p className="text-gray-500">Crie pelo menos um site antes de usar a publicação geral.</p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <PublishForm sites={sites} />
        </div>
      )}
    </div>
  );
}
