import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { Sparkles, ShieldCheck, Store, Mail as MailIcon } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { ContactDialog } from "@/features/contact/ContactDialog";
import { PromotedCompaniesSection } from "@/features/promotions/components/PromotedCompaniesSection";
import { listActiveCities } from "@/features/cities/functions/list";
import { seoGlobalsServerQO } from "@/features/seo/functions/getGlobals";
import { resolveSeo, buildSeoHead } from "@/lib/seo/render";
import type { SeoGlobals } from "@/lib/seo/types";

const BASE = "https://www.temnaminhacidade.com.br";

const statesQO = queryOptions({
  queryKey: ["hub", "states"],
  queryFn: () => listStates(),
  staleTime: 5 * 60_000,
});

const citiesByStateQO = (uf: string) =>
  queryOptions({
    queryKey: ["hub", "cities-by-state", uf],
    queryFn: () => listCitiesByState({ data: { uf } }),
    staleTime: 5 * 60_000,
    enabled: !!uf,
  });

export const Route = createFileRoute("/")({
  head: (ctx: { loaderData?: { globals: SeoGlobals } }) => {
    const globals = ctx.loaderData?.globals ?? null;
    const siteName = globals?.site_name ?? "Tem na minha cidade";
    const tagline = globals?.site_tagline ?? "o guia local por cidade";
    const fallbackTitle = `${siteName} — ${tagline}`;
    const fallbackDesc =
      globals?.default_description ??
      "Descubra restaurantes, mercados, serviços e comércio local em qualquer cidade do Brasil. Avaliações reais e contato direto.";
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
      context.queryClient.ensureQueryData(statesQO),
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

function Hub() {
  const navigate = useNavigate();
  const { data: states } = useSuspenseQuery(statesQO);
  const [uf, setUf] = useState<string>("");
  const [citySlug, setCitySlug] = useState<string>("");

  const { data: cities, isFetching: loadingCities } = useQuery(citiesByStateQO(uf));

  function handleGo(e: React.FormEvent) {
    e.preventDefault();
    if (!citySlug) return;
    navigate({ to: "/$citySlug", params: { citySlug } });
  }

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
            Escolha seu estado e cidade para ver as empresas cadastradas na sua região.
          </p>

          <form
            onSubmit={handleGo}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row"
          >
            <label className="sr-only" htmlFor="uf">Estado</label>
            <select
              id="uf"
              value={uf}
              onChange={(e) => {
                setUf(e.target.value);
                setCitySlug("");
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm sm:w-40"
            >
              <option value="">UF</option>
              {states.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.uf}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="city">Cidade</label>
            <select
              id="city"
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              disabled={!uf || loadingCities}
              className="w-full flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
            >
              <option value="">
                {!uf
                  ? "Selecione um estado primeiro"
                  : loadingCities
                    ? "Carregando cidades…"
                    : "Escolha a cidade"}
              </option>
              {(cities ?? []).map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!citySlug}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loadingCities ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Ver empresas
            </button>
          </form>

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

      <PromotedCompaniesSection
        title="Empresas em destaque agora"
        subtitle="Selecionadas em tempo real entre as empresas com destaque ativo."
      />

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
