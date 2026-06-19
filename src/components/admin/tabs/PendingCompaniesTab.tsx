import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Empty, Loading } from "../admin-ui";

export function PendingCompaniesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "pending-companies"];
  const [filter, setFilter] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, description, city, status, created_at")
        .in("status", ["pending", "claimed_pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, name: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("companies").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user)
      await logAdminAction(
        user.id,
        status === "approved" ? "company.approve" : "company.reject",
        "company",
        id,
        { name },
      );
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    toast.success(status === "approved" ? "Empresa aprovada" : "Empresa rejeitada");
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma empresa aguardando aprovação.</Empty>;

  const filtered = data.filter(
    (c) =>
      !filter ||
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      (c.city ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="mt-4 space-y-3">
      <Input
        placeholder="Filtrar por nome ou cidade…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
        {filtered.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.status} · {c.city ?? "—"} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
              </p>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/empresa/$id" params={{ id: c.id }} target="_blank">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Ver
                </Link>
              </Button>
              <ConfirmDestructive
                trigger={
                  <Button size="sm" variant="outline">
                    <X className="mr-1 h-4 w-4" />
                    Rejeitar
                  </Button>
                }
                title="Rejeitar empresa?"
                description={
                  <p>
                    A empresa <strong>{c.name}</strong> ficará oculta para todos. Isso pode ser revertido depois mudando o status.
                  </p>
                }
                confirmText="Rejeitar"
                onConfirm={() => decide(c.id, c.name, "rejected")}
              />
              <Button size="sm" onClick={() => decide(c.id, c.name, "approved")}>
                <Check className="mr-1 h-4 w-4" />
                Aprovar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
