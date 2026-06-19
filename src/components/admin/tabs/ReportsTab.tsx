import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Empty, Loading } from "../admin-ui";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam / propaganda",
  offensive: "Linguagem ofensiva",
  fake: "Avaliação falsa",
  personal_info: "Dados pessoais",
  other: "Outro motivo",
};

type ReportFilter = "pending" | "resolved" | "all";

export function ReportsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReportFilter>("pending");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-review-reports", filter],
    queryFn: async () => {
      let q = supabase
        .from("review_reports")
        .select(
          "id, review_id, reporter_id, reason, details, status, created_at, resolved_at, reviews:review_id(id, rating, comment, status, company_id, companies:company_id(id, name))",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function resolve(
    id: string,
    action: "dismiss" | "remove_review",
    reviewId: string,
  ) {
    if (!user) return;
    if (action === "remove_review") {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) {
        toast.error(error.message);
        return;
      }
      await logAdminAction(user.id, "review.removed_from_report", "reviews", reviewId);
    }
    const { error } = await supabase
      .from("review_reports")
      .update({
        status: action === "remove_review" ? "removed" : "dismissed",
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(user.id, `report.${action}`, "review_reports", id);
    toast.success(
      action === "remove_review"
        ? "Avaliação removida e denúncia resolvida."
        : "Denúncia descartada.",
    );
    qc.invalidateQueries({ queryKey: ["admin-review-reports"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  }

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
                      {REASON_LABELS[r.reason] ?? r.reason}
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
                      onConfirm={() => resolve(r.id, "remove_review", review.id)}
                      trigger={
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-1 h-3 w-3" /> Remover avaliação
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolve(r.id, "dismiss", review.id)}
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
