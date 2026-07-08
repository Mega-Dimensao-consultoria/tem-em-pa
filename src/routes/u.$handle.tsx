import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { UserCircle2, Star } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { usePublicProfile, usePublicProfileReviews } from "@/features/profile/hooks/usePublicProfile";
import { RatingStars } from "@/features/reviews/components/RatingStars";
import { ReviewPhotos } from "@/features/reviews/components/ReviewPhotos";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { ErrorState } from "@/components/feedback/ErrorState";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} — Perfil no Tem na cidade` },
      { name: "description", content: `Perfil público de @${params.handle} com avaliações no diretório Tem na cidade.` },
      { property: "og:title", content: `@${params.handle} — Tem na cidade` },
      { property: "og:description", content: `Avaliações públicas de @${params.handle}.` },
      { property: "og:type", content: "profile" },
    ],
  }),
  errorComponent: () => <ErrorState />,
  notFoundComponent: () => (
    <PageShell>
      <NotFoundState title="Perfil não encontrado" description="Este perfil pode estar privado ou não existir." />
    </PageShell>
  ),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { handle } = Route.useParams();
  const { data: profile, isLoading, error } = usePublicProfile(handle);
  const { data: reviews = [] } = usePublicProfileReviews(handle);

  if (isLoading) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl space-y-4 px-4 py-10">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </section>
      </PageShell>
    );
  }
  if (error) throw error;
  if (!profile) throw notFound();

  const displayName = profile.full_name || `@${profile.handle}`;

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <header className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
          ) : (
            <UserCircle2 className="h-16 w-16 text-muted-foreground" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold">{displayName}</h1>
            <p className="text-xs font-mono text-muted-foreground">@{profile.handle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {profile.review_count} avaliação(ões) pública(s)
            </p>
          </div>
        </header>

        {profile.bio ? (
          <p className="mt-4 whitespace-pre-line rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
            {profile.bio}
          </p>
        ) : null}

        <h2 className="mt-6 mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Star className="h-4 w-4 text-primary" /> Avaliações
        </h2>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
            Nenhuma avaliação pública ainda.
          </p>
        ) : (
          <ol className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <article className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to="/empresa/$id"
                      params={{ id: r.company_id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.company_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="mt-1"><RatingStars value={r.rating} /></div>
                  {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
                  <ReviewPhotos photos={r.photos} />
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PageShell>
  );
}
