import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { SearchFilters } from "@/features/companies/components/SearchFilters";
import { SearchResults } from "@/features/companies/components/SearchResults";
import { useAuth } from "@/features/auth/use-auth";
import { useCategories } from "@/features/companies/hooks/useCategories";
import { useGeolocation, haversineKm } from "@/hooks/useGeolocation";
import {
  useSearchCompanies,
  scoreCompanyRelevance,
  type SearchSort,
} from "@/features/companies/hooks/useSearchCompanies";
import { isOpenNow } from "@/lib/hours";
import { cityBySlugQO } from "./$citySlug";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  cat: z.string().trim().max(60).optional(),
  sort: z.enum(["relevance", "recent", "name", "distance"]).optional(),
  open: z.coerce.boolean().optional(),
});
type SearchValues = z.infer<typeof searchSchema>;

const BASE = "https://pousoalegre.megadimensao.com.br";

export const Route = createFileRoute("/$citySlug/buscar")({
  validateSearch: searchSchema,
  ssr: false,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(cityBySlugQO(params.citySlug)),
  head: ({ params, loaderData }) => {
    const cityName = loaderData?.name ?? params.citySlug;
    const title = `Buscar empresas em ${cityName} — Tem na cidade`;
    const desc = `Busque empresas, restaurantes, serviços e produtos em ${cityName}. Filtre por categoria e encontre o que está mais perto de você.`;
    const url = `${BASE}/${params.citySlug}/buscar`;
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
  component: CitySearchPage,
});

function CitySearchPage() {
  const { citySlug } = Route.useParams();
  const { data: city } = useSuspenseQuery(cityBySlugQO(citySlug));
  const { q, cat, sort = "relevance", open } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { coords, loading: geoLoading, request: requestGeo } = useGeolocation();

  const { data: categories = [] } = useCategories();
  const { data: rawData = [], isLoading } = useSearchCompanies({
    q, cat, sort,
    userId: user?.id,
    enabled: !authLoading,
    cityId: city?.id ?? null,
  });

  function updateSearch(patch: Partial<SearchValues>) {
    navigate({
      to: "/$citySlug/buscar",
      params: { citySlug },
      search: (prev: SearchValues) => ({ ...prev, ...patch }),
    });
  }

  const data = (() => {
    let rows = rawData ?? [];
    if (open) rows = rows.filter((c) => isOpenNow(c.hours));
    if (sort === "distance" && coords) {
      return [...rows]
        .map((c) => {
          const dist = c.lat != null && c.lng != null
            ? haversineKm(coords.lat, coords.lng, c.lat, c.lng)
            : Infinity;
          return { ...c, _dist: dist };
        })
        .sort((a, b) => a._dist - b._dist);
    }
    if (sort === "relevance") {
      return [...rows].sort(
        (a, b) => scoreCompanyRelevance(b, q) - scoreCompanyRelevance(a, q),
      );
    }
    return rows;
  })();

  const ownPending = user
    ? data.filter((c) => c.status !== "approved" && c.owner_id === user.id)
    : [];
  const approved = data.filter((c) => c.status === "approved");
  const activeCat = categories.find((c) => c.slug === cat);

  function handleSort(v: SearchSort) {
    if (v === "distance" && !coords) {
      requestGeo(() => updateSearch({ sort: "distance" }));
      return;
    }
    updateSearch({ sort: v });
  }

  function handleRequestGeo() {
    requestGeo(() => {
      toast.success("Mostrando empresas mais próximas.");
      updateSearch({ sort: "distance" });
    });
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <SearchBar defaultValue={q ?? ""} size="md" citySlug={citySlug} placeholder={`Buscar em ${city?.name ?? ""}…`} />
        </div>

        <SearchFilters
          categories={categories}
          cat={cat}
          sort={sort}
          open={open}
          hasGeo={!!coords}
          geoLoading={geoLoading}
          q={q}
          citySlug={citySlug}
          onCat={(slug) => updateSearch({ cat: slug })}
          onSort={handleSort}
          onRequestGeo={handleRequestGeo}
          onToggleOpen={() => updateSearch({ open: open ? undefined : true })}
        />

        <h1 className="font-display text-2xl font-bold">
          {q ? `Resultados para "${q}"` : activeCat ? activeCat.name : `Todas as empresas em ${city?.name ?? ""}`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? "Buscando…" : `${approved.length} encontrada(s)`}
        </p>

        <SearchResults isLoading={isLoading} approved={approved} ownPending={ownPending} />
      </section>
    </PageShell>
  );
}
