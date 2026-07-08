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

function csvEscape(s: string): string {
  const needs = /[",\n\r]/.test(s);
  const v = s.replace(/"/g, '""');
  return needs ? `"${v}"` : v;
}

function download(filename: string, content: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  status: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
};

export function exportReviewsCsv(opts: { companyName: string; reviews: ReviewRow[] }) {
  const { companyName, reviews } = opts;
  const header = "data,nota,status,comentario,resposta,data_resposta\n";
  const rows = reviews
    .map((r) =>
      [
        new Date(r.created_at).toISOString().slice(0, 10),
        String(r.rating),
        r.status,
        csvEscape(r.comment ?? ""),
        csvEscape(r.owner_reply ?? ""),
        r.owner_reply_at ? new Date(r.owner_reply_at).toISOString().slice(0, 10) : "",
      ].join(","),
    )
    .join("\n");
  const slug = companyName.replace(/\s+/g, "-").toLowerCase();
  download(`avaliacoes-${slug}.csv`, header + rows);
}
