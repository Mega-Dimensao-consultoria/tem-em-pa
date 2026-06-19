import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Empty, Loading } from "../admin-ui";

export function UsersTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "users"];

  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_banned, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      const adminSet = new Set(
        (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );
      return profiles.map((p) => ({ ...p, is_admin: adminSet.has(p.id) }));
    },
  });
  const [filter, setFilter] = useState("");
  const filtered = data.filter(
    (u) =>
      !filter ||
      (u.full_name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      u.id.includes(filter),
  );

  async function toggleBan(id: string, banned: boolean, name: string | null) {
    const { error } = await supabase.from("profiles").update({ is_banned: !banned }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user)
      await logAdminAction(user.id, banned ? "user.unban" : "user.ban", "user", id, { name });
    toast.success(!banned ? "Usuário banido" : "Banimento removido");
    qc.invalidateQueries({ queryKey: key });
  }

  async function promote(id: string, name: string | null) {
    const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    if (user) await logAdminAction(user.id, "user.promote_admin", "user", id, { name });
    toast.success("Usuário promovido a administrador");
    qc.invalidateQueries({ queryKey: key });
  }

  async function demote(id: string, name: string | null) {
    if (user && id === user.id) {
      toast.error("Você não pode remover o seu próprio acesso admin.");
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id)
      .eq("role", "admin");
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(user!.id, "user.demote_admin", "user", id, { name });
    toast.success("Acesso admin removido");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="mt-4 space-y-3">
      <Input
        placeholder="Filtrar por nome ou ID…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>Nenhum usuário encontrado.</Empty>
      ) : (
        <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
          {filtered.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-semibold">
                  {u.full_name ?? "(sem nome)"}
                  {u.is_admin ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      Admin
                    </span>
                  ) : null}
                  {u.is_banned ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      Banido
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.id.slice(0, 8)}… · {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.is_admin ? (
                  <ConfirmDestructive
                    trigger={
                      <Button size="sm" variant="outline">
                        <ShieldOff className="mr-1 h-3 w-3" />
                        Remover admin
                      </Button>
                    }
                    title="Remover acesso de administrador?"
                    description={
                      <p>
                        O usuário <strong>{u.full_name ?? u.id.slice(0, 8)}</strong> deixará de ter acesso ao painel administrativo.
                      </p>
                    }
                    requirePhrase="REMOVER ADMIN"
                    confirmText="Remover acesso admin"
                    onConfirm={() => demote(u.id, u.full_name)}
                  />
                ) : (
                  <ConfirmDestructive
                    trigger={
                      <Button size="sm" variant="outline">
                        <Shield className="mr-1 h-3 w-3" />
                        Promover a admin
                      </Button>
                    }
                    title="Promover a administrador?"
                    description={
                      <>
                        <p>
                          O usuário <strong>{u.full_name ?? u.id.slice(0, 8)}</strong> terá acesso total ao painel administrativo, incluindo aprovar empresas, moderar conteúdo, gerenciar usuários e outros admins.
                        </p>
                        <p className="text-destructive">
                          Esta é uma ação sensível. Tenha certeza de que confia neste usuário.
                        </p>
                      </>
                    }
                    requirePhrase="PROMOVER ADMIN"
                    confirmText="Promover a admin"
                    onConfirm={() => promote(u.id, u.full_name)}
                  />
                )}
                <ConfirmDestructive
                  trigger={
                    <Button size="sm" variant={u.is_banned ? "outline" : "destructive"}>
                      {u.is_banned ? "Desbanir" : "Banir"}
                    </Button>
                  }
                  title={u.is_banned ? "Remover banimento?" : "Banir usuário?"}
                  description={
                    u.is_banned ? (
                      <p>O usuário voltará a poder usar a plataforma normalmente.</p>
                    ) : (
                      <p>
                        O usuário <strong>{u.full_name ?? u.id.slice(0, 8)}</strong> será marcado como banido. Considere também rejeitar suas empresas e comentários.
                      </p>
                    )
                  }
                  requirePhrase={u.is_banned ? undefined : "BANIR"}
                  confirmText={u.is_banned ? "Desbanir" : "Banir"}
                  onConfirm={() => toggleBan(u.id, u.is_banned, u.full_name)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
