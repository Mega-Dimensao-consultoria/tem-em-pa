import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Clock, Pencil } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SimilarCompanies } from "@/components/SimilarCompanies";
import { HoursBlock } from "@/components/company/HoursBlock";
import { CompanyContactCard } from "@/components/company/CompanyContactCard";
import { CompanyReviewsSection } from "@/components/company/CompanyReviewsSection";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { CompanyGalleryBlock } from "@/components/company/CompanyGalleryBlock";
import { CompanyProductsBlock } from "@/components/company/CompanyProductsBlock";
import { CompanyMapCard } from "@/components/company/CompanyMapCard";
import { buildCompanyHead } from "@/components/company/buildCompanyHead";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/track";
import { queryKeys } from "@/lib/queryKeys";
import {
  publicCompanyQO,
  privateCompanyQO,
} from "@/hooks/queries/useCompanyDetail";
import { getCompanyContact } from "@/lib/companies/contact.functions";

export const Route = createFileRoute("/empresa/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(publicCompanyQO(params.id)),
  head: ({ loaderData, params }) => buildCompanyHead(loaderData, params.id),
  component: CompanyPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Empresa não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta empresa não existe ou ainda não foi aprovada.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar para a home</Link>
        </Button>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Erro ao carregar empresa</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PageShell>
  ),
});

function CompanyPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const { data: publicCompany } = useSuspenseQuery(publicCompanyQO(id));

  const { data: privateCompany, isLoading: privateLoading } = useQuery({
    ...privateCompanyQO(id),
    enabled: !publicCompany && !authLoading && !!user,
  });

  const company = publicCompany ?? privateCompany;

  const isOwner = !!user && !!company && company.owner_id === user.id;
  const isPending = !!company && company.status !== "approved";

  useEffect(() => {
    if (company && !isPending && !isOwner && publicCompany) {
      trackEvent(publicCompany.id, "view");
    }
  }, [company, isPending, isOwner, publicCompany]);

  if (!company) {
    if (!publicCompany && (authLoading || (user && privateLoading))) {
      return (
        <PageShell>
          <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
        </PageShell>
      );
    }
    throw notFound();
  }

  const avg =
    company.reviews.length > 0
      ? company.reviews.reduce((s, r) => s + r.rating, 0) / company.reviews.length
      : 0;
  const canClaim = !company.owner_id && !isPending;
  const fullAddress = [
    company.address,
    company.number,
    company.neighborhood,
    company.city,
    company.state,
  ]
    .filter(Boolean)
    .join(", ");

  const gallery = ((company as any).gallery_urls as string[] | null) ?? [];

  return (
    <PageShell>
      {isPending ? (
        <div className="bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <p className="flex-1">
              <strong>Aguardando aprovação.</strong> Esta página está visível somente
              para você. Após a análise do nosso time, ela será publicada.
            </p>
            {isOwner ? (
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link to="/owner/empresa/$id/produtos" params={{ id: company.id }}>
                  <Pencil className="mr-1 h-3 w-3" />
                  Gerenciar
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative h-48 w-full overflow-hidden bg-muted md:h-72">
        {company.cover_url ? (
          <img
            src={company.cover_url}
            alt={company.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-hero-gradient opacity-90" />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <div className="pt-4">
          <Breadcrumbs
            items={[
              ...(company.categories?.name
                ? [
                    {
                      label: company.categories.name,
                      to: `/categoria/${(company.categories as any).slug}`,
                    },
                  ]
                : [{ label: "Empresas", to: "/buscar" }]),
              { label: company.name },
            ]}
          />
        </div>

        <CompanyHeader
          company={company as any}
          avg={avg}
          reviewsCount={company.reviews.length}
          isPending={isPending}
          canClaim={canClaim}
          user={user}
        />

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {company.description ? (
              <section>
                <h2 className="mb-2 font-display text-lg font-semibold">Sobre</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {company.description}
                </p>
              </section>
            ) : null}

            <CompanyGalleryBlock urls={gallery} />
            <CompanyProductsBlock products={company.products as any} />

            {!isPending ? (
              <CompanyReviewsSection
                companyId={company.id}
                reviews={company.reviews as any}
                user={user}
                onReviewSubmitted={() =>
                  qc.invalidateQueries({ queryKey: queryKeys.companies.public(id) })
                }
              />
            ) : null}
          </div>

          <aside className="space-y-4">
            <CompanyContactCard
              company={company as any}
              fullAddress={fullAddress}
              isPending={isPending}
            />
            <HoursBlock hours={(company as any).hours} />
            <CompanyMapCard
              companyId={company.id}
              name={company.name}
              lat={(company as any).lat ?? null}
              lng={(company as any).lng ?? null}
              address={fullAddress}
              isPending={isPending}
            />
          </aside>
        </div>

        {!isPending ? (
          <SimilarCompanies
            id={company.id}
            categoryId={(company as any).category_id}
            neighborhood={company.neighborhood}
          />
        ) : null}

        <div className="h-16" />
      </div>
    </PageShell>
  );
}
