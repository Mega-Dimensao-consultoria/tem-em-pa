import { useAdminStats } from "@/lib/admin/stats";

type Tone = "primary" | "warn" | "danger" | "muted";

export function AdminStats() {
  const { data } = useAdminStats();

  const stats: { label: string; value: number | string; tone: Tone }[] = [
    { label: "Empresas ativas", value: data?.companiesApproved ?? "—", tone: "primary" },
    { label: "Empresas pendentes", value: data?.companiesPending ?? "—", tone: data?.companiesPending ? "warn" : "muted" },
    { label: "Reivindicações", value: data?.claimsPending ?? "—", tone: data?.claimsPending ? "warn" : "muted" },
    { label: "Comentários p/ moderar", value: data?.reviewsPending ?? "—", tone: data?.reviewsPending ? "warn" : "muted" },
    { label: "Denúncias abertas", value: data?.reportsPending ?? "—", tone: data?.reportsPending ? "danger" : "muted" },
    { label: "Usuários", value: data?.users ?? "—", tone: "muted" },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${
              s.tone === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : s.tone === "danger"
                  ? "text-rose-600 dark:text-rose-400"
                  : s.tone === "primary"
                    ? "text-primary"
                    : ""
            }`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
