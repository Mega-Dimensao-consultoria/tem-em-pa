import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { CompanyCard } from "@/components/CompanyCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  cat: z.string().trim().max(60).optional(),
});

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  ssr: false,
  head: () => ({ meta: [{ title: "Buscar — Tem em P.A" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q, cat } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ["search", q ?? "", cat ?? "", user?.id ?? "anon"],
    enabled: !authLoading,
    queryFn: async () => {
      let catId: string | null = null;
      if (cat) {
        const { data: c } = await supabase.from("categories").select("id").eq("slug", cat).maybeSingle();
        catId = c?.id ?? null;
      }
      // RLS automatically returns approved + the current user's own pending companies
      let query = supabase
        .from("companies")
        .select("id, name, slug, description, neighborhood, city, state, logo_url, cover_url, is_featured, status, owner_id, category_id, categories:category_id(name, slug, icon)")
        .limit(60)
        .order("created_at", { ascending: false });
      if (q) query = query.ilike("name", `%${q}%`);
      if (catId) query = query.eq("category_id", catId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const ownPending = user ? data.filter((c) => c.status !== "approved" && c.owner_id === user.id) : [];
  const approved = data.filter((c) => c.status === "approved");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6"><SearchBar defaultValue={q ?? ""} size="md" /></div>
        <h1 className="font-display text-2xl font-bold">
          {q ? `Resultados para "${q}"` : "Todas as empresas"}
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
            <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada. Tente outros termos.</p>
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
