export type HourRow = { day: number; open: string; close: string; closed?: boolean };

export function isOpenNow(hours: unknown, ref: Date = new Date()): boolean {
  if (!Array.isArray(hours) || hours.length === 0) return false;
  const rows = hours as HourRow[];
  const today = ref.getDay();
  const row = rows.find((r) => r.day === today);
  if (!row || row.closed) return false;
  const cur = ref.getHours() * 60 + ref.getMinutes();
  const [oh, om] = (row.open ?? "00:00").split(":").map(Number);
  const [ch, cm] = (row.close ?? "00:00").split(":").map(Number);
  if (Number.isNaN(oh) || Number.isNaN(ch)) return false;
  return cur >= oh * 60 + (om || 0) && cur <= ch * 60 + (cm || 0);
}
