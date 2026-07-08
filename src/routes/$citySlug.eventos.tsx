import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, MapPin, X, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { usePublicCityEvents } from "@/features/events/hooks/useCityEvents";
import { useCategories } from "@/features/companies/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/EmptyState";
import { EventCalendarButtons } from "@/features/events/components/EventCalendarButtons";
import { cityBySlugQO } from "./$citySlug";

const BASE = "https://temnacidade.com";

export const Route = createFileRoute("/$citySlug/eventos")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(cityBySlugQO(params.citySlug)),
  head: ({ params, loaderData }) => {
    const cityName = loaderData?.name ?? params.citySlug;
    const title = `Eventos em ${cityName} — Tem na cidade`;
    const desc = `Confira os próximos eventos, promoções e novidades das empresas em ${cityName}.`;
    const url = `${BASE}/${params.citySlug}/eventos`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CityEventosPage,
});

function fmt(startsAt: string, endsAt: string | null) {
  const s = new Date(startsAt);
  const sTxt = s.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  if (!endsAt) return sTxt;
  const e = new Date(endsAt);
  const eTxt = s.toDateString() === e.toDateString()
    ? e.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : e.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return `${sTxt} → ${eTxt}`;
}

type DateFilter = "all" | "today" | "week" | "month";
function endOf(range: DateFilter): number {
  const now = new Date();
  const end = new Date(now);
  if (range === "today") end.setHours(23, 59, 59, 999);
  else if (range === "week") { end.setDate(end.getDate() + 7); end.setHours(23, 59, 59, 999); }
  else if (range === "month") { end.setDate(end.getDate() + 30); end.setHours(23, 59, 59, 999); }
  else return Infinity;
  return end.getTime();
}
function normalize(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function CityEventosPage() {
  const { citySlug } = Route.useParams();
  const { data: city } = useSuspenseQuery(cityBySlugQO(citySlug));
  const { data = [], isLoading } = usePublicCityEvents(city?.id ?? null);
  const { data: categories = [] } = useCategories();

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [catSlug, setCatSlug] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");

  const filtered = useMemo(() => {
    const now = Date.now();
    const upper = endOf(dateFilter);
    const nQ = normalize(neighborhood);
    return data.filter((ev) => {
      const t = new Date(ev.starts_at).getTime();
      if (dateFilter !== "all" && (t > upper || t < now - 60 * 60 * 1000)) return false;
      if (catSlug && ev.companies?.categories?.slug !== catSlug) return false;
      if (nQ) {
        const parts = [ev.location ?? "", ev.companies?.neighborhoods?.name ?? ""]
          .filter(Boolean).map(normalize).join(" ");
        if (!parts.includes(nQ)) return false;
      }
      return true;
    });
  }, [data, dateFilter, catSlug, neighborhood]);

  const hasFilters = dateFilter !== "all" || catSlug || neighborhood;

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Eventos em {city!.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            O que está acontecendo nas empresas e serviços da cidade.
          </p>
        </header>

        <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quando:</span>
            {([
              { v: "all", label: "Todos" },
              { v: "today", label: "Hoje" },
              { v: "week", label: "7 dias" },
              { v: "month", label: "30 dias" },
            ] as { v: DateFilter; label: string }[]).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setDateFilter(opt.v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  dateFilter === opt.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria:</span>
            <button
              type="button"
              onClick={() => setCatSlug("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                !catSlug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              Todas
            </button>
            {categories.slice(0, 10).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCatSlug(c.slug === catSlug ? "" : c.slug)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  catSlug === c.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bairro / local:</label>
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex.: Centro"
              className="h-8 max-w-[220px] text-xs"
            />
            {hasFilters ? (
              <button
                type="button"
                onClick={() => { setDateFilter("all"); setCatSlug(""); setNeighborhood(""); }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Limpar filtros
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Carregando…" : `${filtered.length} evento(s) encontrado(s)`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title={hasFilters ? "Nenhum evento com esses filtros" : "Nenhum evento no momento"}
            description={hasFilters ? "Tente limpar os filtros ou ampliar o intervalo." : "Volte em breve."}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev) => (
              <li key={ev.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-md">
                {ev.image_url ? (
                  <img src={ev.image_url} alt={ev.title} className="aspect-[16/9] w-full object-cover" loading="lazy" />
                ) : (
                  <div className="aspect-[16/9] w-full bg-hero-gradient opacity-80" />
                )}
                <div className="p-4">
                  {ev.companies?.cities?.slug && ev.companies?.slug ? (
                    <Link
                      to="/$citySlug/empresa/$compSlug"
                      params={{ citySlug: ev.companies.cities.slug, compSlug: ev.companies.slug }}
                      className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
                    >
                      {ev.companies.name}
                    </Link>
                  ) : ev.companies ? (
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {ev.companies.name}
                    </span>
                  ) : null}
                  <h2 className="mt-1 font-display text-base font-semibold">
                    <Link to="/eventos/$id" params={{ id: ev.id }} className="hover:underline">
                      {ev.title}
                    </Link>
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {fmt(ev.starts_at, ev.ends_at)}
                    </span>
                    {ev.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ev.location}
                      </span>
                    ) : null}
                  </div>
                  {ev.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{ev.description}</p>
                  ) : null}
                  <div className="mt-3">
                    <EventCalendarButtons
                      event={{
                        uid: ev.id,
                        title: ev.title,
                        description: ev.description,
                        location: ev.location,
                        startsAt: ev.starts_at,
                        endsAt: ev.ends_at,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
