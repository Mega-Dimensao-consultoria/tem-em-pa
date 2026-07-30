import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BellRing, Loader2, Save, Trash2 } from "lucide-react";
import {
  adminGetAlertRecipients,
  adminSetAlertExtras,
  adminPurgeEmailDlq,
} from "@/features/admin/functions/adminAlerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toastError } from "@/lib/safe";

export function AdminAlertsCard() {
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetAlertRecipients);
  const setFn = useServerFn(adminSetAlertExtras);
  const purgeFn = useServerFn(adminPurgeEmailDlq);
  const [extras, setExtras] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "alert-recipients"],
    queryFn: () => getFn(),
  });

  useEffect(() => {
    if (data?.extras !== undefined) setExtras(data.extras);
  }, [data?.extras]);

  const save = useMutation({
    mutationFn: () => setFn({ data: { extras } }),
    onSuccess: () => {
      toast.success("Destinatários atualizados");
      qc.invalidateQueries({ queryKey: ["admin", "alert-recipients"] });
    },
    onError: (e) => toastError(e, "Falha ao salvar destinatários"),
  });

  const purge = useMutation({
    mutationFn: () => purgeFn(),
    onSuccess: (r: any) => {
      const total =
        Number(r?.auth_emails_dlq ?? 0) + Number(r?.transactional_emails_dlq ?? 0);
      toast.success(`Fila limpa (${total} e-mail(s) descartado(s))`);
    },
    onError: (e) => toastError(e, "Falha ao limpar a fila"),
  });

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-bold">Avisos para administradores</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Todo administrador da plataforma recebe automaticamente, no e-mail de cadastro,
        os avisos de novas mensagens de contato, reivindicações, pedidos de remoção,
        denúncias, avaliações em moderação e empresas aguardando aprovação.
      </p>

      <div className="mb-4">
        <Label className="text-xs uppercase text-muted-foreground">
          Recebendo hoje
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            (data?.recipients ?? []).map((r: string) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-extras">E-mails extras (opcional, separados por vírgula)</Label>
        <Input
          id="admin-extras"
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          placeholder="suporte@temnaminhacidade.com.br, financeiro@..."
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar destinatários
        </Button>
        <Button
          variant="outline"
          onClick={() => purge.mutate()}
          disabled={purge.isPending}
          className="gap-2"
        >
          {purge.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Limpar e-mails travados na fila
        </Button>
      </div>
    </div>
  );
}
