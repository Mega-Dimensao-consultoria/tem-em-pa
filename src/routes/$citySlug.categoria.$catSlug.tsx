import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { searchCompanies, getCategoryBySlug } from "@/features/companies/functions";
import { NoCompanies } from "@/components/feedback/EmptyState";
import { cityBySlugQO } from "./$citySlug";

const BASE = "https://www.temnaminhacidade.com.br";

const listQo = (cityId: string, slug: string) =>
  queryOptions({
    queryKey: ["category", cityId, slug],
    queryFn: () => searchCompanies({ data: { categorySlug: slug, cityId } }),
  });

const catQo = (slug: string) =>
  queryOptions({
    queryKey: ["category-meta", slug],
    queryFn: () => getCategoryBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/$citySlug/categoria/$catSlug")({
  loader: async ({ context, params }) => {
    const city = await context.queryClient.ensureQueryData(cityBySlugQO(params.citySlug));
    if (!city) return null;
    const [list, cat] = await Promise.all([
      context.queryClient.ensureQueryData(listQo(city.id, params.catSlug)),
      context.queryClient.ensureQueryData(catQo(params.catSlug)),
    ]);
    return { city, list, cat };
  },
  head: ({ params, loaderData }) => {
    const cityName = loaderData?.city?.name ?? params.citySlug;
    const name = loaderData?.cat?.name ?? params.catSlug.replace(/-/g, " ");
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const title = `${label} em ${cityName} — Tem na minha cidade`;
    const desc = `Encontre as melhores empresas de ${name} em ${cityName}. Endereços, contatos, avaliações e horário de funcionamento.`;
    const url = `${BASE}/${params.citySlug}/categoria/${params.catSlug}`;
    const crumbLd = breadcrumbJsonLd(BASE, [
      { label: cityName, path: `/${params.citySlug}` },
      { label, path: `/${params.citySlug}/categoria/${params.catSlug}` },
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
  const { citySlug, catSlug } = Route.useParams();
  const { data: city } = useSuspenseQuery(cityBySlugQO(citySlug));
  const { data } = useSuspenseQuery(listQo(city!.id, catSlug));
  const { data: cat } = useSuspenseQuery(catQo(catSlug));
  const name = cat?.name ?? catSlug.replace(/-/g, " ");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold capitalize">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.length} empresa(s) de {name.toLowerCase()} em {city!.name}
        </p>

        {data.length === 0 ? (
          <div className="mt-8">
            <NoCompanies title="Sem empresas nesta categoria" description={`Ainda não há empresas cadastradas em ${name} em ${city!.name}.`} />
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
