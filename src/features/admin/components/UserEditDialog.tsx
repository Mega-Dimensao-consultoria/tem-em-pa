import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Loader2, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  adminGetUserDetails,
  adminUpdateUserProfile,
  adminSendPasswordReset,
  adminDeleteUserAccount,
} from "@/lib/admin-users.functions";
import { adminKeys } from "@/features/admin/functions/keys";

type Props = {
  userId: string | null;
  onClose: () => void;
};

export function UserEditDialog({ userId, onClose }: Props) {
  const open = Boolean(userId);
  const qc = useQueryClient();
  const getDetails = useServerFn(adminGetUserDetails);
  const updateProfile = useServerFn(adminUpdateUserProfile);
  const sendReset = useServerFn(adminSendPasswordReset);
  const deleteAcct = useServerFn(adminDeleteUserAccount);

  const detailsQ = useQuery({
    queryKey: ["admin", "user-details", userId],
    queryFn: () => getDetails({ data: { userId: userId! } }),
    enabled: open,
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (detailsQ.data?.profile) {
      setFullName(detailsQ.data.profile.full_name ?? "");
      setPhone(detailsQ.data.profile.phone ?? "");
      setAvatarUrl(detailsQ.data.profile.avatar_url ?? "");
    }
  }, [detailsQ.data]);

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        data: {
          userId: userId!,
          full_name: fullName,
          phone,
          avatar_url: avatarUrl,
        },
      }),
    onSuccess: () => {
      toast.success("Dados atualizados");
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      qc.invalidateQueries({ queryKey: ["admin", "user-details", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => sendReset({ data: { userId: userId! } }),
    onSuccess: (r) => toast.success(`Link de redefinição gerado para ${r.email}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteAcct({ data: { userId: userId! } }),
    onSuccess: () => {
      toast.success("Conta excluída");
      qc.invalidateQueries({ queryKey: adminKeys.users() });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações do usuário como administrador.
          </DialogDescription>
        </DialogHeader>

        {detailsQ.isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : detailsQ.error ? (
          <p className="py-6 text-sm text-destructive">
            {(detailsQ.error as Error).message}
          </p>
        ) : detailsQ.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <Info label="ID" value={userId!.slice(0, 8) + "…"} />
              <Info label="E-mail" value={detailsQ.data.email ?? "—"} />
              <Info
                label="Provedor"
                value={detailsQ.data.provider ?? "—"}
              />
              <Info
                label="E-mail confirmado"
                value={detailsQ.data.email_confirmed_at ? "Sim" : "Não"}
              />
              <Info
                label="Criado em"
                value={
                  detailsQ.data.created_at
                    ? new Date(detailsQ.data.created_at).toLocaleString("pt-BR")
                    : "—"
                }
              />
              <Info
                label="Último login"
                value={
                  detailsQ.data.last_sign_in_at
                    ? new Date(detailsQ.data.last_sign_in_at).toLocaleString("pt-BR")
                    : "—"
                }
              />
              <Info
                label="Papéis"
                value={detailsQ.data.roles.join(", ") || "—"}
              />
              <Info
                label="Banido"
                value={detailsQ.data.profile?.is_banned ? "Sim" : "Não"}
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="adm-name">Nome completo</Label>
                <Input
                  id="adm-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adm-phone">Telefone</Label>
                <Input
                  id="adm-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adm-avatar">URL do avatar</Label>
                <Input
                  id="adm-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reset.mutate()}
                disabled={reset.isPending}
              >
                <KeyRound className="mr-1 h-3 w-3" />
                {reset.isPending ? "Gerando…" : "Redefinir senha"}
              </Button>
              <ConfirmDestructive
                trigger={
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir conta
                  </Button>
                }
                title="Excluir esta conta?"
                description={
                  <p>
                    A conta de <strong>{fullName || detailsQ.data.email || userId}</strong> será
                    excluída permanentemente. Dados relacionados (favoritos, avaliações etc.)
                    também serão removidos pelas regras de cascade.
                  </p>
                }
                requirePhrase="EXCLUIR CONTA"
                confirmText="Excluir definitivamente"
                onConfirm={() => remove.mutateAsync()}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !detailsQ.data}>
            <Save className="mr-1 h-3 w-3" />
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-sm">{value}</p>
    </div>
  );
}
