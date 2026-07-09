import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { usePendingCompanies, useDecideCompany } from "@/features/admin/functions/companies";
import { CityFilterSelect } from "./CityFilterSelect";
import { Empty, Loading } from "../admin-ui";

export function PendingCompaniesTab() {
  const { data = [], isLoading } = usePendingCompanies();
  const decide = useDecideCompany();
  const [filter, setFilter] = useState("");
  const [cityId, setCityId] = useState<string>("all");

  const filtered = useMemo(
    () =>
      data.filter((c) => {
        if (cityId !== "all" && c.city_id !== cityId) return false;
        if (!filter) return true;
        const q = filter.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q);
      }),
    [data, filter, cityId],
  );

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma empresa aguardando aprovação.</Empty>;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filtrar por nome ou cidade…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <CityFilterSelect value={cityId} onChange={setCityId} />
      </div>
      <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
        {filtered.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.status} · {c.city ?? "—"} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
              </p>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/empresa/$id" params={{ id: c.id }} target="_blank">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Ver
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/owner/empresa/$id/editar" params={{ id: c.id }}>
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Link>
              </Button>
              <ConfirmDestructive
                trigger={
                  <Button size="sm" variant="outline">
                    <X className="mr-1 h-4 w-4" />
                    Rejeitar
                  </Button>
                }
                title="Rejeitar empresa?"
                description={
                  <p>
                    A empresa <strong>{c.name}</strong> ficará oculta para todos. Isso pode ser revertido depois mudando o status.
                  </p>
                }
                confirmText="Rejeitar"
                onConfirm={() => decide.mutate({ id: c.id, name: c.name, status: "rejected" })}
              />
              <Button
                size="sm"
                onClick={() => decide.mutate({ id: c.id, name: c.name, status: "approved" })}
              >
                <Check className="mr-1 h-4 w-4" />
                Aprovar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
