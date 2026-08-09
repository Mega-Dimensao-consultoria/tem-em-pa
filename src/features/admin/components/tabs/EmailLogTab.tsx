import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MailCheck, RefreshCw, Search, SendHorizontal } from "lucide-react";
import {
  adminGetEmailLog,
  adminGetEmailStats,
  adminRetryEmail,
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

  const [isRetrying, setIsRetrying] = useState<string | null>(null);
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

          <div>
            <label className="block text-xs text-muted-foreground">Status</label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as Status);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-40" aria-label="Filtrar status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="pending">Na fila</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="suppressed">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    <td className="px-2 py-2 text-right">
                      {(r.status === "failed" || r.status === "pending") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          disabled={isRetrying === r.id}
                          title="Reenviar e-mail"
                          onClick={async () => {
                            setIsRetrying(r.id);
                            try {
                              await retryFn({ data: { id: r.id } });
                              toast.success("Comando de reenvio enviado com sucesso");
                              log.refetch();
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
                            <SendHorizontal className="h-4 w-4" />
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
    </div>
  );
}
