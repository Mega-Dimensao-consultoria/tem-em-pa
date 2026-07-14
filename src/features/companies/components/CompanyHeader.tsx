import type { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/features/reviews/components/RatingStars";
import { FavoriteButton } from "@/features/companies/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { ClaimDialog } from "@/features/claims/components/ClaimDialog";
import { RemovalRequestDialog } from "@/features/companies/components/RemovalRequestDialog";

type Company = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  categories?: { name: string | null } | null;
};

export function CompanyHeader({
  company,
  avg,
  reviewsCount,
  isPending,
  canClaim,
  user,
  canEdit = false,
}: {
  company: Company;
  avg: number;
  reviewsCount: number;
  isPending: boolean;
  canClaim: boolean;
  user: User | null;
  canEdit?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:flex-row md:items-end">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-background">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={`Logotipo de ${company.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
            {company.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1">
        {company.categories?.name ? (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {company.categories.name}
          </span>
        ) : null}
        <h1 className="font-display text-2xl font-bold md:text-3xl">{company.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <RatingStars value={avg} />
          <span>
            {avg > 0 ? avg.toFixed(1) : "Sem avaliações"} · {reviewsCount} avaliação(ões)
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!isPending ? <FavoriteButton companyId={company.id} variant="button" /> : null}
        {!isPending ? (
          <ShareButton
            title={company.name}
            text={
              company.description?.slice(0, 140) ??
              `Conheça ${company.name} no Tem na minha cidade`
            }
          />
        ) : null}
        {canClaim && user ? (
          <ClaimDialog companyId={company.id} userId={user.id} />
        ) : canClaim && !user ? (
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/auth">Entrar para reivindicar</Link>
          </Button>
        ) : null}
        {!isPending ? (
          <RemovalRequestDialog companyId={company.id} userId={user?.id ?? null} />
        ) : null}
      </div>
    </div>
  );
}
