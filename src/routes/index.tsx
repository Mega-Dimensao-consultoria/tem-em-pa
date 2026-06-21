import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/features/companies/components/CategoryCard";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { listCategories } from "@/features/companies/functions/categories";
import { listFeaturedCompanies } from "@/features/companies/functions";
import { Sparkles, Store, ShieldCheck } from "lucide-react";
import { NoCompanies } from "@/components/feedback/EmptyState";

const categoriesQO = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
  staleTime: 60_000,
});
const featuredQO = queryOptions({
  queryKey: ["companies", "featured"],
  queryFn: () => listFeaturedCompanies(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tem em P.A — Encontre o melhor de Pouso Alegre" },
      { name: "description", content: "Restaurantes, mercados, serviços e muito mais perto de você em Pouso Alegre/MG. Guia comercial completo da cidade." },
      { property: "og:title", content: "Tem em P.A — Guia comercial de Pouso Alegre" },
      { property: "og:description", content: "Restaurantes, mercados, serviços e muito mais perto de você em Pouso Alegre/MG." },
      { property: "og:url", content: "https://tem-em-pa.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://tem-em-pa.lovable.app/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Tem em P.A",
        url: "https://tem-em-pa.lovable.app/",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://tem-em-pa.lovable.app/buscar?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      }),
    }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQO),
      context.queryClient.ensureQueryData(featuredQO),
    ]),
  component: Home,
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PageShell>
  ),
  notFoundComponent: () => null,
});

function Home() {
  const { data: categories } = useSuspenseQuery(categoriesQO);
  const { data: featured } = useSuspenseQuery(featuredQO);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-gradient opacity-[0.08]" />
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Pouso Alegre / MG
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            O melhor de <span className="text-primary">Pouso Alegre</span><br className="hidden md:block" /> está pertinho de você.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Descubra restaurantes, mercados, serviços e profissionais da sua cidade. Avaliações reais, contato direto.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-secondary" /> Empresas verificadas</span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1.5"><Store className="h-4 w-4 text-secondary" /> Comércio local</span>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Categorias</h2>
            <p className="text-sm text-muted-foreground">Explore por tipo de negócio</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.id} name={c.name} slug={c.slug} icon={c.icon} />
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Em destaque</h2>
            <p className="text-sm text-muted-foreground">Empresas que se destacam na cidade</p>
          </div>
        </div>
        {featured.length === 0 ? (
          <NoCompanies
            title="Em breve novos destaques"
            description="Ainda não há empresas em destaque. Volte em breve!"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CompanyCard key={c.id} company={c} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-8 text-center text-white shadow-elegant md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Tem um negócio em Pouso Alegre?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">Cadastre sua empresa gratuitamente e seja encontrado pelos seus clientes.</p>
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
