import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  Globe,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Phone,
  Star,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { RemovalRequestDialog } from "@/features/companies/components/RemovalRequestDialog";
import { CompanyDetailSkeleton } from "@/components/feedback/Skeletons";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ShareButton";
import { ProfileCompleteness } from "@/features/auth/components/ProfileCompleteness";
import { QrCodeCard } from "@/components/QrCodeCard";
import { Sparkbars } from "@/features/owner/components/Sparkbars";
import {
  MetricCards,
  type MetricCard,
} from "@/features/owner/components/MetricCards";
import { PeriodSelector } from "@/features/owner/components/PeriodSelector";
import { DashboardReviewsList } from "@/features/owner/components/DashboardReviewsList";
import { TrafficSourcesCard } from "@/features/owner/components/TrafficSourcesCard";
import { AlertPrefsCard } from "@/features/owner/components/AlertPrefsCard";
import { useAuth } from "@/features/auth/use-auth";
import { useOwnerCompany } from "@/features/owner/hooks/useOwnerCompany";
import { useCompanyEvents } from "@/features/owner/hooks/useCompanyEvents";
import { useOwnerReviews } from "@/features/owner/hooks/useOwnerReviews";
import {
  buildDailySeries,
  countOf,
  delta,
  splitByPeriod,
} from "@/features/owner/functions/metrics";
import { exportMetricsCsv, exportReviewsCsv } from "@/features/owner/functions/exportCsv";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel da empresa e métricas — Tem na minha cidade" },
      { name: "description", content: "Acompanhe visualizações, contatos, avaliações e desempenho da sua empresa no Tem na minha cidade em tempo real." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);

  const { data: company, isLoading: loadingCompany } = useOwnerCompany(id, user?.id);
  const isOwner = !!user && !!company && company.owner_id === user.id;

  const { data: events = [] } = useCompanyEvents(id, periodDays, isOwner);
  const { data: reviews = [], refetch: refetchReviews } = useOwnerReviews(id, isOwner);

  if (authLoading || loadingCompany) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <CompanyDetailSkeleton />
        </div>
      </PageShell>
    );
  }
  if (!company || !isOwner) throw notFound();

  const { curr, prev } = splitByPeriod(events, periodDays);
  const days = buildDailySeries(curr, periodDays);
  const maxViews = Math.max(1, ...days.map((d) => d.views));
  const maxClicks = Math.max(1, ...days.map((d) => d.clicks));

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const unansweredCount = reviews.filter(
    (r) => r.status === "approved" && !r.owner_reply,
  ).length;

  const cards: MetricCard[] = [
    {
      label: "Visualizações",
      icon: Eye,
      value: countOf(curr, "view"),
      deltaPct: delta(countOf(curr, "view"), countOf(prev, "view")),
    },
    {
      label: "Cliques WhatsApp",
      icon: MessageCircle,
      value: countOf(curr, "whatsapp_click"),
      deltaPct: delta(
        countOf(curr, "whatsapp_click"),
        countOf(prev, "whatsapp_click"),
      ),
    },
    {
      label: "Cliques Telefone",
      icon: Phone,
      value: countOf(curr, "phone_click"),
      deltaPct: delta(countOf(curr, "phone_click"), countOf(prev, "phone_click")),
    },
    {
      label: "Cliques Site",
      icon: Globe,
      value: countOf(curr, "website_click"),
      deltaPct: delta(
        countOf(curr, "website_click"),
        countOf(prev, "website_click"),
      ),
    },
    {
      label: "Cliques Mapa",
      icon: MapPin,
      value: countOf(curr, "maps_click"),
      deltaPct: delta(countOf(curr, "maps_click"), countOf(prev, "maps_click")),
    },
    {
      label: "Avaliação média",
      icon: Star,
      value: avg > 0 ? avg.toFixed(1) : "—",
      deltaPct: null,
    },
  ];

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Voltar
          </Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{company.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard · últimos {periodDays} dias (vs {periodDays} dias anteriores)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PeriodSelector value={periodDays} onChange={setPeriodDays} />
            <ShareButton
              title={company.name}
              text={`Confira ${company.name} no Tem na minha cidade`}
              url={`https://www.temnaminhacidade.com.br/empresa/${company.id}`}
              className="!px-3 !py-1.5 !text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportMetricsCsv({
                  companyName: company.name,
                  periodDays,
                  days,
                })
              }
            >
              <Download className="mr-1 h-3 w-3" /> Métricas CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={reviews.length === 0}
              onClick={() =>
                exportReviewsCsv({ companyName: company.name, reviews })
              }
            >
              <Download className="mr-1 h-3 w-3" /> Avaliações CSV
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/empresa/$id" params={{ id }}>
                Ver página pública
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/owner/empresa/$id/editar" params={{ id }}>
                Editar
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/owner/empresa/$id/produtos" params={{ id }}>
                Produtos
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/owner/empresa/$id/eventos" params={{ id }}>
                Eventos
              </Link>
            </Button>
            <RemovalRequestDialog companyId={id} userId={user?.id ?? null} ownerMode />
          </div>
        </div>

        {unansweredCount > 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <MessageSquareWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-semibold">
                Você tem {unansweredCount} avaliação
                {unansweredCount > 1 ? "ões" : ""} sem resposta
              </p>
              <p className="text-xs text-muted-foreground">
                Responder ao público mostra que sua empresa se importa — e melhora a percepção de quem visita o perfil.
              </p>
            </div>
          </div>
        ) : null}

        <MetricCards cards={cards} />

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base font-semibold">
              Visualizações por dia
            </h2>
            <Sparkbars
              data={days.map((d) => ({ label: d.label, count: d.views }))}
              max={maxViews}
              color="bg-primary/70"
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base font-semibold">Cliques por dia</h2>
            <Sparkbars
              data={days.map((d) => ({ label: d.label, count: d.clicks }))}
              max={maxClicks}
              color="bg-emerald-500/70"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <TrafficSourcesCard events={curr} />
          {user ? <AlertPrefsCard companyId={id} userId={user.id} /> : null}
        </div>


        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <ProfileCompleteness company={company} />
          <QrCodeCard
            url={`https://www.temnaminhacidade.com.br/empresa/${company.id}`}
            companyName={company.name}
          />
        </div>

        <DashboardReviewsList reviews={reviews} onReplied={() => refetchReviews()} />
      </section>
    </PageShell>
  );
}
