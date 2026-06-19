import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Empty, Loading } from "../admin-ui";

export function PendingClaimsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "pending-claims"];

  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_claims")
        .select(
          "id, company_id, user_id, status, created_at, message, document_urls, companies:company_id(name)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(claim: (typeof data)[number], status: "approved" | "rejected") {
    const { error } = await supabase
      .from("company_claims")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", claim.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (status === "approved") {
      const { error: e2 } = await supabase
        .from("companies")
        .update({ owner_id: claim.user_id, status: "approved" })
        .eq("id", claim.company_id);
      if (e2) toast.error("Claim aprovada, mas falhou ao atribuir dono: " + e2.message);
    }
    if (user)
      await logAdminAction(
        user.id,
        status === "approved" ? "claim.approve" : "claim.reject",
        "claim",
        claim.id,
        { company_id: claim.company_id, user_id: claim.user_id },
      );
    toast.success(status === "approved" ? "Reivindicação aprovada" : "Reivindicação rejeitada");
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma reivindicação pendente.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((c) => (
        <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.companies?.name ?? `Empresa ${c.company_id.slice(0, 8)}`}</p>
              <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
              {c.message ? <p className="mt-2 text-sm">{c.message}</p> : null}
              {Array.isArray(c.document_urls) && c.document_urls.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.document_urls.length} documento(s) anexado(s)
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <ConfirmDestructive
                trigger={
                  <Button size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                }
                title="Rejeitar reivindicação?"
                description="O usuário não receberá a posse desta empresa."
                onConfirm={() => decide(c, "rejected")}
              />
              <Button size="sm" onClick={() => decide(c, "approved")}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
