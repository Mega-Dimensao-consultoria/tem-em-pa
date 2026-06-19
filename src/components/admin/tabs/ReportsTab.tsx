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
} from "@/lib/admin/reports";
import { Empty, Loading } from "../admin-ui";

export function ReportsTab() {
  const [filter, setFilter] = useState<ReportFilter>("pending");
  const { data = [], isLoading } = useReviewReports(filter);
  const resolve = useResolveReport();

  return (
    <div className="mt-4 space-y-4">
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
        <ul className="space-y-3">
          {data.map((r: any) => {
            const review = r.reviews;
            const company = review?.companies;
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-semibold">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {r.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {r.details ? (
                  <p className="mt-2 rounded-lg bg-muted/40 p-2 text-xs">{r.details}</p>
                ) : null}

                {review ? (
                  <div className="mt-3 rounded-xl border border-border bg-background p-3">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        Avaliação em{" "}
                        {company ? (
                          <Link
                            to="/empresa/$id"
                            params={{ id: company.id }}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {company.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </span>
                      <span>{review.rating}★</span>
                    </div>
                    {review.comment ? (
                      <p className="text-sm">{review.comment}</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">Sem comentário</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs italic text-muted-foreground">Avaliação removida.</p>
                )}

                {r.status === "pending" && review ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConfirmDestructive
                      title="Remover esta avaliação?"
                      description="A avaliação será apagada definitivamente e a denúncia marcada como resolvida."
                      onConfirm={() =>
                        resolve.mutate({ id: r.id, action: "remove_review", reviewId: review.id })
                      }
                      trigger={
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-1 h-3 w-3" /> Remover avaliação
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
                      <X className="mr-1 h-3 w-3" /> Descartar denúncia
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
