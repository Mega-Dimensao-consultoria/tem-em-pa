import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Tem em P.A" },
      { name: "description", content: "Conheça o Tem em P.A, o guia comercial inteligente de Pouso Alegre/MG." },
      { property: "og:title", content: "Sobre o Tem em P.A" },
      { property: "og:description", content: "Conheça o guia comercial inteligente de Pouso Alegre." },
    ],
  }),
  component: () => (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">Sobre o Tem em P.A</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Somos o guia comercial inteligente da cidade de <strong>Pouso Alegre/MG</strong>.
          Nosso propósito é conectar moradores a empresas, produtos e serviços locais com
          informações confiáveis, avaliações reais e uma experiência simples.
        </p>
        <h2 className="mt-10 font-display text-2xl font-semibold">Nossa missão</h2>
        <p className="mt-2 text-muted-foreground">
          Fortalecer o comércio local valorizando quem empreende em Pouso Alegre e ajudando
          o consumidor a encontrar a melhor opção perto de casa.
        </p>
      </section>
    </PageShell>
  ),
});
