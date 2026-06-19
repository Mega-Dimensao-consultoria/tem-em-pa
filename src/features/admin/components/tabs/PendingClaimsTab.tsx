import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { usePendingClaims, useDecideClaim } from "@/features/admin/functions/claims";
import { Empty, Loading } from "../admin-ui";

export function PendingClaimsTab() {
  const { data = [], isLoading } = usePendingClaims();
  const decide = useDecideClaim();

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma reivindicação pendente.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((c) => (
        <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {c.companies?.name ?? `Empresa ${c.company_id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleString("pt-BR")}
              </p>
              {c.message ? <p className="mt-2 text-sm">{c.message}</p> : null}
              {Array.isArray(c.document_urls) && c.document_urls.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.document_urls.length} documento(s) anexado(s)
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <ConfirmDestructive
                trigger={
                  <Button size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                }
                title="Rejeitar reivindicação?"
                description="O usuário não receberá a posse desta empresa."
                onConfirm={() => decide.mutate({ claim: c, status: "rejected" })}
              />
              <Button size="sm" onClick={() => decide.mutate({ claim: c, status: "approved" })}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
