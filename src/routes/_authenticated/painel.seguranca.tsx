import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { SecuritySection } from "@/features/security/components/SecuritySection";

export const Route = createFileRoute("/_authenticated/painel/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança da conta e 2FA — Tem na cidade" },
      { name: "description", content: "Ative a verificação em duas etapas, gerencie sessões e reforce a segurança da sua conta no Tem na cidade." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelSeguranca,
});

function PainelSeguranca() {
  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/painel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Segurança</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie a verificação em duas etapas (2FA) da sua conta.
        </p>
        <SecuritySection />
      </section>
    </PageShell>
  );
}
