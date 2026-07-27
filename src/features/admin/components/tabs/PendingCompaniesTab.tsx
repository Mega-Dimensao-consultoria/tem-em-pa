import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { usePendingCompanies, useDecideCompany } from "@/features/admin/functions/companies";
import { CityFilterSelect } from "./CityFilterSelect";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function PendingCompaniesTab() {
  const { data = [], isLoading } = usePendingCompanies();
  const decide = useDecideCompany();
  const [filter, setFilter] = useState("");
  const [cityId, setCityId] = useState<string>("all");

  const filtered = useMemo(
    () =>
      data.filter((c) => {
        if (cityId !== "all" && c.city_id !== cityId) return false;
        if (!filter) return true;
        const q = filter.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q);
      }),
    [data, filter, cityId],
  );

  const pg = usePagination(filtered);

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma empresa aguardando aprovação.</Empty>;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="pending-companies-heading">
      <h2 id="pending-companies-heading" className="sr-only">
        Empresas aguardando aprovação
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filtrar por nome ou cidade…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <CityFilterSelect value={cityId} onChange={setCityId} />
      </div>

      {filtered.length === 0 ? (
        <Empty>Nenhuma empresa encontrada com esses filtros.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Empresas pendentes de aprovação com ações de aprovar ou rejeitar.
              </caption>
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
                  <th scope="col" className="px-4 py-3 font-medium">Cidade</th>
                  <th scope="col" className="px-4 py-3 font-medium">Enviada em</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pg.paged.map((c) => (
                  <tr key={c.id} className="border-t border-border transition hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      {c.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {c.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.city ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/empresa/$id" params={{ id: c.id }} target="_blank">
                            <ExternalLink className="mr-1 h-3 w-3" /> Ver
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/owner/empresa/$id/editar" params={{ id: c.id }}>
                            <Pencil className="mr-1 h-3 w-3" /> Editar
                          </Link>
                        </Button>
                        <ConfirmDestructive
                          trigger={
                            <Button size="sm" variant="outline">
                              <X className="mr-1 h-4 w-4" /> Rejeitar
                            </Button>
                          }
                          title="Rejeitar empresa?"
                          description={
                            <p>
                              A empresa <strong>{c.name}</strong> ficará oculta para todos.
                            </p>
                          }
                          confirmText="Rejeitar"
                          onConfirm={() =>
                            decide.mutate({ id: c.id, name: c.name, status: "rejected" })
                          }
                        />
                        <Button
                          size="sm"
                          onClick={() => decide.mutate({ id: c.id, name: c.name, status: "approved" })}
                        >
                          <Check className="mr-1 h-4 w-4" /> Aprovar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={pg.page}
            totalPages={pg.totalPages}
            total={pg.total}
            pageSize={pg.pageSize}
            firstItem={pg.firstItem}
            lastItem={pg.lastItem}
            onPageChange={pg.setPage}
            onPageSizeChange={pg.setPageSize}
            label="empresas"
          />
        </>
      )}
    </section>
  );
}
