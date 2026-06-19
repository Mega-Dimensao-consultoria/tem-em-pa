import { Input } from "@/components/ui/input";

export type HourRow = { day: number; open: string; close: string; closed?: boolean };

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function defaultHours(): HourRow[] {
  return DAYS.map((_, i) => ({ day: i, open: "08:00", close: "18:00", closed: i === 0 }));
}

export function HoursEditor({
  value,
  onChange,
}: {
  value: HourRow[];
  onChange: (next: HourRow[]) => void;
}) {
  function update(i: number, patch: Partial<HourRow>) {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {value.map((h, i) => (
        <div
          key={i}
          className="grid grid-cols-[3rem_auto_1fr_1fr] items-center gap-3 rounded-lg border border-border p-2"
        >
          <span className="text-sm font-semibold">{DAYS[h.day]}</span>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={!h.closed}
              onChange={(e) => update(i, { closed: !e.target.checked })}
            />
            Aberto
          </label>
          <Input
            type="time"
            value={h.open}
            disabled={h.closed}
            onChange={(e) => update(i, { open: e.target.value })}
          />
          <Input
            type="time"
            value={h.close}
            disabled={h.closed}
            onChange={(e) => update(i, { close: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
