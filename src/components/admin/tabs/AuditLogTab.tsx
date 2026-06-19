import { History } from "lucide-react";
import { useAuditLog } from "@/lib/admin/audit";
import { Empty, Loading } from "../admin-ui";

export function AuditLogTab() {
  const { data = [], isLoading } = useAuditLog(200);

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma ação registrada ainda.</Empty>;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <History className="h-3 w-3" /> Últimas {data.length} ações
      </div>
      <ul className="divide-y">
        {data.map((row) => (
          <li key={row.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[160px_1fr]">
            <span className="text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleString("pt-BR")}
            </span>
            <div className="min-w-0">
              <p>
                <code className="rounded bg-muted px-1 font-mono text-xs">{row.action}</code> ·{" "}
                {row.entity_type}
                {row.entity_id ? ` ${row.entity_id.toString().slice(0, 8)}…` : ""}
              </p>
              <p className="text-xs text-muted-foreground">por {row.actor_id.slice(0, 8)}…</p>
              {row.details ? (
                <pre className="mt-1 max-w-full overflow-x-auto rounded bg-muted/50 p-2 text-[11px]">
                  {JSON.stringify(row.details, null, 2)}
                </pre>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
