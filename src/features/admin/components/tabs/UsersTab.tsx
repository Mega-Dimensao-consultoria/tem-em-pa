import { useState } from "react";
import { Pencil, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  useAdminUsers,
  useDemoteAdmin,
  usePromoteAdmin,
  useToggleBan,
} from "@/features/admin/functions/users";
import { Empty, Loading } from "../admin-ui";
import { UserEditDialog } from "../UserEditDialog";

export function UsersTab() {
  const { data = [], isLoading } = useAdminUsers();
  const toggleBan = useToggleBan();
  const promote = usePromoteAdmin();
  const demote = useDemoteAdmin();
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = data.filter(
    (u) =>
      !filter ||
      (u.full_name ?? "").toLowerCase().includes(filter.toLowerCase()) ||
      u.id.includes(filter),
  );

  return (
    <section className="mt-4 space-y-4" aria-labelledby="users-heading">
      <h2 id="users-heading" className="sr-only">
        Usuários
      </h2>

      <label className="sr-only" htmlFor="users-filter">
        Filtrar usuários
      </label>
      <Input
        id="users-filter"
        placeholder="Filtrar por nome ou ID…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>Nenhum usuário encontrado.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Lista de usuários com nome, papéis, status e ações administrativas.
            </caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Usuário</th>
                <th scope="col" className="px-4 py-3 font-medium">Papéis</th>
                <th scope="col" className="px-4 py-3 font-medium">Criado em</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const displayName = u.full_name ?? "(sem nome)";
                return (
                  <tr key={u.id} className="border-t border-border transition hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {u.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
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
                        {!u.is_admin && !u.is_banned ? (
                          <span className="text-xs text-muted-foreground">Usuário</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(u.id)}
                          aria-label={`Editar usuário ${displayName}`}
                        >
                          <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                          Editar
                        </Button>
                        {u.is_admin ? (
                          <ConfirmDestructive
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                aria-label={`Remover admin de ${displayName}`}
                              >
                                <ShieldOff className="mr-1 h-4 w-4" aria-hidden="true" />
                                Remover admin
                              </Button>
                            }
                            title="Remover acesso de administrador?"
                            description={
                              <p>
                                O usuário <strong>{displayName}</strong> deixará de ter acesso ao painel administrativo.
                              </p>
                            }
                            requirePhrase="REMOVER ADMIN"
                            confirmText="Remover acesso admin"
                            onConfirm={() => demote.mutate({ id: u.id, name: u.full_name })}
                          />
                        ) : (
                          <ConfirmDestructive
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                aria-label={`Promover ${displayName} a admin`}
                              >
                                <Shield className="mr-1 h-4 w-4" aria-hidden="true" />
                                Promover a admin
                              </Button>
                            }
                            title="Promover a administrador?"
                            description={
                              <>
                                <p>
                                  O usuário <strong>{displayName}</strong> terá acesso total ao painel administrativo, incluindo aprovar empresas, moderar conteúdo, gerenciar usuários e outros admins.
                                </p>
                                <p className="text-destructive">
                                  Esta é uma ação sensível. Tenha certeza de que confia neste usuário.
                                </p>
                              </>
                            }
                            requirePhrase="PROMOVER ADMIN"
                            confirmText="Promover a admin"
                            onConfirm={() => promote.mutate({ id: u.id, name: u.full_name })}
                          />
                        )}
                        <ConfirmDestructive
                          trigger={
                            <Button
                              size="sm"
                              variant={u.is_banned ? "outline" : "destructive"}
                              aria-label={`${u.is_banned ? "Desbanir" : "Banir"} ${displayName}`}
                            >
                              {u.is_banned ? "Desbanir" : "Banir"}
                            </Button>
                          }
                          title={u.is_banned ? "Remover banimento?" : "Banir usuário?"}
                          description={
                            u.is_banned ? (
                              <p>O usuário voltará a poder usar a plataforma normalmente.</p>
                            ) : (
                              <p>
                                O usuário <strong>{displayName}</strong> será marcado como banido. Considere também rejeitar suas empresas e comentários.
                              </p>
                            )
                          }
                          requirePhrase={u.is_banned ? undefined : "BANIR"}
                          confirmText={u.is_banned ? "Desbanir" : "Banir"}
                          onConfirm={() =>
                            toggleBan.mutate({ id: u.id, banned: u.is_banned, name: u.full_name })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <UserEditDialog userId={editingId} onClose={() => setEditingId(null)} />
    </section>
  );
}
