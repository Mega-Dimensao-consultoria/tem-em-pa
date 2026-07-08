import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Store, ShieldCheck, Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/features/companies/components/CategoryCard";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { NoCompanies } from "@/components/feedback/EmptyState";
import { listCategories } from "@/features/companies/functions/categories";
import { listFeaturedCompanies, listRecentCompaniesByCity } from "@/features/companies/functions";
import { cityBySlugQO } from "./$citySlug";

const BASE = "https://temnacidade.com";
const PAGE_SIZE = 15;

const categoriesQO = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
  staleTime: 60_000,
});

const featuredByCityQO = (cityId: string) =>
  queryOptions({
    queryKey: ["companies", "featured", cityId],
    queryFn: () => listFeaturedCompanies({ data: { cityId } }),
    staleTime: 60_000,
  });

const recentByCityQO = (cityId: string, limit: number) =>
  queryOptions({
    queryKey: ["companies", "recent", cityId, limit],
    queryFn: () => listRecentCompaniesByCity({ data: { cityId, limit, offset: 0 } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/$citySlug/")({
  loader: async ({ context, params }) => {
    const city = await context.queryClient.ensureQueryData(cityBySlugQO(params.citySlug));
    if (!city) return null;
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQO),
      context.queryClient.ensureQueryData(featuredByCityQO(city.id)),
    ]);
    return city;
  },
  head: ({ params, loaderData }) => {
    const cityName = loaderData?.name ?? params.citySlug;
    const state = loaderData?.state ?? "";
    const title =
      loaderData?.hero_headline ??
      `Tem na cidade — o guia local de ${cityName}${state ? "/" + state : ""}`;
    const desc =
      loaderData?.hero_subheadline ??
      `Restaurantes, mercados, serviços e comércio local em ${cityName}. Avaliações reais e contato direto.`;
    const url = `${BASE}/${params.citySlug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        ...(loaderData?.og_image_url
          ? [{ property: "og:image", content: loaderData.og_image_url }]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CityHome,
});

function CityHome() {
  const { citySlug } = Route.useParams();
  const { data: city } = useSuspenseQuery(cityBySlugQO(citySlug));
  const { data: categories } = useSuspenseQuery(categoriesQO);
  const { data: featured } = useSuspenseQuery(featuredByCityQO(city!.id));

  const [recentLimit, setRecentLimit] = useState(PAGE_SIZE);
  const showRecent = featured.length === 0;
  const recentQuery = useQuery({
    ...recentByCityQO(city!.id, recentLimit),
    enabled: showRecent,
  });
  const recent = recentQuery.data?.companies ?? [];
  const recentTotal = recentQuery.data?.total ?? 0;
  const hasMore = recent.length < recentTotal;


  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-gradient opacity-[0.08]" />
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {city!.name} / {city!.state}
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            {city!.hero_headline ?? (
              <>
                O melhor de <span className="text-primary">{city!.name}</span>
                <br className="hidden md:block" /> está pertinho de você.
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            {city!.hero_subheadline ??
              "Descubra restaurantes, mercados, serviços e profissionais da sua cidade."}
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar
              citySlug={city!.slug}
              placeholder={city!.search_placeholder ?? `Buscar em ${city!.name}…`}
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-secondary" /> Empresas verificadas
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-4 w-4 text-secondary" /> Comércio local
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Categorias</h2>
          <p className="text-sm text-muted-foreground">Explore por tipo de negócio</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.id} name={c.name} slug={c.slug} icon={c.icon} citySlug={city!.slug} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {showRecent ? (
          <>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold md:text-3xl">Empresas em {city!.name}</h2>
              <p className="text-sm text-muted-foreground">
                Ainda não há destaques — veja as empresas cadastradas mais recentemente.
              </p>
            </div>
            {recentQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando empresas…
              </div>
            ) : recent.length === 0 ? (
              <NoCompanies
                title={`Nenhuma empresa cadastrada em ${city!.name}`}
                description="Ainda não há empresas aprovadas nesta cidade. Que tal ser a primeira?"
                action={
                  <Link
                    to="/cadastrar-empresa"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Cadastrar minha empresa
                  </Link>
                }
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recent.map((c) => <CompanyCard key={c.id} company={c} />)}
                </div>
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setRecentLimit((n) => n + PAGE_SIZE)}
                      disabled={recentQuery.isFetching}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60"
                    >
                      {recentQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                      Mostrar mais empresas
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold md:text-3xl">Em destaque</h2>
              <p className="text-sm text-muted-foreground">Empresas que se destacam em {city!.name}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => <CompanyCard key={c.id} company={c} />)}
            </div>
          </>
        )}
      </section>


      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-8 text-center text-white shadow-elegant md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Tem um negócio em {city!.name}?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Cadastre sua empresa gratuitamente e seja encontrado pelos seus clientes.
          </p>
          <Link
            to="/cadastrar-empresa"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-white/90"
          >
            Cadastrar minha empresa
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
