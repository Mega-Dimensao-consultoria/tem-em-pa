import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  Loader2, 
  MailCheck, 
  RefreshCw, 
  Search, 
  Trash2, 
  Eye, 
  RotateCcw,
  SendHorizontal
} from "lucide-react";
import {
  adminGetEmailLog,
  adminGetEmailStats,
  adminRetryEmail,
  adminRetryAllDlq,
  adminPurgeEmailDlq,
  adminPurgePendingQueue,
} from "@/features/admin/functions/adminAlerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminPagination,
  DEFAULT_PAGE_SIZE,
} from "@/features/admin/components/AdminPagination";

type Status = "all" | "sent" | "pending" | "failed" | "suppressed";

const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado",
  pending: "Na fila",
  failed: "Falhou",
  suppressed: "Bloqueado",
};

function statusVariant(status: string) {
  if (status === "sent") return "default" as const;
  if (status === "failed") return "destructive" as const;
  return "secondary" as const;
}

/** Histórico de e-mails enviados pela plataforma + gestão de destinatários. */
export function EmailLogTab() {
  const logFn = useServerFn(adminGetEmailLog);
  const statsFn = useServerFn(adminGetEmailStats);
  const retryFn = useServerFn(adminRetryEmail);
  const purgeFn = useServerFn(adminPurgeEmailDlq);
  const purgePendingFn = useServerFn(adminPurgePendingQueue);

  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [status, setStatus] = useState<Status>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const stats = useQuery({
    queryKey: ["admin", "email-stats"],
    queryFn: () => statsFn(),
  });

  const log = useQuery({
    queryKey: ["admin", "email-log", status, search, page, pageSize],
    queryFn: () => logFn({ data: { status, search, page, pageSize } }),
  });

  const total = log.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MailCheck className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-bold">
              Histórico de e-mails
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive/10"
              disabled={isPurging}
              onClick={async () => {
                if (!confirm("Deseja realmente limpar todos os e-mails que falharam (DLQ)?"))
                  return;
                setIsPurging(true);
                try {
                  const result = await purgeFn();
                  toast.success(
                    `DLQ limpa. Removidos: ${Number(result.auth_emails_dlq || 0) + Number(result.transactional_emails_dlq || 0)}`
                  );
                  stats.refetch();
                  log.refetch();
                } catch (err: any) {
                  toast.error(`Erro ao limpar: ${err.message}`);
                } finally {
                  setIsPurging(false);
                }
              }}
            >
              {isPurging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Limpar Falhas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-orange-600 hover:bg-orange-50"
              disabled={isPurging}
              onClick={async () => {
                if (!confirm("Deseja realmente limpar TODOS os e-mails PENDENTES na fila de envio?"))
                  return;
                setIsPurging(true);
                try {
                  const result = await purgePendingFn();
                  toast.success(
                    `Fila pendente limpa. Removidos: ${Number(result.auth_emails || 0) + Number(result.transactional_emails || 0)}`
                  );
                  stats.refetch();
                  log.refetch();
                } catch (err: any) {
                  toast.error(`Erro ao limpar fila: ${err.message}`);
                } finally {
                  setIsPurging(false);
                }
              }}
            >
              {isPurging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Limpar Pendentes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                log.refetch();
                stats.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>

        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as Status);
            setPage(1);
          }}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="sent">Enviados</TabsTrigger>
            <TabsTrigger value="failed">Falhou</TabsTrigger>
            <TabsTrigger value="pending">Na fila</TabsTrigger>
            <TabsTrigger value="suppressed">Bloqueado</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {(["sent", "pending", "failed", "suppressed"] as const).map((s) => (
            <Badge key={s} variant={statusVariant(s)}>
              {STATUS_LABEL[s]}: {stats.data?.[s] ?? 0}
            </Badge>
          ))}
          <span className="text-muted-foreground">(últimos 30 dias)</span>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <div>
              <label
                htmlFor="email-log-search"
                className="text-xs text-muted-foreground"
              >
                Buscar por e-mail ou template
              </label>
              <Input
                id="email-log-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ex.: usuario@gmail.com"
                className="h-9 w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-9 gap-2">
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </form>
        </div>

        {log.isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : total === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Nenhum envio encontrado com esses filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-2 py-2">Data</th>
                  <th className="px-2 py-2">Destinatário</th>
                  <th className="px-2 py-2">Template</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Erro</th>
                  <th className="px-2 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(log.data?.rows ?? []).map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-2">{r.recipient_email}</td>
                    <td className="px-2 py-2">{r.template_name}</td>
                    <td className="px-2 py-2">
                      <Badge variant={statusVariant(r.status)}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="max-w-[280px] truncate px-2 py-2 text-xs text-muted-foreground">
                      {r.error_message ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-right flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Ver detalhes"
                        onClick={() => setSelectedEmail(r)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(r.status === "failed" || r.status === "pending") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          disabled={isRetrying === r.id}
                          title="Reenviar fila de erros"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsRetrying(r.id);
                            try {
                              const result = await retryFn({ data: { id: r.id } });
                              const resData = result.result as any;
                              const totalRetried = Number(resData?.auth_emails_retried || 0) + 
                                                 Number(resData?.transactional_emails_retried || 0);
                              
                              if (totalRetried > 0) {
                                toast.success(`${totalRetried} e-mails movidos para a fila de envio.`);
                              } else {
                                toast.info("Nenhum e-mail pendente nas filas de erro para reenvio.");
                              }
                              log.refetch();
                              stats.refetch();
                            } catch (err: any) {
                              toast.error(`Erro ao reenviar: ${err.message}`);
                            } finally {
                              setIsRetrying(null);
                            }
                          }}
                        >
                          {isRetrying === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          firstItem={firstItem}
          lastItem={lastItem}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          label="envios"
        />
      </div>

      <Dialog
        open={!!selectedEmail}
        onOpenChange={(open) => !open && setSelectedEmail(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Envio</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">ID da Mensagem</p>
                  <p className="font-mono break-all">{selectedEmail.message_id || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Data</p>
                  <p>{new Date(selectedEmail.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Destinatário</p>
                  <p>{selectedEmail.recipient_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Template</p>
                  <Badge variant="outline">{selectedEmail.template_name}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Status</p>
                  <Badge variant={statusVariant(selectedEmail.status)}>
                    {STATUS_LABEL[selectedEmail.status] ?? selectedEmail.status}
                  </Badge>
                </div>
              </div>

              {selectedEmail.error_message ? (
                <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                  <p className="text-xs text-destructive uppercase font-bold mb-1">Log de Erro</p>
                  <p className="text-destructive whitespace-pre-wrap font-mono text-xs">
                    {selectedEmail.error_message}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
                  <p className="text-xs text-green-600 uppercase font-bold">Status de Sucesso</p>
                  <p className="text-green-600">E-mail processado sem erros registrados.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
