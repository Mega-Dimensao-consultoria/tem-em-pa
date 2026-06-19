import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { RatingStars } from "@/components/RatingStars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReportReviewDialog } from "@/components/ReportReviewDialog";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  owner_reply?: string | null;
  owner_reply_at?: string | null;
};

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
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Avaliações</h2>
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
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Seja o primeiro a avaliar esta empresa.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
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
          ))}
        </div>
      )}
    </section>
  );
}
