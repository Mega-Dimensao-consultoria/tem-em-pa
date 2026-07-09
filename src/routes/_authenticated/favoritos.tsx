import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { useMyFavorites } from "@/features/favorites/hooks/useMyFavorites";
import { CompanyListSkeleton } from "@/components/feedback/Skeletons";
import { NoFavorites } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export const Route = createFileRoute("/_authenticated/favoritos")({
  component: FavoritosPage,
  head: () => ({ meta: [{ title: "Meus favoritos | Tem na cidade" }] }),
});

function FavoritosPage() {
  const { data: items = [], isLoading, isError, error } = useMyFavorites();

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
          <CompanyListSkeleton count={6} />
        ) : isError ? (
          <ErrorState error={error} />
        ) : items.length === 0 ? (
          <NoFavorites
            action={
              <Button asChild size="sm" className="rounded-full">
                <Link to="/">Explorar empresas</Link>
              </Button>
            }
          />
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
