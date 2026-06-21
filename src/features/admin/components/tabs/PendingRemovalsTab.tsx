import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  usePendingRemovals,
  useDecideRemoval,
  REMOVAL_REASON_LABEL,
} from "@/features/admin/functions/removals";
import { Empty, Loading } from "../admin-ui";

export function PendingRemovalsTab() {
  const { data = [], isLoading } = usePendingRemovals();
  const decide = useDecideRemoval();

  if (isLoading) return <Loading />;
  if (data.length === 0)
    return <Empty>Nenhuma solicitação de remoção pendente.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {r.companies?.name ?? `Empresa ${r.company_id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("pt-BR")} ·{" "}
                <span className="font-medium">
                  {REMOVAL_REASON_LABEL[r.reason]}
                </span>
              </p>
              {r.details ? (
                <p className="mt-2 whitespace-pre-wrap text-sm">{r.details}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <ConfirmDestructive
                trigger={
                  <Button size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                }
                title="Rejeitar solicitação?"
                description="A empresa continuará visível no diretório."
                onConfirm={() =>
                  decide.mutate({ removal: r, status: "rejected" })
                }
              />
              <ConfirmDestructive
                trigger={
                  <Button size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                }
                title="Aprovar e remover empresa?"
                description="A empresa será ocultada do diretório público imediatamente."
                onConfirm={() =>
                  decide.mutate({ removal: r, status: "approved" })
                }
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
