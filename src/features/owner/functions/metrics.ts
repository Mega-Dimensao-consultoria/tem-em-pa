export type EventRow = { event_type: string; created_at: string; source?: string | null };

export const CLICK_TYPES = ["whatsapp_click", "phone_click", "website_click", "maps_click"];

export type DailyPoint = { label: string; date: Date; views: number; clicks: number };

export function splitByPeriod(events: EventRow[], periodDays: number) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const cutoffCurr = now - periodDays * day;
  const cutoffPrev = now - periodDays * 2 * day;
  const curr = events.filter((e) => new Date(e.created_at).getTime() >= cutoffCurr);
  const prev = events.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t >= cutoffPrev && t < cutoffCurr;
  });
  return { curr, prev };
}

export function countOf(rows: EventRow[], type: string) {
  return rows.filter((e) => e.event_type === type).length;
}

export function delta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function buildDailySeries(curr: EventRow[], periodDays: number): DailyPoint[] {
  const days: DailyPoint[] = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const inDay = curr.filter((e) => {
      const t = new Date(e.created_at);
      return t >= d && t < next;
    });
    days.push({
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      date: d,
      views: inDay.filter((e) => e.event_type === "view").length,
      clicks: inDay.filter((e) => CLICK_TYPES.includes(e.event_type)).length,
    });
  }
  return days;
}
