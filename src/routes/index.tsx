import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { MapPin, Sparkles, ShieldCheck, Store, Mail as MailIcon } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ContactDialog } from "@/features/contact/ContactDialog";
import { listHubCities } from "@/features/companies/functions";

const BASE = "https://pousoalegre.megadimensao.com.br";

const hubQO = queryOptions({
  queryKey: ["hub", "cities"],
  queryFn: () => listHubCities({ data: { limit: 12 } }),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tem na cidade — o guia local por cidade" },
      {
        name: "description",
        content:
          "Descubra restaurantes, mercados, serviços e comércio local em várias cidades. Avaliações reais e contato direto.",
      },
      { property: "og:title", content: "Tem na cidade — o guia local por cidade" },
      {
        property: "og:description",
        content:
          "Descubra restaurantes, mercados, serviços e comércio local em várias cidades.",
      },
      { property: "og:url", content: `${BASE}/` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${BASE}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Tem na cidade",
          url: `${BASE}/`,
        }),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(hubQO),
  component: Hub,
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

function Hub() {
  const { data: cities } = useSuspenseQuery(hubQO);

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-gradient opacity-[0.08]" />
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Tem na cidade
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            O <span className="text-primary">comércio local</span> da sua cidade,
            <br className="hidden md:block" /> num só lugar.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Escolha uma cidade e descubra restaurantes, mercados, serviços e profissionais perto de você.
          </p>
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
          <h2 className="font-display text-2xl font-bold md:text-3xl">Explore por cidade</h2>
          <p className="text-sm text-muted-foreground">Toque para entrar no guia da cidade</p>
        </div>
        {cities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma cidade disponível ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => (
              <Link
                key={c.id}
                to="/$citySlug"
                params={{ citySlug: c.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {c.og_image_url ? (
                    <img
                      src={c.og_image_url}
                      alt={c.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-hero-gradient opacity-90" />
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                    <MapPin className="h-3 w-3 text-primary" /> {c.state}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.company_count} empresa(s) cadastrada(s)
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-8 text-center text-white shadow-elegant md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Tem um negócio?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Cadastre sua empresa gratuitamente em qualquer cidade suportada.
          </p>
          <Link
            to="/cadastrar-empresa"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-white/90"
          >
            Cadastrar minha empresa
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft md:p-10">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Fale com a gente</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
            Dúvidas, sugestões ou parcerias? Envie uma mensagem para nossa equipe.
          </p>
          <div className="mt-6 flex justify-center">
            <ContactDialog
              trigger={
                <button className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                  <MailIcon className="h-4 w-4" /> Enviar mensagem
                </button>
              }
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
