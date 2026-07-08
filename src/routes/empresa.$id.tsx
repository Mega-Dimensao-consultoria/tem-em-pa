import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { getCompanySlugPathById } from "@/features/companies/functions";

/**
 * Legacy URL /empresa/{uuid}. Resolves the company's canonical
 * /{citySlug}/empresa/{compSlug} URL and redirects.
 */
export const Route = createFileRoute("/empresa/$id")({
  beforeLoad: async ({ params }) => {
    // UUID guard — if someone hits a non-uuid, fall through to the not-found component.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    if (!isUuid) return;
    let path: { citySlug: string; compSlug: string } | null = null;
    try {
      path = await getCompanySlugPathById({ data: { id: params.id } });
    } catch {
      // Swallow only lookup/network errors; render the fallback component.
      return;
    }
    if (path) {
      // Throw the redirect OUTSIDE the try/catch — TanStack redirects are Response
      // instances, not plain errors, and a try/catch here would swallow them.
      throw redirect({
        to: "/$citySlug/empresa/$compSlug",
        params: { citySlug: path.citySlug, compSlug: path.compSlug },
        replace: true,
      });
    }
  },
  component: () => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Empresa não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço mudou ou a empresa não está mais disponível.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Ver todas as cidades</Link>
        </Button>
      </div>
    </PageShell>
  ),
});
