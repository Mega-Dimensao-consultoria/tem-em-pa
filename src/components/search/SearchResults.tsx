import { Badge } from "@/components/ui/badge";
import { CompanyCard } from "@/components/CompanyCard";

type Company = { id: string; status: string; owner_id: string | null };

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
              <CompanyCard key={c.id} company={c as any} />
            ))}
          </div>
        </div>
      ) : null}

      {!isLoading && approved.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa encontrada. Tente outros termos ou outra categoria.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approved.map((c) => (
            <CompanyCard key={c.id} company={c as any} />
          ))}
        </div>
      )}
    </>
  );
}
