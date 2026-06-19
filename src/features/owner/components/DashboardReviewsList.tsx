import { RatingStars } from "@/features/reviews/components/RatingStars";
import { OwnerReplyForm } from "@/features/reviews/components/OwnerReplyForm";
import type { OwnerReview } from "@/features/owner/hooks/useOwnerReviews";

export function DashboardReviewsList({
  reviews,
  onReplied,
}: {
  reviews: OwnerReview[];
  onReplied: () => void;
}) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold">
        Avaliações ({reviews.length})
      </h2>
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Ainda não há avaliações.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RatingStars value={r.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    r.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : "bg-amber-500/15 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {r.comment ? (
                <p className="mt-2 text-sm">{r.comment}</p>
              ) : (
                <p className="mt-2 text-xs italic text-muted-foreground">Sem comentário</p>
              )}
              <OwnerReplyForm
                reviewId={r.id}
                initialReply={r.owner_reply}
                replyAt={r.owner_reply_at}
                onSaved={onReplied}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
