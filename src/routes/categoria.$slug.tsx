import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/components/CompanyCard";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { searchCompanies, getCategoryBySlug } from "@/lib/companies.functions";

const BASE = "https://tem-em-pa.lovable.app";

const listQo = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => searchCompanies({ data: { categorySlug: slug } }),
  });

const catQo = (slug: string) =>
  queryOptions({
    queryKey: ["category-meta", slug],
    queryFn: () => getCategoryBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ context, params }) => {
    const [list, cat] = await Promise.all([
      context.queryClient.ensureQueryData(listQo(params.slug)),
      context.queryClient.ensureQueryData(catQo(params.slug)),
    ]);
    return { list, cat };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.cat?.name ?? params.slug.replace(/-/g, " ");
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const title = `${label} em Pouso Alegre — Tem em P.A`;
    const desc = `Encontre as melhores empresas de ${name} em Pouso Alegre/MG. Endereços, contatos, avaliações e horário de funcionamento.`;
    const url = `${BASE}/categoria/${params.slug}`;
    const crumbLd = breadcrumbJsonLd(BASE, [
      { label: "Categorias", path: "/buscar" },
      { label, path: `/categoria/${params.slug}` },
    ]);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(crumbLd) }],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(listQo(slug));
  const { data: cat } = useSuspenseQuery(catQo(slug));
  const name = cat?.name ?? slug.replace(/-/g, " ");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs items={[{ label: "Categorias", to: "/buscar" }, { label: name }]} />
        <h1 className="mt-3 font-display text-3xl font-bold capitalize">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.length} empresa(s) de {name.toLowerCase()} em Pouso Alegre/MG
        </p>

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
