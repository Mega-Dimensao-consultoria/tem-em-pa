import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Store, MessageSquare, Settings } from "lucide-react";

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
            desc="Veja as empresas que você avaliou."
            to="/painel"
            cta="Em breve"
            disabled
          />
          <Card
            icon={<Settings className="h-5 w-5" />}
            title="Configurações"
            desc="Atualize seus dados pessoais."
            to="/painel"
            cta="Em breve"
            disabled
          />
        </div>
      </section>
    </PageShell>
  );
}

function Card({ icon, title, desc, to, cta, disabled }: { icon: React.ReactNode; title: string; desc: string; to: string; cta: string; disabled?: boolean }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">{icon}</span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="flex-1 text-sm text-muted-foreground">{desc}</p>
      {disabled ? (
        <Button variant="outline" disabled>{cta}</Button>
      ) : (
        <Button asChild><Link to={to}>{cta}</Link></Button>
      )}
    </article>
  );
}
