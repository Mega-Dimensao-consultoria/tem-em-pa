import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { searchCompanies, getCategoryBySlug } from "@/features/companies/functions";
import { NoCompanies } from "@/components/feedback/EmptyState";
import { cityBySlugQO } from "./$citySlug";
import { seoGlobalsServerQO } from "@/features/seo/functions/getGlobals";
import { resolveSeo, buildSeoHead } from "@/lib/seo/render";

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
    const [city, globals] = await Promise.all([
      context.queryClient.ensureQueryData(cityBySlugQO(params.citySlug)),
      context.queryClient.ensureQueryData(seoGlobalsServerQO),
    ]);
    if (!city) return null;
    const [list, cat] = await Promise.all([
      context.queryClient.ensureQueryData(listQo(city.id, params.catSlug)),
      context.queryClient.ensureQueryData(catQo(params.catSlug)),
    ]);
    return { city, list, cat, globals };
  },
  head: ({ params, loaderData }) => {
    const cityName = loaderData?.city?.name ?? params.citySlug;
    const state = loaderData?.city?.state ?? "";
    const catRow = loaderData?.cat as
      | { name?: string | null; seo_title?: string | null; seo_description?: string | null; og_image_url?: string | null; canonical_url?: string | null; noindex?: boolean | null }
      | null
      | undefined;
    const name = catRow?.name ?? params.catSlug.replace(/-/g, " ");
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const fallbackTitle = `${label} em ${cityName} — Tem na minha cidade`;
    const fallbackDesc = `Encontre as melhores empresas de ${name} em ${cityName}. Endereços, contatos, avaliações e horário de funcionamento.`;
    const url = `${BASE}/${params.citySlug}/categoria/${params.catSlug}`;
    const seo = resolveSeo({
      url,
      fallbackTitle,
      fallbackDescription: fallbackDesc,
      override: {
        seo_title: catRow?.seo_title ?? null,
        seo_description: catRow?.seo_description ?? null,
        og_image_url: catRow?.og_image_url ?? null,
        canonical_url: catRow?.canonical_url ?? null,
        noindex: catRow?.noindex ?? null,
      },
      templateKind: "category",
      templateVars: { categoria: label, cidade: cityName, estado: state },
      globals: loaderData?.globals ?? null,
    });
    const head = buildSeoHead({ seo, ogType: "website" });
    const crumbLd = breadcrumbJsonLd(BASE, [
      { label: cityName, path: `/${params.citySlug}` },
      { label, path: `/${params.citySlug}/categoria/${params.catSlug}` },
    ]);
    return {
      meta: head.meta,
      links: head.links,
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
