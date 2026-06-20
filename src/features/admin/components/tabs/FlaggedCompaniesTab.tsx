import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, Flag, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlaggedCompanies } from "@/features/admin/functions/companies";
import { Empty, Loading } from "../admin-ui";

export function FlaggedCompaniesTab() {
  const { data = [], isLoading } = useFlaggedCompanies();

  if (isLoading) return <Loading />;
  if (data.length === 0)
    return <Empty>Nenhuma empresa com reivindicação ou denúncia em aberto.</Empty>;

  return (
    <div className="mt-4 space-y-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5" />
        Empresas com reivindicações pendentes ou avaliações denunciadas em aberto.
      </p>
      <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
        {data.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.city ?? "—"} · status: {c.status}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.pending_claims > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    <ShieldQuestion className="h-3 w-3" />
                    {c.pending_claims} reivindicação(ões)
                  </span>
                ) : null}
                {c.pending_reports > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                    <Flag className="h-3 w-3" />
                    {c.pending_reports} denúncia(s) de avaliação
                  </span>
                ) : null}
              </div>
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
      <p className="text-xs text-muted-foreground">
        Para resolver, use as abas <strong>Reivindicações</strong> e <strong>Denúncias</strong>.
      </p>
    </div>
  );
}
