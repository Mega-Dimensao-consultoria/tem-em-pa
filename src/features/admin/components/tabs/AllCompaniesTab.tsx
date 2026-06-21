import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ExternalLink, EyeOff, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  useAllCompanies,
  useDecideCompany,
  useDeleteCompany,
  useRepublishCompany,
  useSuspendCompany,
} from "@/features/admin/functions/companies";
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
  const decide = useDecideCompany();
  const suspend = useSuspendCompany();
  const republish = useRepublishCompany();
  const remove = useDeleteCompany();
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
    <section className="mt-4 space-y-4" aria-labelledby="all-companies-heading">
      <h2 id="all-companies-heading" className="sr-only">
        Todas as empresas
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="all-companies-filter">
          Filtrar empresas
        </label>
        <Input
          id="all-companies-filter"
          placeholder="Filtrar por nome, cidade ou ID…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div
          role="radiogroup"
          aria-label="Filtrar por status"
          className="flex flex-wrap gap-1"
        >
          {(["all", "approved", "pending", "claimed_pending", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {filtered.length} de {data.length} empresa{data.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <Empty>Nenhuma empresa encontrada.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Lista de empresas com nome, status, cidade, data de criação e ações.
            </caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Cidade</th>
                <th scope="col" className="px-4 py-3 font-medium">Criada em</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border transition hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        STATUS_STYLE[c.status] ?? "bg-muted"
                      }`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {(c.status === "pending" || c.status === "claimed_pending") && (
                        <>
                          <ConfirmDestructive
                            trigger={
                              <Button size="sm" variant="outline" aria-label={`Rejeitar ${c.name}`}>
                                <X className="mr-1 h-4 w-4" aria-hidden="true" />
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
                            onConfirm={() =>
                              decide.mutate({ id: c.id, name: c.name, status: "rejected" })
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              decide.mutate({ id: c.id, name: c.name, status: "approved" })
                            }
                            aria-label={`Aprovar ${c.name}`}
                          >
                            <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                            Aprovar
                          </Button>
                        </>
                      )}
                      {c.status === "approved" && (
                        <ConfirmDestructive
                          trigger={
                            <Button size="sm" variant="outline" aria-label={`Suspender ${c.name}`}>
                              <EyeOff className="mr-1 h-4 w-4" aria-hidden="true" />
                              Suspender
                            </Button>
                          }
                          title="Suspender empresa?"
                          description={
                            <p>
                              A empresa <strong>{c.name}</strong> deixará de aparecer no diretório público. Você pode republicar a qualquer momento.
                            </p>
                          }
                          confirmText="Suspender"
                          onConfirm={() => suspend.mutate({ id: c.id, name: c.name })}
                        />
                      )}
                      {c.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => republish.mutate({ id: c.id, name: c.name })}
                          aria-label={`Republicar ${c.name}`}
                        >
                          <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
                          Republicar
                        </Button>
                      )}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        aria-label={`Visualizar empresa ${c.name}`}
                      >
                        <Link
                          to="/empresa/$id"
                          params={{ id: c.id }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-1 h-4 w-4" aria-hidden="true" />
                          Visualizar
                        </Link>
                      </Button>
                      <ConfirmDestructive
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            aria-label={`Excluir ${c.name}`}
                          >
                            <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                            Excluir
                          </Button>
                        }
                        title="Excluir empresa permanentemente?"
                        description={
                          <p>
                            Esta ação remove <strong>{c.name}</strong> e todos os dados relacionados (avaliações, reivindicações, produtos). Não pode ser desfeita. Se quiser apenas ocultar do diretório, use <strong>Suspender</strong>.
                          </p>
                        }
                        confirmText="Excluir permanentemente"
                        onConfirm={() => remove.mutate({ id: c.id, name: c.name })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
