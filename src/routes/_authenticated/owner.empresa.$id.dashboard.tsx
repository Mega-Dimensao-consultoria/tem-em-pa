import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, Phone, Globe, MapPin, Star, ArrowLeft } from "lucide-react";
import { RatingStars } from "@/components/RatingStars";
import { OwnerReplyForm } from "@/components/OwnerReplyForm";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tem em P.A" }] }),
  component: DashboardPage,
});

type EventRow = { event_type: string; created_at: string };

function DashboardPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["owner-company", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, owner_id, status")
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
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("company_events")
        .select("event_type, created_at")
        .eq("company_id", id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
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

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Build last 30-day view sparkline
  const days: { label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const c = events.filter((e) => e.event_type === "view" && new Date(e.created_at) >= d && new Date(e.created_at) < next).length;
    days.push({ label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), count: c });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const cards = [
    { label: "Visualizações", icon: Eye, value: counts.view ?? 0 },
    { label: "Cliques WhatsApp", icon: MessageCircle, value: counts.whatsapp_click ?? 0 },
    { label: "Cliques Telefone", icon: Phone, value: counts.phone_click ?? 0 },
    { label: "Cliques Site", icon: Globe, value: counts.website_click ?? 0 },
    { label: "Cliques Mapa", icon: MapPin, value: counts.maps_click ?? 0 },
    { label: "Avaliação média", icon: Star, value: avg > 0 ? avg.toFixed(1) : "—" },
  ];

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner"><ArrowLeft className="mr-1 h-3 w-3" />Voltar</Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{company.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Dashboard · últimos 30 dias</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/empresa/$id" params={{ id }}>Ver página pública</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/owner/empresa/$id/editar" params={{ id }}>Editar</Link></Button>
            <Button asChild size="sm"><Link to="/owner/empresa/$id/produtos" params={{ id }}>Produtos</Link></Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <c.icon className="h-3.5 w-3.5" />{c.label}
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base font-semibold">Visualizações por dia</h2>
          <div className="flex h-32 items-end gap-1">
            {days.map((d) => (
              <div key={d.label} className="group relative flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-primary/70 transition group-hover:bg-primary"
                  style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }}
                  title={`${d.label}: ${d.count}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{days[0].label}</span><span>{days[days.length - 1].label}</span>
          </div>
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
