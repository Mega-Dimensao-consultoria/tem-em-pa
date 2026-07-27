import { Check, ExternalLink, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { usePendingClaims, useDecideClaim } from "@/features/admin/functions/claims";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function PendingClaimsTab() {
  const { data = [], isLoading } = usePendingClaims();
  const decide = useDecideClaim();
  const pg = usePagination(data);

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma reivindicação pendente.</Empty>;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="pending-claims-heading">
      <h2 id="pending-claims-heading" className="sr-only">Reivindicações pendentes</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Reivindicações de posse de empresas aguardando decisão.
          </caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
              <th scope="col" className="px-4 py-3 font-medium">Mensagem</th>
              <th scope="col" className="px-4 py-3 font-medium">Documentos</th>
              <th scope="col" className="px-4 py-3 font-medium">Enviada em</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pg.paged.map((c) => (
              <tr key={c.id} className="border-t border-border transition hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {c.companies?.name ?? `Empresa ${c.company_id.slice(0, 8)}`}
                  </p>
                </td>
                <td className="max-w-sm px-4 py-3">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {c.message || "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {Array.isArray(c.document_urls) && c.document_urls.length > 0
                    ? `${c.document_urls.length} anexo(s)`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/empresa/$id"
                        params={{ id: c.company_id }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" /> Ver
                      </Link>
                    </Button>
                    <ConfirmDestructive
                      trigger={
                        <Button size="sm" variant="outline">
                          <X className="mr-1 h-4 w-4" /> Rejeitar
                        </Button>
                      }
                      title="Rejeitar reivindicação?"
                      description="O usuário não receberá a posse desta empresa."
                      onConfirm={() => decide.mutate({ claim: c, status: "rejected" })}
                    />
                    <Button size="sm" onClick={() => decide.mutate({ claim: c, status: "approved" })}>
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
        label="reivindicações"
      />
    </section>
  );
}
