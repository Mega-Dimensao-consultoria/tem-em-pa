import { createFileRoute, Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/features/companies/components/CompanyStatusBadge";
import { useMyCompanies } from "@/features/owner/hooks/useMyCompanies";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({ meta: [{ title: "Painel do proprietário — Tem em P.A" }] }),
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
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : companies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <Store className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Você ainda não tem empresas. Comece cadastrando uma.
              </p>
              <Button asChild className="mt-4">
                <Link to="/cadastrar-empresa">Cadastrar empresa</Link>
              </Button>
            </div>
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
