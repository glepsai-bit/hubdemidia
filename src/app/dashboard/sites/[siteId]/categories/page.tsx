// CRUD de editorias (categorias) por site.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader, TextLink } from "@/components/ui";
import { CategoryForm } from "@/components/CategoryForm";
import { assertSiteAccess } from "../../actions";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  await assertSiteAccess(siteId);

  const [site, categories] = await Promise.all([
    db.site.findUnique({ where: { id: siteId }, select: { name: true } }),
    db.category.findMany({
      where: { siteId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { posts: true } } },
    }),
  ]);
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
        <PageHeader title="Editorias" description="Cada matéria pode pertencer a uma editoria — vira destaque na capa e ganha página própria." />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Cadastradas</h2>
        {categories.length === 0 ? (
          <EmptyState>Nenhuma editoria ainda. Crie a primeira abaixo.</EmptyState>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {c.color && (
                        <span
                          className="inline-block h-3 w-3 rounded-sm"
                          style={{ background: c.color }}
                          aria-hidden
                        />
                      )}
                      <span className="font-medium text-neutral-900">{c.name}</span>
                      <Badge tone="neutral">{c._count.posts} posts</Badge>
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      /c/{c.slug} · ordem {c.order}
                      {c.description ? ` · ${c.description}` : ""}
                    </div>
                  </div>
                  <form action={deleteCategory.bind(null, siteId, c.id)}>
                    <button className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      Excluir
                    </button>
                  </form>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900">
                    Editar
                  </summary>
                  <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
                    <CategoryForm
                      action={updateCategory.bind(null, siteId, c.id)}
                      submitLabel="Salvar alterações"
                      defaults={{
                        name: c.name,
                        slug: c.slug,
                        description: c.description,
                        color: c.color,
                        order: c.order,
                      }}
                    />
                  </div>
                </details>
              </div>
            ))}
          </Card>
        )}
      </section>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Nova editoria</h2>
        <CategoryForm
          action={createCategory.bind(null, siteId)}
          submitLabel="Criar editoria"
        />
      </Card>
    </div>
  );
}
