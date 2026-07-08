import { useQuery } from "@tanstack/react-query";
import { listSimilarCompanies } from "@/features/companies/functions";
import { CompanyCard } from "./CompanyCard";

type Props = {
  id: string;
  categoryId: string | null | undefined;
  neighborhoodId: string | null | undefined;
  cityId?: string | null;
};

export function SimilarCompanies({ id, categoryId, neighborhoodId, cityId }: Props) {
  const { data } = useQuery({
    queryKey: ["similar-companies", id, categoryId, neighborhoodId, cityId ?? "all"],
    queryFn: () =>
      listSimilarCompanies({
        data: {
          id,
          categoryId: categoryId ?? null,
          neighborhoodId: neighborhoodId ?? null,
          cityId: cityId ?? null,
        },
      }),
    enabled: !!categoryId,
    staleTime: 60_000,
  });

  if (!categoryId) return null;
  if (!data || data.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold">Empresas parecidas</h2>
        <span className="text-xs text-muted-foreground">Mesma categoria</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <CompanyCard key={(c as { id: string }).id} company={c as never} />
        ))}
      </div>
    </section>
  );
}
