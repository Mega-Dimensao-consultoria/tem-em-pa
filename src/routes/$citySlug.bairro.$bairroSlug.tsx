import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { NoCompanies } from "@/components/feedback/EmptyState";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { listCompaniesByNeighborhood } from "@/features/companies/functions";
import { titleCase } from "@/lib/safe";

const BASE = "https://temnacidade.com";

const neighborhoodQO = (citySlug: string, slug: string) =>
  queryOptions({
    queryKey: ["neighborhood", citySlug, slug],
    queryFn: () => listCompaniesByNeighborhood({ data: { citySlug, slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/$citySlug/bairro/$bairroSlug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      neighborhoodQO(params.citySlug, params.bairroSlug),
    ),
  head: ({ params, loaderData }) => {
    const name = loaderData?.neighborhood ?? titleCase(params.bairroSlug.replace(/-/g, " "));
    const city = loaderData?.city ?? params.citySlug;
    const title = `Empresas no bairro ${name} — ${city} | Tem na cidade`;
    const desc = `Veja restaurantes, mercados, serviços e profissionais no bairro ${name}, em ${city}.`;
    const url = `${BASE}/${params.citySlug}/bairro/${params.bairroSlug}`;
    const crumbLd = breadcrumbJsonLd(BASE, [
      { label: city, path: `/${params.citySlug}` },
      { label: `Bairro ${name}`, path: `/${params.citySlug}/bairro/${params.bairroSlug}` },
    ]);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(crumbLd) }],
    };
  },
  component: NeighborhoodPage,
});

function NeighborhoodPage() {
  const { citySlug, bairroSlug } = Route.useParams();
  const { data } = useSuspenseQuery(neighborhoodQO(citySlug, bairroSlug));

  if (!data.neighborhood) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl px-4 py-10">
          <NotFoundState
            title="Bairro não encontrado"
            description="Não temos empresas cadastradas com esse bairro ainda."
          />
          <div className="mt-4 text-center">
            <Link
              to="/$citySlug"
              params={{ citySlug }}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Voltar para a cidade
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
        <Breadcrumbs
          items={[
            { label: city ?? citySlug, to: `/${citySlug}` },
            { label: `Bairro ${neighborhood}` },
          ]}
        />
        <h1 className="mt-3 font-display text-3xl font-bold">
          Empresas no bairro {neighborhood}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {companies.length} empresa(s) em {neighborhood}, {city}
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
