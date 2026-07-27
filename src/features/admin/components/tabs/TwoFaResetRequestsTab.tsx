import { toastError } from "@/lib/safe";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

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
        .limit(500);
      if (error) throw error;
      return data as ResetRequest[];
    },
  });
  const pg = usePagination(data);

  async function setStatus(id: string, status: "resolved" | "rejected") {
    const { error } = await supabase
      .from("two_fa_reset_requests")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toastError(error);
      return;
    }
    toast.success("Pedido atualizado.");
    qc.invalidateQueries({ queryKey: ["admin", "two-fa-reset-requests"] });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhum pedido de reset 2FA.</Empty>;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="reset-2fa-heading">
      <h2 id="reset-2fa-heading" className="sr-only">Pedidos de reset 2FA</h2>
      <p className="text-xs text-muted-foreground">
        Para resolver, confirme a identidade da pessoa e use o botão{" "}
        <strong>Remover 2FA</strong> na aba <strong>Usuários</strong> (procure pelo ID
        do usuário). Depois marque o pedido como resolvido aqui.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <caption className="sr-only">Pedidos de reset de autenticação em duas etapas.</caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Solicitante</th>
              <th scope="col" className="px-4 py-3 font-medium">Mensagem</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Enviado em</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pg.paged.map((r) => (
              <tr key={r.id} className="border-t border-border transition hover:bg-muted/40 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.contact_email}</p>
                  {r.user_id ? (
                    <p className="text-[11px] font-mono text-muted-foreground">{r.user_id.slice(0, 8)}…</p>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">Não logado</p>
                  )}
                </td>
                <td className="max-w-md px-4 py-3">
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm">{r.message}</p>
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  {r.status === "pending" ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" onClick={() => setStatus(r.id, "resolved")}>Resolver</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
                        Rejeitar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-right text-xs text-muted-foreground">—</p>
                  )}
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
        label="pedidos"
      />
    </section>
  );
}
