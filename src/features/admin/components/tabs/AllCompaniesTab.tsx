import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllCompanies } from "@/features/admin/functions/companies";
import { Empty, Loading } from "../admin-ui";

const STATUS_LABEL: Record<string, string> = {
  approved: "Aprovada",
  pending: "Pendente",
  claimed_pending: "Reivindicação",
  rejected: "Rejeitada",
};
const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  claimed_pending: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  rejected: "bg-destructive/15 text-destructive",
};

export function AllCompaniesTab() {
  const { data = [], isLoading } = useAllCompanies();
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string>("all");

  if (isLoading) return <Loading />;

  const filtered = data.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.city ?? "").toLowerCase().includes(q) ||
      c.id.includes(filter)
    );
  });

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filtrar por nome, cidade ou ID…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", "approved", "pending", "claimed_pending", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {data.length} empresa(s)
      </p>

      {filtered.length === 0 ? (
        <Empty>Nenhuma empresa encontrada.</Empty>
      ) : (
        <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
          {filtered.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-semibold">
                  {c.name}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      STATUS_STYLE[c.status] ?? "bg-muted"
                    }`}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.city ?? "—"} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </p>
                {c.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                ) : null}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/empresa/$id" params={{ id: c.id }} target="_blank">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Ver
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
