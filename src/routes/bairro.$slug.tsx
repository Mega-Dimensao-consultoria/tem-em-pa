import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { NoCompanies } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { CompanyListSkeleton } from "@/components/feedback/Skeletons";
import { listCompaniesByNeighborhood } from "@/features/companies/functions";
import { titleCase } from "@/lib/safe";

const BASE = "https://tem-em-pa.lovable.app";

const neighborhoodQO = (slug: string) =>
  queryOptions({
    queryKey: ["neighborhood", slug],
    queryFn: () => listCompaniesByNeighborhood({ data: { citySlug: "pouso-alegre", slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/bairro/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(neighborhoodQO(params.slug)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.neighborhood ?? titleCase(params.slug.replace(/-/g, " "));
    const city = loaderData?.city ?? "Pouso Alegre";
    const title = `Empresas no bairro ${name} — ${city} | Tem em P.A`;
    const desc = `Veja restaurantes, mercados, serviços e profissionais no bairro ${name}, em ${city}/MG. Endereços, contatos e avaliações.`;
    const url = `${BASE}/bairro/${params.slug}`;
    const crumbLd = breadcrumbJsonLd(BASE, [
      { label: "Buscar", path: "/buscar" },
      { label: `Bairro ${name}`, path: `/bairro/${params.slug}` },
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
  component: NeighborhoodPage,
  pendingComponent: () => (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <CompanyListSkeleton count={6} />
      </section>
    </PageShell>
  ),
  errorComponent: ({ error, reset }) => (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={error} reset={reset} />
      </section>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <NotFoundState
          title="Bairro não encontrado"
          description="Não temos empresas cadastradas com esse bairro ainda."
        />
      </section>
    </PageShell>
  ),
});

function NeighborhoodPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(neighborhoodQO(slug));

  if (!data.neighborhood) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl px-4 py-10">
          <NotFoundState
            title="Bairro não encontrado"
            description="Não temos empresas cadastradas com esse bairro ainda."
          />
          <div className="mt-4 text-center">
            <Link to="/buscar" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Ver todas as empresas
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  const { neighborhood, city, companies } = data;

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs items={[{ label: "Buscar", to: "/buscar" }, { label: `Bairro ${neighborhood}` }]} />
        <h1 className="mt-3 font-display text-3xl font-bold">
          Empresas no bairro {neighborhood}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {companies.length} empresa(s) em {neighborhood}, {city ?? "Pouso Alegre"}/MG
        </p>

        <div className="mt-6">
          {companies.length === 0 ? (
            <NoCompanies />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => <CompanyCard key={c.id} company={c} />)}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
