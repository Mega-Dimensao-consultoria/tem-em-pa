import { createFileRoute, Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/features/companies/components/CompanyStatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompanies } from "@/features/owner/hooks/useMyCompanies";

export const Route = createFileRoute("/_authenticated/owner/")({
  head: () => ({ meta: [{ title: "Painel do proprietário — Tem na cidade" }] }),
  component: OwnerPage,
});

function OwnerPage() {
  const { data: companies = [], isLoading } = useMyCompanies();

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Minhas empresas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie seus negócios e produtos.
            </p>
          </div>
          <Button asChild>
            <Link to="/cadastrar-empresa">+ Nova empresa</Link>
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : companies.length === 0 ? (
            <EmptyState
              icon={<Store className="h-6 w-6" />}
              title="Você ainda não tem empresas"
              description="Cadastre sua empresa para aparecer no guia."
              action={
                <Button asChild>
                  <Link to="/cadastrar-empresa">Cadastrar empresa</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
              {companies.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <CompanyStatusBadge status={c.status} className="mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/empresa/$id" params={{ id: c.id }}>
                        Ver página
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to="/owner/empresa/$id/dashboard"
                        params={{ id: c.id }}
                      >
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to="/owner/empresa/$id/editar"
                        params={{ id: c.id }}
                      >
                        Editar
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link
                        to="/owner/empresa/$id/produtos"
                        params={{ id: c.id }}
                      >
                        Produtos
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}
