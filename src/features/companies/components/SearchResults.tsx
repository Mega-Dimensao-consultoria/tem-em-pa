import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { NoSearchResults } from "@/components/feedback/EmptyState";
import { CompanyListSkeleton } from "@/components/feedback/Skeletons";

type CardCompany = ComponentProps<typeof CompanyCard>["company"];
type Company = CardCompany & { status: string; owner_id: string | null };

export function SearchResults({
  isLoading,
  approved,
  ownPending,
}: {
  isLoading: boolean;
  approved: Company[];
  ownPending: Company[];
}) {
  return (
    <>
      {ownPending.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
            <Badge variant="secondary">Minhas pendentes</Badge>
            <span className="text-xs">visíveis somente para você</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownPending.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6">
          <CompanyListSkeleton count={6} />
        </div>
      ) : approved.length === 0 ? (
        <div className="mt-8">
          <NoSearchResults />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approved.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </>
  );
}
