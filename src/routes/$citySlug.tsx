import { createFileRoute, Outlet, notFound, Link } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { getCityBySlug } from "@/features/companies/functions";

export const cityBySlugQO = (slug: string) =>
  queryOptions({
    queryKey: ["city", "by-slug", slug],
    queryFn: () => getCityBySlug({ data: { slug } }),
    staleTime: 5 * 60_000,
  });

export const Route = createFileRoute("/$citySlug")({
  loader: async ({ context, params }) => {
    const city = await context.queryClient.ensureQueryData(cityBySlugQO(params.citySlug));
    if (!city) throw notFound();
    return city;
  },
  component: () => <Outlet />,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Cidade não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ainda não temos essa cidade no Tem na minha cidade.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Ver todas as cidades</Link>
        </Button>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Erro ao carregar cidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PageShell>
  ),
});
