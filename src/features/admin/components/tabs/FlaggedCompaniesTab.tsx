import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, Flag, Pencil, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlaggedCompanies } from "@/features/admin/functions/companies";
import { CityFilterSelect } from "./CityFilterSelect";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function FlaggedCompaniesTab() {
  const { data = [], isLoading } = useFlaggedCompanies();
  const [cityId, setCityId] = useState<string>("all");
  const filtered = useMemo(
    () => (cityId === "all" ? data : data.filter((c) => c.city_id === cityId)),
    [data, cityId],
  );
  const pg = usePagination(filtered);

  if (isLoading) return <Loading />;
  if (data.length === 0)
    return <Empty>Nenhuma empresa com reivindicação ou denúncia em aberto.</Empty>;

  return (
    <section className="mt-4 space-y-4" aria-labelledby="flagged-heading">
      <header className="space-y-1">
        <h2 id="flagged-heading" className="sr-only">
          Empresas com reivindicações ou denúncias
        </h2>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Empresas com reivindicações pendentes ou avaliações denunciadas em aberto.
        </p>
      </header>

      <CityFilterSelect value={cityId} onChange={setCityId} />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Lista de empresas sinalizadas, com contagem de reivindicações e denúncias.
          </caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
              <th scope="col" className="px-4 py-3 font-medium">Sinalizações</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pg.paged.map((c) => (
              <tr key={c.id} className="border-t border-border transition hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.city ?? "—"} · status: {c.status}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {c.pending_claims > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                        <ShieldQuestion className="h-3 w-3" aria-hidden="true" />
                        {c.pending_claims} reivindicação{c.pending_claims === 1 ? "" : "ões"}
                      </span>
                    ) : null}
                    {c.pending_reports > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        {c.pending_reports} denúncia{c.pending_reports === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    {c.pending_claims === 0 && c.pending_reports === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      aria-label={`Visualizar empresa ${c.name}`}
                    >
                      <Link
                        to="/empresa/$id"
                        params={{ id: c.id }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-4 w-4" aria-hidden="true" />
                        Visualizar
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      aria-label={`Editar ${c.name}`}
                    >
                      <Link to="/owner/empresa/$id/editar" params={{ id: c.id }}>
                        <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                        Editar
                      </Link>
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


      <p className="text-xs text-muted-foreground">
        Para resolver, use as abas <strong>Reivindicações</strong> e{" "}
        <strong>Denúncias</strong>.
      </p>
    </section>
  );
}
