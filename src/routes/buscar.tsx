import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { CompanyCard } from "@/components/CompanyCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/lib/categories.functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isOpenNow } from "@/lib/hours";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  cat: z.string().trim().max(60).optional(),
  sort: z.enum(["recent", "name", "distance"]).optional(),
  open: z.coerce.boolean().optional(),
});

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Buscar empresas em Pouso Alegre — Tem em P.A" },
      { name: "description", content: "Busque empresas, restaurantes, serviços e produtos em Pouso Alegre/MG. Filtre por categoria e encontre o que está mais perto de você." },
      { property: "og:title", content: "Buscar empresas em Pouso Alegre — Tem em P.A" },
      { property: "og:description", content: "Encontre empresas e serviços perto de você em Pouso Alegre/MG." },
      { property: "og:url", content: "https://tem-em-pa.lovable.app/buscar" },
    ],
    links: [{ rel: "canonical", href: "https://tem-em-pa.lovable.app/buscar" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, cat, sort = "recent" } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ["search", q ?? "", cat ?? "", sort, user?.id ?? "anon"],
    enabled: !authLoading,
    queryFn: async () => {
      let catId: string | null = null;
      if (cat) {
        const { data: c } = await supabase.from("categories").select("id").eq("slug", cat).maybeSingle();
        catId = c?.id ?? null;
      }
      let query = supabase
        .from("companies")
        .select("id, name, slug, description, neighborhood, city, state, lat, lng, logo_url, cover_url, is_featured, status, owner_id, category_id, categories:category_id(name, slug, icon)")
        .limit(120);
      if (sort === "name") query = query.order("name", { ascending: true });
      else query = query.order("created_at", { ascending: false });
      if (q) query = query.ilike("name", `%${q}%`);
      if (catId) query = query.eq("category_id", catId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const data = (() => {
    if (sort !== "distance" || !geo) return rawData;
    return [...rawData]
      .map((c) => {
        const lat = (c as any).lat as number | null;
        const lng = (c as any).lng as number | null;
        const dist = lat != null && lng != null ? haversineKm(geo.lat, geo.lng, lat, lng) : Infinity;
        return { ...c, _dist: dist };
      })
      .sort((a, b) => (a as any)._dist - (b as any)._dist);
  })();

  const ownPending = user ? data.filter((c) => c.status !== "approved" && c.owner_id === user.id) : [];
  const approved = data.filter((c) => c.status === "approved");
  const activeCat = categories.find((c) => c.slug === cat);

  function updateSearch(patch: Partial<{ q?: string; cat?: string; sort?: "recent" | "name" | "distance" }>) {
    navigate({ to: "/buscar", search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }) });
  }

  function requestGeo() {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada neste navegador.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        updateSearch({ sort: "distance" });
        toast.success("Localização obtida. Mostrando empresas mais próximas.");
      },
      (err) => {
        setGeoLoading(false);
        toast.error(err.message || "Não foi possível obter sua localização.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6"><SearchBar defaultValue={q ?? ""} size="md" /></div>

        {/* Filtros */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria:</span>
            <button
              onClick={() => updateSearch({ cat: undefined })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${!cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
            >
              Todas
            </button>
            {categories.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => updateSearch({ cat: c.slug })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${cat === c.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordenar por:</span>
            <Select value={sort} onValueChange={(v) => {
              if (v === "distance" && !geo) { requestGeo(); return; }
              updateSearch({ sort: v as "recent" | "name" | "distance" });
            }}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="name">Nome (A→Z)</SelectItem>
                <SelectItem value="distance">Mais próximas</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={sort === "distance" && geo ? "default" : "outline"}
              size="sm"
              onClick={requestGeo}
              disabled={geoLoading}
              className="h-8 rounded-full text-xs"
            >
              {geoLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Navigation className="mr-1 h-3 w-3" />}
              {geo ? "Atualizar localização" : "Perto de mim"}
            </Button>
            {(q || cat) ? (
              <Link to="/buscar" search={{}} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" /> Limpar filtros
              </Link>
            ) : null}
          </div>
        </div>


        <h1 className="font-display text-2xl font-bold">
          {q ? `Resultados para "${q}"` : activeCat ? activeCat.name : "Todas as empresas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? "Buscando…" : `${approved.length} encontrada(s)`}
        </p>

        {ownPending.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
              <Badge variant="secondary">Minhas pendentes</Badge>
              <span className="text-xs">visíveis somente para você</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ownPending.map((c) => <CompanyCard key={c.id} company={c} />)}
            </div>
          </div>
        ) : null}

        {!isLoading && approved.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada. Tente outros termos ou outra categoria.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((c) => <CompanyCard key={c.id} company={c} />)}
          </div>
        )}
      </section>
    </PageShell>
  );
}
