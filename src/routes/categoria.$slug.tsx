import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/components/CompanyCard";
import { searchCompanies } from "@/lib/companies.functions";

const qo = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => searchCompanies({ data: { categorySlug: slug } }),
  });

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.slug)),
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Tem em P.A` },
      { name: "description", content: `Empresas de ${params.slug} em Pouso Alegre/MG` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(qo(slug));

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.length} empresa(s) nesta categoria</p>

        {data.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">Ainda não há empresas cadastradas nesta categoria.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => <CompanyCard key={c.id} company={c} />)}
          </div>
        )}
      </section>
    </PageShell>
  );
}
