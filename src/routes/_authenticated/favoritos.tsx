import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { useMyFavorites } from "@/features/favorites/hooks/useMyFavorites";

export const Route = createFileRoute("/_authenticated/favoritos")({
  component: FavoritosPage,
  head: () => ({ meta: [{ title: "Meus favoritos | Tem em PA" }] }),
});

function FavoritosPage() {
  const { data: items = [], isLoading } = useMyFavorites();

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Meus favoritos
          </h1>
          <p className="text-sm text-muted-foreground">
            Empresas que você salvou para acessar rapidamente depois.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
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
