import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Store, MessageSquare, Settings, Heart, Bell, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({ meta: [{ title: "Meu painel — Tem em P.A" }] }),
  component: PainelIndex,
});

type MyCompany = {
  id: string;
  name: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Publicada",
  pending: "Pendente de aprovação",
  rejected: "Rejeitada",
  claimed: "Em reivindicação",
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  claimed: "bg-sky-100 text-sky-800",
};

function PainelIndex() {
  const { user } = useAuth();
  const { data: companies = [] } = useQuery({
    queryKey: ["my-companies", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MyCompany[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, status")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MyCompany[];
    },
  });

  const hasCompanies = companies.length > 0;

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Meu painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bem-vindo de volta!</p>

        {hasCompanies ? (
          <section aria-labelledby="minhas-empresas" className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 id="minhas-empresas" className="font-display text-xl font-semibold">
                Minhas empresas
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link to="/owner">Gerenciar todas</Link>
              </Button>
            </div>
            <ul className="mt-4 divide-y rounded-2xl border border-border bg-card shadow-soft">
              {companies.map((c) => {
                const label = STATUS_LABEL[c.status] ?? c.status;
                const style = STATUS_STYLE[c.status] ?? "bg-muted text-foreground";
                return (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.name}</p>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
                      >
                        {label}
                      </span>
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
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasCompanies ? (
            <Card
              icon={<Building2 className="h-5 w-5" />}
              title="Minhas empresas"
              desc="Gerencie negócios, produtos e respostas."
              to="/owner"
              cta="Abrir"
            />
          ) : (
            <Card
              icon={<Store className="h-5 w-5" />}
              title="Cadastrar empresa"
              desc="Coloque seu negócio no guia da cidade."
              to="/cadastrar-empresa"
              cta="Começar"
            />
          )}
          <Card
            icon={<MessageSquare className="h-5 w-5" />}
            title="Minhas avaliações"
            desc="Veja, edite ou remova as avaliações que você deixou."
            to="/painel/avaliacoes"
            cta="Abrir"
          />
          <Card
            icon={<Heart className="h-5 w-5" />}
            title="Favoritos"
            desc="Acesse rapidamente as empresas que você salvou."
            to="/favoritos"
            cta="Abrir"
          />
          <Card
            icon={<Bell className="h-5 w-5" />}
            title="Notificações"
            desc="Acompanhe respostas, atualizações e novidades."
            to="/notificacoes"
            cta="Abrir"
          />
          <Card
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

type CardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  to:
    | "/cadastrar-empresa"
    | "/painel/avaliacoes"
    | "/painel/configuracoes"
    | "/favoritos"
    | "/notificacoes"
    | "/owner";
  cta: string;
};

function Card({ icon, title, desc, to, cta }: CardProps) {
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
