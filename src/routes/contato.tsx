import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Tem em P.A" },
      { name: "description", content: "Fale com a equipe do Tem em P.A. Tire dúvidas, envie sugestões ou reporte problemas." },
      { property: "og:title", content: "Contato — Tem em P.A" },
      { property: "og:description", content: "Fale com a equipe do Tem em P.A." },
      { property: "og:url", content: "https://tem-em-pa.lovable.app/contato" },
    ],
    links: [{ rel: "canonical", href: "https://tem-em-pa.lovable.app/contato" }],
  }),
  component: () => (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">Fale com a gente</h1>
        <p className="mt-4 text-muted-foreground">Tem alguma dúvida, sugestão ou quer reportar um problema?</p>
        <ul className="mt-8 space-y-3 text-base">
          <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <Mail className="h-5 w-5 text-primary" />
            <a href="mailto:contato@tememp.a" className="font-semibold hover:underline">contato@tememp.a</a>
          </li>
          <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp em breve
          </li>
        </ul>
      </section>
    </PageShell>
  ),
});
