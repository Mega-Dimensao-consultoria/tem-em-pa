import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats } from "@/features/admin/functions/stats";
import { toCsv, downloadCsv } from "@/lib/csv";
import { toast } from "sonner";

type EventRow = { event_type: string; created_at: string; company_id: string };

function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview", "30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("company_events")
        .select("event_type, created_at, company_id")
        .gte("created_at", since)
        .limit(20000);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });
}

function useTopCompanies() {
  const { data: events } = useAdminOverview();
  const topIds = useMemo(() => {
    if (!events) return [];
    const map = new Map<string, number>();
    for (const e of events) {
      if (e.event_type === "view") map.set(e.company_id, (map.get(e.company_id) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));
  }, [events]);

  return useQuery({
    queryKey: ["admin", "topCompanies", topIds.map((t) => t.id).join(",")],
    enabled: topIds.length > 0,
    queryFn: async () => {
      const ids = topIds.map((t) => t.id);
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((c) => [c.id, c.name]));
      return topIds.map((t) => ({ id: t.id, name: byId.get(t.id) ?? "—", views: t.count }));
    },
  });
}

function DailyChart({ events }: { events: EventRow[] }) {
  const days = useMemo(() => {
    const out: { label: string; views: number; clicks: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const inDay = events.filter((e) => {
        const t = new Date(e.created_at);
        return t >= d && t < next;
      });
      out.push({
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: inDay.filter((e) => e.event_type === "view").length,
        clicks: inDay.filter((e) => e.event_type !== "view").length,
      });
    }
    return out;
  }, [events]);
  const max = Math.max(1, ...days.map((d) => d.views + d.clicks));
  return (
    <div aria-label="Atividade diária nos últimos 30 dias" role="img">
      <div className="flex h-32 items-end gap-[2px]">
        {days.map((d) => {
          const vh = Math.round((d.views / max) * 100);
          const ch = Math.round((d.clicks / max) * 100);
          return (
            <div key={d.label} className="flex flex-1 flex-col justify-end" title={`${d.label}: ${d.views} views, ${d.clicks} cliques`}>
              <div className="w-full bg-emerald-500/60" style={{ height: `${ch}%` }} />
              <div className="w-full bg-primary/70" style={{ height: `${vh}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{days[0]?.label}</span>
        <span>{days[days.length - 1]?.label}</span>
      </div>
      <div className="mt-2 flex gap-3 text-[10px]">
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-primary/70" /> Visualizações</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-sm bg-emerald-500/60" /> Cliques</span>
      </div>
    </div>
  );
}

async function exportCompanies() {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select(
        "id, name, status, category_id, phone, email, address, created_at, cities:city_id(name, slug), neighborhoods:neighborhood_id(name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    const flat = (data ?? []).map((r) => {
      const row = r as unknown as {
        cities: { name: string | null; slug: string | null } | null;
        neighborhoods: { name: string | null; slug: string | null } | null;
      } & Record<string, unknown>;
      return {
        ...row,
        city: row.cities?.name ?? null,
        city_slug: row.cities?.slug ?? null,
        neighborhood: row.neighborhoods?.name ?? null,
        neighborhood_slug: row.neighborhoods?.slug ?? null,
      };
    });
    downloadCsv(`empresas-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(flat));
    toast.success("Exportação concluída");
  } catch (e) {
    toast.error((e as Error).message);
  }
}

async function exportReviews() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, company_id, rating, status, comment, created_at, owner_reply_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    downloadCsv(`avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data ?? []));
    toast.success("Exportação concluída");
  } catch (e) {
    toast.error((e as Error).message);
  }
}

async function exportContacts() {
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, full_name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    downloadCsv(`contato-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data ?? []));
    toast.success("Exportação concluída");
  } catch (e) {
    toast.error((e as Error).message);
  }
}

export function AdminOverviewTab() {
  const { data: stats } = useAdminStats();
  const { data: events = [], isLoading: loadingEvents } = useAdminOverview();
  const { data: topCompanies = [] } = useTopCompanies();

  const totalViews = events.filter((e) => e.event_type === "view").length;
  const totalClicks = events.filter((e) => e.event_type !== "view").length;

  const fmt = (n: number | undefined) =>
    n === undefined ? "—" : n.toLocaleString("pt-BR");

  const kpis = [
    { label: "Empresas (total)", value: fmt(stats?.companiesTotal) },
    { label: "Empresas ativas", value: fmt(stats?.companiesApproved) },
    { label: "Empresas pendentes", value: fmt(stats?.companiesPending) },
    { label: "Empresas rejeitadas", value: fmt(stats?.companiesRejected) },
    { label: "Reivindicações pendentes", value: fmt(stats?.claimsPending) },
    { label: "Pedidos de remoção", value: fmt(stats?.removalsPending) },
    { label: "Avaliações (total)", value: fmt(stats?.reviewsTotal) },
    { label: "Avaliações p/ moderar", value: fmt(stats?.reviewsPending) },
    { label: "Denúncias abertas", value: fmt(stats?.reportsPending) },
    { label: "Mensagens de contato", value: fmt(stats?.contactMessagesTotal) },
    { label: "Contato pendente", value: fmt(stats?.contactMessagesPending) },
    { label: "Usuários", value: fmt(stats?.users) },
    { label: "Posts do blog", value: fmt(stats?.blogPostsTotal) },
    { label: "Posts publicados", value: fmt(stats?.blogPostsPublished) },
    { label: "Páginas do site", value: fmt(stats?.sitePagesTotal) },
    { label: "Cidades cadastradas", value: fmt(stats?.cities) },
    { label: "Bairros cadastrados", value: fmt(stats?.neighborhoods) },
    { label: "Categorias", value: fmt(stats?.categories) },
    { label: "Visualizações (30d)", value: totalViews.toLocaleString("pt-BR") },
    { label: "Cliques (30d)", value: totalClicks.toLocaleString("pt-BR") },
  ];

  return (
    <section aria-labelledby="admin-overview-title" className="space-y-6 py-4">
      <h2 id="admin-overview-title" className="sr-only">Visão geral administrativa</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="admin-activity-title" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 id="admin-activity-title" className="mb-4 font-display text-base font-semibold">
            Atividade — últimos 30 dias
          </h3>
          {loadingEvents ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <DailyChart events={events} />
          )}
        </section>

        <section aria-labelledby="admin-top-title" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 id="admin-top-title" className="mb-4 font-display text-base font-semibold">
            Top 10 empresas (visualizações 30d)
          </h3>
          {topCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <ol className="space-y-1 text-sm" aria-label="Empresas mais vistas">
              {topCompanies.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-2 border-b border-border/40 py-1 last:border-0">
                  <span className="truncate">
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {c.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{c.views}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="admin-export-title" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 id="admin-export-title" className="mb-3 font-display text-base font-semibold">
          Exportar dados (CSV)
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Baixe os dados administrativos em formato CSV para análise externa. Os arquivos incluem os campos principais de cada tabela.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportCompanies}>
            <Download className="mr-1 h-3 w-3" /> Empresas
          </Button>
          <Button size="sm" variant="outline" onClick={exportReviews}>
            <Download className="mr-1 h-3 w-3" /> Avaliações
          </Button>
          <Button size="sm" variant="outline" onClick={exportContacts}>
            <Download className="mr-1 h-3 w-3" /> Mensagens de contato
          </Button>
        </div>
      </section>
    </section>
  );
}
