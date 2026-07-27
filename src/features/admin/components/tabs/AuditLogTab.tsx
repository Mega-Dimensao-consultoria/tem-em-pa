import { History } from "lucide-react";
import { useAuditLog } from "@/features/admin/functions/audit";
import { Empty, Loading } from "../admin-ui";
import { AdminPagination, usePagination } from "../AdminPagination";

export function AuditLogTab() {
  const { data = [], isLoading } = useAuditLog(500);
  const pg = usePagination(data);

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma ação registrada ainda.</Empty>;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="audit-heading">
      <h2 id="audit-heading" className="sr-only">Auditoria administrativa</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <History className="h-3 w-3" /> {data.length} ações registradas
        </div>
        <table className="w-full text-sm">
          <caption className="sr-only">Histórico de ações administrativas.</caption>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Data</th>
              <th scope="col" className="px-4 py-3 font-medium">Ação</th>
              <th scope="col" className="px-4 py-3 font-medium">Entidade</th>
              <th scope="col" className="px-4 py-3 font-medium">Autor</th>
              <th scope="col" className="px-4 py-3 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {pg.paged.map((row) => (
              <tr key={row.id} className="border-t border-border transition hover:bg-muted/40 align-top">
                <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                  {new Date(row.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-muted px-1 font-mono text-xs">{row.action}</code>
                </td>
                <td className="px-4 py-3 text-xs">
                  {row.entity_type}
                  {row.entity_id ? (
                    <span className="ml-1 text-muted-foreground">
                      {row.entity_id.toString().slice(0, 8)}…
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                  {row.actor_id.slice(0, 8)}…
                </td>
                <td className="max-w-md px-4 py-3">
                  {row.details ? (
                    <pre className="max-w-full overflow-x-auto rounded bg-muted/50 p-2 text-[11px]">
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
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
        label="ações"
      />
    </section>
  );
}
