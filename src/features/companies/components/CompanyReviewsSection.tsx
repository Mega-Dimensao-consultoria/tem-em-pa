import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/features/reviews/components/RatingStars";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { ReportReviewDialog } from "@/features/reviews/components/ReportReviewDialog";
import { RatingFilter, type RatingFilterValue } from "@/features/reviews/components/RatingFilter";
import { NoReviews } from "@/components/feedback/EmptyState";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  owner_reply?: string | null;
  owner_reply_at?: string | null;
};

const PAGE_SIZE = 5;

export function CompanyReviewsSection({
  companyId,
  reviews,
  user,
  onReviewSubmitted,
}: {
  companyId: string;
  reviews: Review[];
  user: User | null;
  onReviewSubmitted: () => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [rating, setRating] = useState<RatingFilterValue>(0);

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) c[r.rating] = (c[r.rating] ?? 0) + 1;
    return c;
  }, [reviews]);

  const filtered = useMemo(
    () => (rating === 0 ? reviews : reviews.filter((r) => r.rating === rating)),
    [reviews, rating],
  );
  const shown = filtered.slice(0, visible);
  const remaining = Math.max(0, filtered.length - shown.length);

  return (
    <section aria-labelledby="reviews-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-heading" className="font-display text-lg font-semibold">
          Avaliações
        </h2>
        {reviews.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {reviews.length} avaliação(ões)
          </span>
        ) : null}
      </div>
      {reviews.length > 0 ? (
        <div className="mb-3">
          <RatingFilter
            value={rating}
            onChange={(v) => { setRating(v); setVisible(PAGE_SIZE); }}
            counts={counts}
          />
        </div>
      ) : null}
      {user ? (
        <div className="mb-4">
          <ReviewForm companyId={companyId} userId={user.id} onSubmitted={onReviewSubmitted} />
        </div>
      ) : (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
          <Link to="/auth" className="font-semibold text-primary hover:underline">
            Entre
          </Link>{" "}
          para deixar sua avaliação.
        </div>
      )}
      {reviews.length === 0 ? (
        <NoReviews
          title="Seja o primeiro a avaliar"
          description="Esta empresa ainda não recebeu avaliações."
        />
      ) : (
        <>
          <ol className="space-y-3" aria-label="Lista de avaliações">
            {shown.map((r) => (
              <li key={r.id}>
                <article className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-center gap-2">
                    <RatingStars value={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">— Avaliação anônima</p>
                    <ReportReviewDialog reviewId={r.id} />
                  </div>
                  {r.owner_reply ? (
                    <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary">
                          Resposta do proprietário
                        </span>
                        {r.owner_reply_at ? (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.owner_reply_at).toLocaleDateString("pt-BR")}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm">{r.owner_reply}</p>
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
          {remaining > 0 ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Ver mais {Math.min(PAGE_SIZE, remaining)} de {remaining} restantes
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
