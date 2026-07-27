import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  usePendingRemovals,
  useDecideRemoval,
  REMOVAL_REASON_LABEL,
} from "@/features/admin/functions/removals";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function PendingRemovalsTab() {
  const { data = [], isLoading } = usePendingRemovals();
  const decide = useDecideRemoval();
  const pg = usePagination(data);

  if (isLoading) return <Loading />;
  if (data.length === 0)
    return <Empty>Nenhuma solicitação de remoção pendente.</Empty>;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="pending-removals-heading">
      <h2 id="pending-removals-heading" className="sr-only">Remoções pendentes</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <caption className="sr-only">Solicitações de remoção de empresa.</caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
              <th scope="col" className="px-4 py-3 font-medium">Motivo</th>
              <th scope="col" className="px-4 py-3 font-medium">Detalhes</th>
              <th scope="col" className="px-4 py-3 font-medium">Enviada em</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pg.paged.map((r) => (
              <tr key={r.id} className="border-t border-border transition hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">
                  {r.companies?.name ?? `Empresa ${r.company_id.slice(0, 8)}`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {REMOVAL_REASON_LABEL[r.reason]}
                </td>
                <td className="max-w-sm px-4 py-3">
                  <p className="line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {r.details || "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ConfirmDestructive
                      trigger={
                        <Button size="sm" variant="outline">
                          <X className="mr-1 h-4 w-4" /> Rejeitar
                        </Button>
                      }
                      title="Rejeitar solicitação?"
                      description="A empresa continuará visível no diretório."
                      onConfirm={() => decide.mutate({ removal: r, status: "rejected" })}
                    />
                    <ConfirmDestructive
                      trigger={
                        <Button size="sm">
                          <Check className="mr-1 h-4 w-4" /> Aprovar
                        </Button>
                      }
                      title="Aprovar e remover empresa?"
                      description="A empresa será ocultada do diretório público imediatamente."
                      onConfirm={() => decide.mutate({ removal: r, status: "approved" })}
                    />
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
        label="remoções"
      />
    </section>
  );
}
