import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Store,
  MessageSquare,
  Settings,
  Heart,
  Bell,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/features/companies/components/CompanyStatusBadge";
import { useMyCompanies } from "@/features/owner/hooks/useMyCompanies";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({
    meta: [
      { title: "Visão geral do painel — Tem na minha cidade" },
      { name: "description", content: "Atalhos para suas empresas cadastradas, avaliações, favoritos, notificações, segurança e configurações da conta no Tem na minha cidade." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelIndex,
});

function PainelIndex() {
  const { data: companies = [] } = useMyCompanies();
  const hasCompanies = companies.length > 0;

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Meu painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bem-vindo de volta!</p>

        {hasCompanies ? (
          <section aria-labelledby="minhas-empresas" className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="minhas-empresas"
                className="font-display text-xl font-semibold"
              >
                Minhas empresas
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link to="/owner">Gerenciar todas</Link>
              </Button>
            </div>
            <ul className="mt-4 divide-y rounded-2xl border border-border bg-card shadow-soft">
              {companies.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <CompanyStatusBadge status={c.status} className="mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.status === "approved" ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/empresa/$id" params={{ id: c.id }}>
                          Ver página
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to="/owner/empresa/$id/dashboard"
                        params={{ id: c.id }}
                      >
                        Painel
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link
                        to="/owner/empresa/$id/editar"
                        params={{ id: c.id }}
                      >
                        Editar
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasCompanies ? (
            <DashboardCard
              icon={<Building2 className="h-5 w-5" />}
              title="Minhas empresas"
              desc="Gerencie negócios, produtos e respostas."
              to="/owner"
              cta="Abrir"
            />
          ) : (
            <DashboardCard
              icon={<Store className="h-5 w-5" />}
              title="Cadastrar empresa"
              desc="Coloque seu negócio no guia da cidade."
              to="/cadastrar-empresa"
              cta="Começar"
            />
          )}
          <DashboardCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="Minhas avaliações"
            desc="Veja, edite ou remova as avaliações que você deixou."
            to="/painel/avaliacoes"
            cta="Abrir"
          />
          <DashboardCard
            icon={<Heart className="h-5 w-5" />}
            title="Favoritos"
            desc="Acesse rapidamente as empresas que você salvou."
            to="/favoritos"
            cta="Abrir"
          />
          <DashboardCard
            icon={<Bell className="h-5 w-5" />}
            title="Notificações"
            desc="Acompanhe respostas, atualizações e novidades."
            to="/notificacoes"
            cta="Abrir"
          />
          <DashboardCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Segurança"
            desc="Ative a verificação em duas etapas (2FA) com Google Authenticator."
            to="/painel/seguranca"
            cta="Gerenciar"
          />
          <DashboardCard
            icon={<Settings className="h-5 w-5" />}
            title="Configurações"
            desc="Atualize seus dados, e-mail e senha."
            to="/painel/configuracoes"
            cta="Abrir"
          />
        </div>
      </section>
    </PageShell>
  );
}

type DashboardCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  to:
    | "/cadastrar-empresa"
    | "/painel/avaliacoes"
    | "/painel/configuracoes"
    | "/painel/seguranca"
    | "/painel/verificacao-idade"
    | "/favoritos"
    | "/notificacoes"
    | "/owner";
  cta: string;
};

function DashboardCard({ icon, title, desc, to, cta }: DashboardCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="flex-1 text-sm text-muted-foreground">{desc}</p>
      <Button asChild>
        <Link to={to}>{cta}</Link>
      </Button>
    </article>
  );
}
