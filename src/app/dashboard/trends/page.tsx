// Tendências captadas (pautas). Lista por relevância ("fora da curva"); ações: usar/descartar. Tela básica.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessibleSiteIds } from "@/lib/access";
import { CollectTrendsButton } from "@/components/CollectTrendsButton";
import { dismissTrend, markTrendUsed } from "./actions";

export default async function TrendsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { id: userId, role } = session.user;
  const isAdmin = role === "ADMIN";
  const siteIds = await accessibleSiteIds(userId, role);

  const trends = await db.trend.findMany({
    where: {
      status: "NEW",
      OR: [{ siteId: null }, { siteId: { in: siteIds } }],
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { site: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tendências</h1>
          <p className="text-sm text-gray-500">
            Pautas captadas das suas fontes, ordenadas pelo sinal de &quot;fora da curva&quot;.
          </p>
        </div>
        {isAdmin && <CollectTrendsButton />}
      </div>

      {trends.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Nenhuma pauta nova.{" "}
          <Link href="/dashboard/sources" className="text-blue-600 hover:underline">
            Cadastrar fontes
          </Link>{" "}
          {isAdmin && "e clicar em “Coletar agora”."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {trends.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {t.score}
                  </span>
                  {t.url ? (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium hover:underline"
                    >
                      {t.title}
                    </a>
                  ) : (
                    <span className="truncate font-medium">{t.title}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {t.type} · {t.site?.name ?? "Global"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <Link href="/dashboard/generate" className="text-blue-600 hover:underline">
                  Gerar conteúdo
                </Link>
                <form action={markTrendUsed.bind(null, t.id)}>
                  <button className="text-green-600 hover:underline">Marcar usada</button>
                </form>
                <form action={dismissTrend.bind(null, t.id)}>
                  <button className="text-gray-500 hover:underline">Descartar</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
