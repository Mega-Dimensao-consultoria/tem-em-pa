import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  cat: z.string().trim().max(60).optional(),
  sort: z.enum(["relevance", "recent", "name", "distance"]).optional(),
  open: z.coerce.boolean().optional(),
});

type SearchValues = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Buscar empresas em Pouso Alegre — Tem em P.A" },
      {
        name: "description",
        content:
          "Busque empresas, restaurantes, serviços e produtos em Pouso Alegre/MG. Filtre por categoria e encontre o que está mais perto de você.",
      },
      { property: "og:title", content: "Buscar empresas em Pouso Alegre — Tem em P.A" },
      {
        property: "og:description",
        content: "Encontre empresas e serviços perto de você em Pouso Alegre/MG.",
      },
      { property: "og:url", content: "https://tem-em-pa.lovable.app/buscar" },
    ],
    links: [{ rel: "canonical", href: "https://tem-em-pa.lovable.app/buscar" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, cat, sort = "relevance", open } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { coords, loading: geoLoading, request: requestGeo } = useGeolocation();

  const { data: categories = [] } = useCategories();
  const { data: rawData = [], isLoading } = useSearchCompanies({
    q,
    cat,
    sort,
    userId: user?.id,
    enabled: !authLoading,
  });

  function updateSearch(patch: Partial<SearchValues>) {
    navigate({
      to: "/buscar",
      search: (prev: SearchValues) => ({ ...prev, ...patch }),
    });
  }

  const data = (() => {
    let rows = rawData ?? [];
    if (open) rows = rows.filter((c) => isOpenNow(c.hours));
    if (sort === "distance" && coords) {
      return [...rows]
        .map((c) => {
          const dist =
            c.lat != null && c.lng != null
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
          <SearchBar defaultValue={q ?? ""} size="md" />
        </div>

        <SearchFilters
          categories={categories}
          cat={cat}
          sort={sort}
          open={open}
          hasGeo={!!coords}
          geoLoading={geoLoading}
          q={q}
          onCat={(slug) => updateSearch({ cat: slug })}
          onSort={handleSort}
          onRequestGeo={handleRequestGeo}
          onToggleOpen={() => updateSearch({ open: open ? undefined : true })}
        />

        <h1 className="font-display text-2xl font-bold">
          {q ? `Resultados para "${q}"` : activeCat ? activeCat.name : "Todas as empresas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? "Buscando…" : `${approved.length} encontrada(s)`}
        </p>

        <SearchResults isLoading={isLoading} approved={approved} ownPending={ownPending} />
      </section>
    </PageShell>
  );
}
