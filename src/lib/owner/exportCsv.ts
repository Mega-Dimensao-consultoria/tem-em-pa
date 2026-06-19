import type { DailyPoint } from "./metrics";

export function exportMetricsCsv(opts: {
  companyName: string;
  periodDays: number;
  days: DailyPoint[];
}) {
  const { companyName, periodDays, days } = opts;
  const header = "data,visualizacoes,cliques\n";
  const rows = days
    .map((d) => `${d.date.toISOString().slice(0, 10)},${d.views},${d.clicks}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metricas-${companyName.replace(/\s+/g, "-").toLowerCase()}-${periodDays}d.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
