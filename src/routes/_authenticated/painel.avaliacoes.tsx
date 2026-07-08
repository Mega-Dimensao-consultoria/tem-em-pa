import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { MyReviewCard } from "@/features/reviews/components/MyReviewCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ReviewListSkeleton } from "@/components/feedback/Skeletons";
import { useMyReviews } from "@/features/reviews/hooks/useMyReviews";

export const Route = createFileRoute("/_authenticated/painel/avaliacoes")({
  head: () => ({ meta: [{ title: "Minhas avaliações — Tem na cidade" }] }),
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
            <ReviewListSkeleton count={3} />
          ) : data.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-6 w-6" />}
              title="Você ainda não avaliou nenhuma empresa"
              description="Visite a página de uma empresa para deixar sua opinião."
              action={
                <Button asChild>
                  <Link to="/">Procurar empresas</Link>
                </Button>
              }
            />
          ) : (
            data.map((r) => <MyReviewCard key={r.id} row={r} />)
          )}
        </div>
      </section>
    </PageShell>
  );
}
