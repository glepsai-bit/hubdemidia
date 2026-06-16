// Configuração de tema e identidade do portal público do site.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, PageHeader, TextLink } from "@/components/ui";
import { ThemeForm } from "@/components/ThemeForm";
import { assertSiteAccess } from "../../actions";
import { updateTheme } from "./actions";

export default async function ThemePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  await assertSiteAccess(siteId);

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { name: true, primaryColor: true, logoUrl: true, tagline: true, language: true },
  });
  if (!site) notFound();

  return (
    <div className="space-y-8">
      <div>
        <TextLink
          href={`/dashboard/sites/${siteId}`}
          className="text-sm text-neutral-500 no-underline hover:text-neutral-900"
        >
          ← {site.name}
        </TextLink>
        <PageHeader
          title="Tema e identidade"
          description="Cor principal, logo, tagline e idioma do portal público deste site."
        />
      </div>

      <Card className="p-6">
        <ThemeForm
          action={updateTheme.bind(null, siteId)}
          defaults={{
            primaryColor: site.primaryColor,
            logoUrl: site.logoUrl,
            tagline: site.tagline,
            language: site.language,
          }}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 text-base font-semibold text-neutral-900">Pré-visualização</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Visite o portal público depois de salvar — as cores são aplicadas em tempo real.
        </p>
        <div
          className="rounded-lg border border-neutral-200 p-4"
          style={{
            borderLeftColor: site.primaryColor ?? "#111",
            borderLeftWidth: "4px",
          }}
        >
          <div className="text-xl font-bold">{site.name}</div>
          {site.tagline && <div className="text-sm text-neutral-500">{site.tagline}</div>}
        </div>
      </Card>
    </div>
  );
}
