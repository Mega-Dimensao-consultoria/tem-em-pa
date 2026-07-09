import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { getCompanySlugPathById } from "@/features/companies/functions";
import { supabase } from "@/integrations/supabase/client";
import { CompanyDetailSkeleton } from "@/components/feedback/Skeletons";

/**
 * Legacy URL /empresa/{uuid}. Resolves the company's canonical
 * /{citySlug}/empresa/{compSlug} URL and redirects.
 *
 * The server-side lookup uses the anon client, so pending companies
 * (invisible to anon via RLS) fall through to a client-side lookup
 * that runs with the current session — this lets owners and admins
 * open the canonical URL for their own pending records.
 */
export const Route = createFileRoute("/empresa/$id")({
  beforeLoad: async ({ params }) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    if (!isUuid) return;
    let path: { citySlug: string; compSlug: string } | null = null;
    try {
      path = await getCompanySlugPathById({ data: { id: params.id } });
    } catch {
      return;
    }
    if (path) {
      throw redirect({
        to: "/$citySlug/empresa/$compSlug",
        params: { citySlug: path.citySlug, compSlug: path.compSlug },
        replace: true,
      });
    }
  },
  component: LegacyEmpresaFallback,
});

function LegacyEmpresaFallback() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("slug, cities:city_id(slug)")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      const row = data as { slug: string | null; cities: { slug: string | null } | null } | null;
      if (row?.slug && row.cities?.slug) {
        navigate({
          to: "/$citySlug/empresa/$compSlug",
          params: { citySlug: row.cities.slug, compSlug: row.slug },
          replace: true,
        });
      } else {
        setNotFound(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (!notFound) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <CompanyDetailSkeleton />
        </div>
      </PageShell>
    );
  }

  return (
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
  );
}
