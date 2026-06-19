import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Empty, Loading } from "../admin-ui";

export function PendingReviewsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "pending-reviews"];

  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, comment, status, created_at, rating, company_id, companies:company_id(name)")
        .in("status", ["pending_moderation", "flagged"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user)
      await logAdminAction(
        user.id,
        status === "approved" ? "review.approve" : "review.reject",
        "review",
        id,
      );
    toast.success(status === "approved" ? "Comentário aprovado" : "Comentário rejeitado");
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhum comentário em moderação.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {r.companies?.name ?? "Empresa"} · Nota {r.rating} ·{" "}
                {new Date(r.created_at).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-sm">{r.comment ?? "(sem texto)"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <ConfirmDestructive
                trigger={
                  <Button size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                }
                title="Rejeitar comentário?"
                description="O comentário não aparecerá publicamente."
                onConfirm={() => decide(r.id, "rejected")}
              />
              <Button size="sm" onClick={() => decide(r.id, "approved")}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
