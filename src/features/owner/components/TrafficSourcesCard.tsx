import type { EventRow } from "@/features/owner/functions/metrics";

const LABELS: Record<string, string> = {
  direct: "Direto",
  search: "Busca (Google, Bing…)",
  social: "Redes sociais",
  internal: "Navegação interna",
  other: "Outros sites",
};

const COLORS: Record<string, string> = {
  direct: "bg-primary/70",
  search: "bg-emerald-500/70",
  social: "bg-fuchsia-500/70",
  internal: "bg-sky-500/70",
  other: "bg-amber-500/70",
};

export function TrafficSourcesCard({ events }: { events: EventRow[] }) {
  const views = events.filter((e) => e.event_type === "view");
  const counts: Record<string, number> = { direct: 0, search: 0, social: 0, internal: 0, other: 0 };
  for (const e of views) {
    const key = (e.source ?? "direct") as keyof typeof counts;
    counts[key in counts ? key : "other"] = (counts[key in counts ? key : "other"] ?? 0) + 1;
  }
  const total = views.length;

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      aria-labelledby="traffic-sources-title"
    >
      <h2 id="traffic-sources-title" className="mb-4 font-display text-base font-semibold">
        Origem do tráfego
      </h2>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Sem visualizações no período.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {Object.keys(LABELS).map((key) => {
            const value = counts[key] ?? 0;
            const pct = Math.round((value / total) * 100);
            return (
              <li key={key} className="text-xs">
                <div className="flex items-center justify-between">
                  <span>{LABELS[key]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {value} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${COLORS[key]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
