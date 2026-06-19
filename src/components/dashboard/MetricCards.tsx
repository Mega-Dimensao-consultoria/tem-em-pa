import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

export type MetricCard = {
  label: string;
  icon: LucideIcon;
  value: number | string;
  deltaPct: number | null;
};

export function MetricCards({ cards }: { cards: MetricCard[] }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const up = c.deltaPct != null && c.deltaPct > 0;
        const down = c.deltaPct != null && c.deltaPct < 0;
        return (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <c.icon className="h-3.5 w-3.5" />
              {c.label}
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="font-display text-3xl font-bold">{c.value}</div>
              {c.deltaPct != null ? (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    up
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : down
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : "bg-muted text-muted-foreground"
                  }`}
                  title="vs. período anterior"
                >
                  {up ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : down ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : null}
                  {c.deltaPct > 0 ? "+" : ""}
                  {c.deltaPct}%
                </span>
              ) : c.label !== "Avaliação média" ? (
                <span className="text-[11px] text-muted-foreground">novo</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
