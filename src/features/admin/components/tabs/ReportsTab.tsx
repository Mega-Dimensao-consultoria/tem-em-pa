import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  REPORT_REASON_LABELS,
  useResolveReport,
  useReviewReports,
  type ReportFilter,
} from "@/features/admin/functions/reports";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function ReportsTab() {
  const [filter, setFilter] = useState<ReportFilter>("pending");
  const { data = [], isLoading } = useReviewReports(filter);
  const resolve = useResolveReport();
  const pg = usePagination(data);

  return (
    <section className="mt-4 space-y-4" aria-labelledby="reports-heading">
      <h2 id="reports-heading" className="sr-only">Denúncias de avaliações</h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Filtro:
        </span>
        {(["pending", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {f === "pending" ? "Pendentes" : f === "resolved" ? "Resolvidas" : "Todas"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Nenhuma denúncia {filter === "pending" ? "pendente" : ""} no momento.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <caption className="sr-only">Lista de denúncias de avaliações.</caption>
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Motivo</th>
                  <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
                  <th scope="col" className="px-4 py-3 font-medium">Avaliação</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pg.paged.map((r: any) => {
                  const review = r.reviews;
                  const company = review?.companies;
                  return (
                    <tr key={r.id} className="border-t border-border transition hover:bg-muted/40 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-rose-500" aria-hidden />
                          <span className="font-medium">
                            {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                          </span>
                        </div>
                        {r.details ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.details}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {company ? (
                          <Link
                            to="/empresa/$id"
                            params={{ id: company.id }}
                            className="font-medium hover:text-primary"
                          >
                            {company.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-sm px-4 py-3">
                        {review ? (
                          <>
                            <p className="text-xs text-muted-foreground">{review.rating}★</p>
                            {review.comment ? (
                              <p className="line-clamp-2 text-sm">{review.comment}</p>
                            ) : (
                              <p className="text-xs italic text-muted-foreground">Sem comentário</p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">Removida</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {r.status === "pending" && review ? (
                            <>
                              <ConfirmDestructive
                                title="Remover esta avaliação?"
                                description="A avaliação será apagada definitivamente e a denúncia marcada como resolvida."
                                onConfirm={() =>
                                  resolve.mutate({ id: r.id, action: "remove_review", reviewId: review.id })
                                }
                                trigger={
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-1 h-3 w-3" /> Remover
                                  </Button>
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  resolve.mutate({ id: r.id, action: "dismiss", reviewId: review.id })
                                }
                              >
                                <X className="mr-1 h-3 w-3" /> Descartar
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            label="denúncias"
          />
        </>
      )}
    </section>
  );
}
