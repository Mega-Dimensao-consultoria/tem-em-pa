import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Sparkles, ShieldCheck, Store, Mail as MailIcon, ChevronRight, ShoppingBag, MapPin } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { ContactDialog } from "@/features/contact/ContactDialog";
import { PromotedCompaniesSection } from "@/features/promotions/components/PromotedCompaniesSection";
import { AboutSection } from "@/features/faq/components/AboutSection";
import { FaqSection } from "@/features/faq/components/FaqSection";
import { faqQO } from "@/features/faq/functions/faqQuery";
import { listActiveCities } from "@/features/cities/functions/list";
import { seoGlobalsServerQO } from "@/features/seo/functions/getGlobals";
import { resolveSeo, buildSeoHead } from "@/lib/seo/render";
import type { SeoGlobals } from "@/lib/seo/types";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BASE = "https://www.temnaminhacidade.com.br";

const citiesQO = queryOptions({
  queryKey: ["cities", "all-active"],
  queryFn: () => listActiveCities(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/")({
  head: (ctx: { loaderData?: { globals: SeoGlobals } }) => {
    const globals = ctx.loaderData?.globals ?? null;
    const siteName = globals?.site_name ?? "Tem na minha cidade";
    const tagline = globals?.site_tagline ?? "o guia local por cidade";
    const fallbackTitle = `${siteName} — ${tagline}`;
    const fallbackDesc =
      globals?.default_description ??
      "Encontre empresas, profissionais e eventos na sua cidade. Busque por categoria, veja avaliações e descubra o que está rolando perto de você.";
    const seo = resolveSeo({
      url: `${BASE}/`,
      fallbackTitle,
      fallbackDescription: fallbackDesc,
      fallbackSchemaType: "WebSite",
      globals,
    });
    const head = buildSeoHead({ seo, ogType: "website" });
    return {
      meta: head.meta,
      links: head.links,
      scripts: head.scripts,
    };
  },
  loader: async ({ context }) => {
    const [globals] = await Promise.all([
      context.queryClient.ensureQueryData(seoGlobalsServerQO),
      context.queryClient.ensureQueryData(citiesQO),
      context.queryClient.ensureQueryData(faqQO),
    ]);
    return { globals };
  },
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

function PromotedProductsGrid() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["homepage-promoted-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, price, is_promoted, image_url_1,
          company:companies(
            id,
            name,
            city:cities(name, state)
          )
        `)
        .eq("is_active", true)
        .eq("is_promoted", true)
        .eq("companies.status", "approved")
        .not("image_url_1", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <Link 
          key={p.id} 
          to="/vendas"
          className="group block"
        >
          <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all rounded-2xl">
            <div className="relative aspect-square bg-muted overflow-hidden">
              <img
                src={p.image_url_1!}
                alt={p.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {p.price && (
                <div className="absolute bottom-2 right-2">
                  <Badge className="bg-background/90 backdrop-blur-sm text-primary font-bold shadow-sm">
                    R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <MapPin className="h-2.5 w-2.5" />
                <span>{(p.company as any).city.name}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function Hub() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-gradient opacity-[0.08]" />
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Tem na minha cidade
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            O <span className="text-primary">comércio local</span> da sua cidade,
            <br className="hidden md:block" /> num só lugar.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Digite o nome da sua cidade e encontre o comércio local pertinho de você.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <CityAutocomplete />
          </div>


          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-secondary" /> apoiando os pequenos negócios!
            </span>
            <span className="text-border">--&gt;</span>
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-4 w-4 text-secondary" /> Na sua cidade
            </span>
          </div>
        </div>
      </section>

      <AboutSection />

      <PromotedCompaniesSection
        title="Empresas em destaque agora"
        subtitle="Selecionadas em tempo real entre as empresas com destaque ativo."
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">O que estão vendendo?</h2>
            <p className="text-muted-foreground mt-1">Confira os últimos produtos anunciados no marketplace local.</p>
          </div>
          <Link 
            to="/vendas" 
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group"
          >
            Ver tudo no marketplace
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <PromotedProductsGrid />
      </section>

      <FaqSection />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient p-8 text-center text-white shadow-elegant md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Tem um negócio?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Cadastre sua empresa gratuitamente em qualquer cidade do Brasil.
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
