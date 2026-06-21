import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, Loading } from "../admin-ui";

type ResetRequest = {
  id: string;
  user_id: string | null;
  contact_email: string;
  full_name: string;
  message: string;
  status: string;
  created_at: string;
};

export function TwoFaResetRequestsTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "two-fa-reset-requests"],
    queryFn: async (): Promise<ResetRequest[]> => {
      const { data, error } = await supabase
        .from("two_fa_reset_requests")
        .select("id, user_id, contact_email, full_name, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ResetRequest[];
    },
  });

  async function setStatus(id: string, status: "resolved" | "rejected") {
    const { error } = await supabase
      .from("two_fa_reset_requests")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pedido atualizado.");
    qc.invalidateQueries({ queryKey: ["admin", "two-fa-reset-requests"] });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhum pedido de reset 2FA.</Empty>;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="reset-2fa-heading">
      <h2 id="reset-2fa-heading" className="sr-only">
        Pedidos de reset 2FA
      </h2>
      <p className="text-xs text-muted-foreground">
        Para resolver, confirme a identidade da pessoa e use o botão{" "}
        <strong>Remover 2FA</strong> na aba <strong>Usuários</strong> (procure pelo ID
        do usuário). Depois marque o pedido como resolvido aqui.
      </p>
      {data.map((r) => (
        <article
          key={r.id}
          className="rounded-2xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{r.full_name}</p>
              <p className="text-xs text-muted-foreground">{r.contact_email}</p>
              {r.user_id ? (
                <p className="text-xs font-mono text-muted-foreground">
                  ID: {r.user_id}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  Não estava logado ao enviar.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  r.status === "pending"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : r.status === "resolved"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/15 text-destructive"
                }`}
              >
                {r.status}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {new Date(r.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
            {r.message}
          </p>
          {r.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setStatus(r.id, "resolved")}>
                Marcar como resolvido
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus(r.id, "rejected")}
              >
                Rejeitar
              </Button>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
