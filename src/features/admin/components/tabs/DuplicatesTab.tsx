import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { GitMerge, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import {
  useDuplicateGroups,
  useMergeCompanies,
  type DupGroup,
} from "@/features/admin/functions/duplicates";
import { Empty, Loading } from "../admin-ui";

export function DuplicatesTab() {
  const { data = [], isLoading } = useDuplicateGroups();
  if (isLoading) return <Loading />;
  if (data.length === 0)
    return <Empty>Nenhum grupo de duplicatas detectado.</Empty>;

  return (
    <div className="mt-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        {data.length} grupo(s) detectado(s) por similaridade de nome ou telefone.
        Escolha uma empresa como destino — as demais serão mescladas nela e removidas.
      </p>
      {data.map((g) => (
        <DupGroupCard key={g.key} group={g} />
      ))}
    </div>
  );
}

function DupGroupCard({ group }: { group: DupGroup }) {
  const [targetId, setTargetId] = useState<string>(group.items[0].id);
  const merge = useMergeCompanies();
  const target = group.items.find((i) => i.id === targetId);
  const sources = group.items.filter((i) => i.id !== targetId);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {group.reason === "name" ? "Nomes semelhantes" : "Mesmo telefone"} ·{" "}
            {group.items.length} empresas
          </p>
        </div>
      </header>
      <ul className="space-y-2">
        {group.items.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3"
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`target-${group.key}`}
                checked={targetId === c.id}
                onChange={() => setTargetId(c.id)}
                aria-label={`Manter ${c.name}`}
              />
              <span className="font-medium">{c.name}</span>
            </label>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">
              {c.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {[c.neighborhood, c.city].filter(Boolean).join(" · ") || "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {c.phone || c.whatsapp || "—"}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("pt-BR")}
            </span>
            <Button asChild size="sm" variant="ghost" className="h-7 px-2">
              <Link
                to="/empresa/$id"
                params={{ id: c.id }}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${c.name}`}
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Destino: <strong>{target?.name}</strong> · {sources.length} serão mescladas
        </p>
        <ConfirmDestructive
          trigger={
            <Button size="sm" disabled={sources.length === 0 || merge.isPending}>
              <GitMerge className="mr-1 h-3 w-3" />
              {merge.isPending ? "Mesclando…" : "Mesclar no destino"}
            </Button>
          }
          title="Mesclar duplicatas?"
          description={
            <p>
              Todas as avaliações, favoritos, produtos, eventos e pedidos das{" "}
              <strong>{sources.length}</strong> empresas serão transferidos para{" "}
              <strong>{target?.name}</strong>. As empresas de origem serão excluídas
              definitivamente.
            </p>
          }
          confirmText="Mesclar"
          onConfirm={async () => {
            if (!target) return;
            for (const s of sources) {
              await merge.mutateAsync({
                sourceId: s.id,
                targetId: target.id,
                sourceName: s.name,
                targetName: target.name,
              });
            }
          }}
        />
      </div>
    </section>
  );
}
