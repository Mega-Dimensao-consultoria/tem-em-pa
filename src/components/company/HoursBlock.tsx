import { isOpenNow } from "@/lib/hours";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export type HourRow = { day: number; open: string; close: string; closed?: boolean };

export function HoursBlock({ hours }: { hours: unknown }) {
  if (!Array.isArray(hours) || hours.length === 0) return null;
  const rows = hours as HourRow[];
  const hasOpen = rows.some((r) => !r.closed);
  if (!hasOpen) return null;

  const today = new Date().getDay();
  const openNow = isOpenNow(hours);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Horário</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            openNow
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {openNow ? "Aberto agora" : "Fechado agora"}
        </span>
      </div>
      <ul className="space-y-1 text-sm">
        {rows.map((r, i) => (
          <li
            key={i}
            className={`flex items-center justify-between gap-3 ${r.day === today ? "font-semibold" : ""}`}
          >
            <span>{DAY_LABELS[r.day]}</span>
            <span className="text-muted-foreground">
              {r.closed ? "Fechado" : `${r.open} – ${r.close}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
