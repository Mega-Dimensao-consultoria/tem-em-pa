import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { MyReviewCard } from "@/features/reviews/components/MyReviewCard";
import { useMyReviews } from "@/features/reviews/hooks/useMyReviews";

export const Route = createFileRoute("/_authenticated/painel/avaliacoes")({
  head: () => ({ meta: [{ title: "Minhas avaliações — Tem em P.A" }] }),
  component: MinhasAvaliacoes,
});

function MinhasAvaliacoes() {
  const { data = [], isLoading } = useMyReviews();

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/painel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">
          Minhas avaliações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja, edite ou remova as avaliações que você deixou para empresas da
          cidade.
        </p>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Você ainda não avaliou nenhuma empresa. Visite uma página de
                empresa para deixar sua opinião.
              </p>
              <Button asChild className="mt-4">
                <Link to="/buscar">Procurar empresas</Link>
              </Button>
            </div>
          ) : (
            data.map((r) => <MyReviewCard key={r.id} row={r} />)
          )}
        </div>
      </section>
    </PageShell>
  );
}
