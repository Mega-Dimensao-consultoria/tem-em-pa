import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";
import { CompanyCard } from "@/components/CompanyCard";
import { searchCompanies } from "@/lib/companies.functions";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  cat: z.string().trim().max(60).optional(),
});

const qo = (q?: string, cat?: string) =>
  queryOptions({
    queryKey: ["search", q ?? "", cat ?? ""],
    queryFn: () => searchCompanies({ data: { q, categorySlug: cat } }),
  });

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, cat: search.cat }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(qo(deps.q, deps.cat)),
  head: () => ({ meta: [{ title: "Buscar — Tem em P.A" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q, cat } = Route.useSearch();
  const { data } = useSuspenseQuery(qo(q, cat));

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <SearchBar defaultValue={q ?? ""} size="md" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          {q ? `Resultados para "${q}"` : "Todas as empresas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.length} encontrada(s)</p>

        {data.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada. Tente outros termos.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => <CompanyCard key={c.id} company={c} />)}
          </div>
        )}
      </section>
    </PageShell>
  );
}
