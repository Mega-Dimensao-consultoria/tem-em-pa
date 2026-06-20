import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Store, MessageSquare, Settings, Heart, Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Meu painel — Tem em P.A" }] }),
  component: PainelPage,
});

function PainelPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Meu painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bem-vindo de volta!</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            icon={<Store className="h-5 w-5" />}
            title="Cadastrar empresa"
            desc="Coloque seu negócio no guia da cidade."
            to="/cadastrar-empresa"
            cta="Começar"
          />
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
  to: "/cadastrar-empresa" | "/painel/avaliacoes" | "/painel/configuracoes" | "/favoritos" | "/notificacoes";
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
