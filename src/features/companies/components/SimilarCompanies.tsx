import { useQuery } from "@tanstack/react-query";
import { listSimilarCompanies } from "@/features/companies/functions";
import type { NormalizedCompany } from "@/features/companies/functions/_client";
import { CompanyCard } from "./CompanyCard";

type Props = {
  id: string;
  categoryId: string | null | undefined;
  neighborhoodId: string | null | undefined;
  cityId?: string | null;
};

export function SimilarCompanies({ id, categoryId, neighborhoodId, cityId }: Props) {
  const { data } = useQuery<NormalizedCompany[]>({
    queryKey: ["similar-companies", id, categoryId, neighborhoodId, cityId ?? "all"],
    queryFn: () =>
      listSimilarCompanies({
        data: {
          id,
          categoryId: categoryId ?? null,
          neighborhoodId: neighborhoodId ?? null,
          cityId: cityId ?? null,
        },
      }) as unknown as Promise<NormalizedCompany[]>,
    enabled: !!categoryId,
    staleTime: 60_000,
  });

  if (!categoryId) return null;
  const list = data ?? [];
  if (list.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold">Empresas parecidas</h2>
        <span className="text-xs text-muted-foreground">Mesma categoria</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>
    </section>
  );
}
