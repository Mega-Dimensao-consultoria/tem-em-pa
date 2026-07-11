import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { NoCompanies } from "@/components/feedback/EmptyState";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { listCompaniesByNeighborhood } from "@/features/companies/functions";
import { titleCase } from "@/lib/safe";
import { seoGlobalsServerQO } from "@/features/seo/functions/getGlobals";
import { resolveSeo, buildSeoHead } from "@/lib/seo/render";

const BASE = "https://www.temnaminhacidade.com.br";

const neighborhoodQO = (citySlug: string, slug: string) =>
  queryOptions({
    queryKey: ["neighborhood", citySlug, slug],
    queryFn: () => listCompaniesByNeighborhood({ data: { citySlug, slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/$citySlug/bairro/$bairroSlug")({
  loader: async ({ context, params }) => {
    const [data, globals] = await Promise.all([
      context.queryClient.ensureQueryData(
        neighborhoodQO(params.citySlug, params.bairroSlug),
      ),
      context.queryClient.ensureQueryData(seoGlobalsServerQO),
    ]);
    return { data, globals };
  },
  head: ({ params, loaderData }) => {
    const d = loaderData?.data;
    const name = d?.neighborhood ?? titleCase(params.bairroSlug.replace(/-/g, " "));
    const city = d?.city ?? params.citySlug;
    const url = `${BASE}/${params.citySlug}/bairro/${params.bairroSlug}`;
    const seo = resolveSeo({
      url,
      fallbackTitle: `Empresas no bairro ${name} — ${city} | Tem na minha cidade`,
      fallbackDescription: `Veja restaurantes, mercados, serviços e profissionais no bairro ${name}, em ${city}.`,
      globals: loaderData?.globals ?? null,
    });
    const head = buildSeoHead({ seo, ogType: "website" });
    const crumbLd = breadcrumbJsonLd(BASE, [
      { label: city, path: `/${params.citySlug}` },
      { label: `Bairro ${name}`, path: `/${params.citySlug}/bairro/${params.bairroSlug}` },
    ]);
    return {
      meta: head.meta,
      links: head.links,
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
        <h1 className="font-display text-3xl font-bold">
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
