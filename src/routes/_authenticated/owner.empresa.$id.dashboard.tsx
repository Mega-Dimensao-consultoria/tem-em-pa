import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, Phone, Globe, MapPin, Star, ArrowLeft, ArrowUp, ArrowDown, Download } from "lucide-react";
import { RatingStars } from "@/components/RatingStars";
import { OwnerReplyForm } from "@/components/OwnerReplyForm";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { QrCodeCard } from "@/components/QrCodeCard";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tem em P.A" }] }),
  component: DashboardPage,
});

type EventRow = { event_type: string; created_at: string };

const CLICK_TYPES = ["whatsapp_click", "phone_click", "website_click", "maps_click"];

function DashboardPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["owner-company", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, owner_id, status, logo_url, cover_url, description, phone, whatsapp, website, instagram_url, facebook_url, hours, gallery_urls, lat, lng")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isOwner = !!user && !!company && company.owner_id === user.id;

  const { data: events = [] } = useQuery({
    queryKey: ["company-events", id],
    enabled: isOwner,
    queryFn: async () => {
      // pull last 60 days so we can compare 30d vs prior 30d
      const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("company_events")
        .select("event_type, created_at")
        .eq("company_id", id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["owner-reviews", id],
    enabled: isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, status, owner_reply, owner_reply_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  if (authLoading || loadingCompany) {
    return <PageShell><div className="mx-auto max-w-5xl px-4 py-12 text-sm text-muted-foreground">Carregando…</div></PageShell>;
  }
  if (!company || !isOwner) throw notFound();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const cutoff30 = now - 30 * day;
  const cutoff60 = now - 60 * day;

  const last30 = events.filter((e) => new Date(e.created_at).getTime() >= cutoff30);
  const prev30 = events.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t >= cutoff60 && t < cutoff30;
  });

  function countOf(rows: EventRow[], type: string) {
    return rows.filter((e) => e.event_type === type).length;
  }
  function delta(curr: number, prev: number): number | null {
    if (prev === 0) return curr === 0 ? 0 : null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // 30-day daily series for views + clicks
  const days: { label: string; date: Date; views: number; clicks: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const inDay = last30.filter((e) => {
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
  const maxViews = Math.max(1, ...days.map((d) => d.views));
  const maxClicks = Math.max(1, ...days.map((d) => d.clicks));

  const cards: { label: string; icon: typeof Eye; value: number | string; deltaPct: number | null }[] = [
    { label: "Visualizações", icon: Eye, value: countOf(last30, "view"), deltaPct: delta(countOf(last30, "view"), countOf(prev30, "view")) },
    { label: "Cliques WhatsApp", icon: MessageCircle, value: countOf(last30, "whatsapp_click"), deltaPct: delta(countOf(last30, "whatsapp_click"), countOf(prev30, "whatsapp_click")) },
    { label: "Cliques Telefone", icon: Phone, value: countOf(last30, "phone_click"), deltaPct: delta(countOf(last30, "phone_click"), countOf(prev30, "phone_click")) },
    { label: "Cliques Site", icon: Globe, value: countOf(last30, "website_click"), deltaPct: delta(countOf(last30, "website_click"), countOf(prev30, "website_click")) },
    { label: "Cliques Mapa", icon: MapPin, value: countOf(last30, "maps_click"), deltaPct: delta(countOf(last30, "maps_click"), countOf(prev30, "maps_click")) },
    { label: "Avaliação média", icon: Star, value: avg > 0 ? avg.toFixed(1) : "—", deltaPct: null },
  ];

  function exportCsv() {
    const header = "data,visualizacoes,cliques\n";
    const rows = days.map((d) => `${d.date.toISOString().slice(0, 10)},${d.views},${d.clicks}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metricas-${company!.name.replace(/\s+/g, "-").toLowerCase()}-30d.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner"><ArrowLeft className="mr-1 h-3 w-3" />Voltar</Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{company.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Dashboard · últimos 30 dias (vs 30 dias anteriores)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1 h-3 w-3" /> Exportar CSV
            </Button>
            <Button asChild variant="outline" size="sm"><Link to="/empresa/$id" params={{ id }}>Ver página pública</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/owner/empresa/$id/editar" params={{ id }}>Editar</Link></Button>
            <Button asChild size="sm"><Link to="/owner/empresa/$id/produtos" params={{ id }}>Produtos</Link></Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const up = c.deltaPct != null && c.deltaPct > 0;
            const down = c.deltaPct != null && c.deltaPct < 0;
            return (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <c.icon className="h-3.5 w-3.5" />{c.label}
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="font-display text-3xl font-bold">{c.value}</div>
                  {c.deltaPct != null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        up ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                        down ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" :
                        "bg-muted text-muted-foreground"
                      }`}
                      title="vs. 30 dias anteriores"
                    >
                      {up ? <ArrowUp className="h-3 w-3" /> : down ? <ArrowDown className="h-3 w-3" /> : null}
                      {c.deltaPct > 0 ? "+" : ""}{c.deltaPct}%
                    </span>
                  ) : c.label !== "Avaliação média" ? (
                    <span className="text-[11px] text-muted-foreground">novo</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base font-semibold">Visualizações por dia</h2>
            <Sparkbars data={days.map((d) => ({ label: d.label, count: d.views }))} max={maxViews} color="bg-primary/70" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base font-semibold">Cliques por dia</h2>
            <Sparkbars data={days.map((d) => ({ label: d.label, count: d.clicks }))} max={maxClicks} color="bg-emerald-500/70" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <ProfileCompleteness company={company} />
          <QrCodeCard
            url={`https://tem-em-pa.lovable.app/empresa/${company.id}`}
            companyName={company.name}
          />
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Avaliações ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              Ainda não há avaliações.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RatingStars value={r.rating} />
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.status === "approved" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : <p className="mt-2 text-xs italic text-muted-foreground">Sem comentário</p>}
                  <OwnerReplyForm
                    reviewId={r.id}
                    initialReply={r.owner_reply}
                    replyAt={r.owner_reply_at}
                    onSaved={() => refetchReviews()}
                  />
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Sparkbars({ data, max, color }: { data: { label: string; count: number }[]; max: number; color: string }) {
  return (
    <>
      <div className="flex h-32 items-end gap-1">
        {data.map((d, i) => (
          <div key={d.label + i} className="group relative flex flex-1 flex-col items-center">
            <div
              className={`w-full rounded-t ${color} transition group-hover:opacity-100`}
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span>
      </div>
    </>
  );
}
