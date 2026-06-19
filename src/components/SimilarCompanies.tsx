import { useQuery } from "@tanstack/react-query";
import { listSimilarCompanies } from "@/lib/companies.functions";
import { CompanyCard } from "./CompanyCard";

type Props = {
  id: string;
  categoryId: string | null | undefined;
  neighborhood: string | null | undefined;
};

export function SimilarCompanies({ id, categoryId, neighborhood }: Props) {
  const { data } = useQuery({
    queryKey: ["similar-companies", id, categoryId, neighborhood],
    queryFn: () =>
      listSimilarCompanies({
        data: { id, categoryId: categoryId ?? null, neighborhood: neighborhood ?? null },
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
        <span className="text-xs text-muted-foreground">Mesma categoria{neighborhood ? ` · priorizando ${neighborhood}` : ""}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c: any) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>
    </section>
  );
}
