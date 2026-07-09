import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, CheckSquare, ExternalLink, EyeOff, Pencil, Plus, RotateCcw, Square, Trash2, X } from "lucide-react";
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
import { useBulkCompanyAction, type BulkAction } from "@/features/admin/functions/bulk";
import { CityFilterSelect } from "./CityFilterSelect";
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

const BULK_LABEL: Record<BulkAction, string> = {
  approve: "Aprovar selecionadas",
  suspend: "Suspender selecionadas",
  republish: "Republicar selecionadas",
  delete: "Excluir selecionadas",
};

export function AllCompaniesTab() {
  const { data = [], isLoading } = useAllCompanies();
  const decide = useDecideCompany();
  const suspend = useSuspendCompany();
  const republish = useRepublishCompany();
  const remove = useDeleteCompany();
  const bulk = useBulkCompanyAction();
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [cityId, setCityId] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return data.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (cityId !== "all" && c.city_id !== cityId) return false;
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        c.id.includes(filter)
      );
    });
  }, [data, filter, status, cityId]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedItems = filtered.filter((c) => selected.has(c.id));

  const runBulk = (action: BulkAction) => {
    bulk.mutate(
      { action, items: selectedItems.map((c) => ({ id: c.id, name: c.name })) },
      { onSuccess: () => setSelected(new Set()) },
    );
  };

  if (isLoading) return <Loading />;

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
        <div role="radiogroup" aria-label="Filtrar por status" className="flex flex-wrap gap-1">
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
        <CityFilterSelect value={cityId} onChange={setCityId} />
        <Button asChild size="sm" className="ml-auto">
          <Link to="/cadastrar-empresa">
            <Plus className="mr-1 h-4 w-4" /> Cadastrar empresa
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} de {data.length} empresa{data.length === 1 ? "" : "s"} ·{" "}
          <strong>{selected.size}</strong> selecionada(s)
        </p>
        {selected.size > 0 && (
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => runBulk("approve")} disabled={bulk.isPending}>
              <Check className="mr-1 h-3 w-3" /> {BULK_LABEL.approve}
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBulk("suspend")} disabled={bulk.isPending}>
              <EyeOff className="mr-1 h-3 w-3" /> {BULK_LABEL.suspend}
            </Button>
            <Button size="sm" variant="outline" onClick={() => runBulk("republish")} disabled={bulk.isPending}>
              <RotateCcw className="mr-1 h-3 w-3" /> {BULK_LABEL.republish}
            </Button>
            <ConfirmDestructive
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={bulk.isPending}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> {BULK_LABEL.delete}
                </Button>
              }
              title={`Excluir ${selected.size} empresa(s) permanentemente?`}
              description={
                <p>
                  Todos os dados relacionados (avaliações, reivindicações, produtos, eventos) serão excluídos.
                  Esta ação não pode ser desfeita.
                </p>
              }
              confirmText="Excluir tudo"
              onConfirm={() => runBulk("delete")}
            />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty>Nenhuma empresa encontrada.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Lista de empresas com seleção em lote, status, cidade e ações.
            </caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="w-10 px-3 py-3">
                  <button
                    type="button"
                    onClick={toggleAll}
                    aria-label={allSelected ? "Desmarcar todas" : "Selecionar todas"}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Cidade</th>
                <th scope="col" className="px-4 py-3 font-medium">Criada em</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <tr key={c.id} className="border-t border-border transition hover:bg-muted/40">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${c.name}`}
                        checked={checked}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
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
                                  A empresa <strong>{c.name}</strong> ficará oculta para todos.
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
                                A empresa <strong>{c.name}</strong> deixará de aparecer no diretório público.
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
                              Esta ação remove <strong>{c.name}</strong> e todos os dados relacionados.
                              Não pode ser desfeita.
                            </p>
                          }
                          confirmText="Excluir permanentemente"
                          onConfirm={() => remove.mutate({ id: c.id, name: c.name })}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
