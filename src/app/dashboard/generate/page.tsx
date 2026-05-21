// Geração de conteúdo por IA: roda o pipeline (Leitor → SEO → Imagem) e cria um rascunho de post.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { GenerateForm } from "@/components/GenerateForm";

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
      <div>
        <h1 className="text-2xl font-bold">Gerar conteúdo com IA</h1>
        <p className="text-sm text-gray-500">
          O pipeline reescreve a notícia, otimiza o SEO e (opcional) gera a imagem, salvando como rascunho.
        </p>
      </div>

      {keyCount === 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Você ainda não configurou nenhuma chave de IA.{" "}
          <Link href="/dashboard/settings" className="font-medium underline">
            Configurar chaves (BYOK)
          </Link>
          .
        </p>
      )}

      {sites.length === 0 ? (
        <p className="text-gray-500">
          Você não tem sites disponíveis.{" "}
          <Link href="/dashboard/sites" className="text-blue-600 hover:underline">
            Ver sites
          </Link>
          .
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <GenerateForm sites={sites} />
        </div>
      )}
    </div>
  );
}
