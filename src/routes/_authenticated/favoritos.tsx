import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { PageShell } from "@/components/PageShell";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/favoritos")({
  component: FavoritosPage,
  head: () => ({ meta: [{ title: "Meus favoritos | Tem em PA" }] }),
});

type Company = {
  id: string;
  name: string;
  description: string | null;
  neighborhood: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  categories: { name: string | null } | null;
};

function FavoritosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("favorites")
        .select(
          "company_id, created_at, companies:company_id(id, name, description, neighborhood, city, logo_url, cover_url, is_featured, categories:category_id(name))",
        )
        .order("created_at", { ascending: false });
      const rows = (data ?? [])
        .map((r) => r.companies as unknown as Company)
        .filter(Boolean);
      setItems(rows);
      setLoading(false);
    })();
  }, [user]);

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Meus favoritos</h1>
          <p className="text-sm text-muted-foreground">
            Empresas que você salvou para acessar rapidamente depois.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Você ainda não favoritou nenhuma empresa.
            </div>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/buscar">Explorar empresas</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
