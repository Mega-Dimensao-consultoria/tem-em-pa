import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { Clock, Pencil } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { SimilarCompanies } from "@/features/companies/components/SimilarCompanies";
import { HoursBlock } from "@/features/companies/components/HoursBlock";
import { CompanyContactCard } from "@/features/companies/components/CompanyContactCard";
import { CompanyReviewsSection } from "@/features/companies/components/CompanyReviewsSection";
import { CompanyHeader } from "@/features/companies/components/CompanyHeader";
import { CompanyGalleryBlock } from "@/features/companies/components/CompanyGalleryBlock";
import { CompanyProductsBlock } from "@/features/companies/components/CompanyProductsBlock";
import { CompanyMapCard } from "@/features/companies/components/CompanyMapCard";
import { CompanyEventsBlock } from "@/features/events/components/CompanyEventsBlock";
import { QrCodeCard } from "@/components/QrCodeCard";
import { buildCompanyHead } from "@/features/companies/components/buildCompanyHead";
import { useAuth, useRoles } from "@/features/auth/use-auth";
import { trackEvent } from "@/lib/track";
import { getCompanyBySlug } from "@/features/companies/functions";
import { getCompanyContact } from "@/features/companies/functions/contact";
import { CompanyDetailSkeleton } from "@/components/feedback/Skeletons";
import { supabase } from "@/integrations/supabase/client";
import { seoGlobalsServerQO } from "@/features/seo/functions/getGlobals";

type SlugParams = { citySlug: string; compSlug: string };

const publicBySlugQO = (p: SlugParams) =>
  queryOptions({
    queryKey: ["company", "public", "by-slug", p.citySlug, p.compSlug],
    queryFn: () => getCompanyBySlug({ data: p }),
  });

const privateBySlugQO = (p: SlugParams) =>
  queryOptions({
    queryKey: ["company", "private", "by-slug", p.citySlug, p.compSlug],
    queryFn: async () => {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", p.citySlug)
        .maybeSingle();
      if (!city) return null;
      const { data: rawCompany, error } = await supabase
        .from("companies")
        .select(
          "id, name, slug, description, cep, address, number, complement, city_id, neighborhood_id, state, lat, lng, phone, phone_ddd, whatsapp, email, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, categories:category_id(name, slug, icon), cities:city_id(name, slug, state), neighborhoods:neighborhood_id(name, slug)",
        )
        .eq("city_id", city.id)
        .eq("slug", p.compSlug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!rawCompany) return null;
      const row = rawCompany as unknown as {
        cities: { name: string | null; slug: string | null; state: string | null } | null;
        neighborhoods: { name: string | null; slug: string | null } | null;
      } & Record<string, unknown>;
      const flat = {
        ...row,
        city: row.cities?.name ?? null,
        city_slug: row.cities?.slug ?? null,
        neighborhood: row.neighborhoods?.name ?? null,
        neighborhood_slug: row.neighborhoods?.slug ?? null,
      };
      const companyId = (rawCompany as unknown as { id: string }).id;
      const [products, reviews] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, image_url_1, image_url_2")
          .eq("company_id", companyId)
          .eq("is_active", true),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, owner_reply, owner_reply_at, photos")
          .eq("company_id", companyId)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      return {
        ...(flat as unknown as Record<string, unknown>),
        products: products.data ?? [],
        reviews: reviews.data ?? [],
      };
    },
  });

export const Route = createFileRoute("/$citySlug/empresa/$compSlug")({
  loader: async ({ context, params }) => {
    const [company, globals] = await Promise.all([
      context.queryClient.ensureQueryData(publicBySlugQO(params)),
      context.queryClient.ensureQueryData(seoGlobalsServerQO),
    ]);
    return { company, globals };
  },
  head: ({ params, loaderData }) =>
    buildCompanyHead(loaderData?.company ?? null, {
      citySlug: params.citySlug,
      compSlug: params.compSlug,
      globals: loaderData?.globals ?? null,
    }),
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
  const params = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useRoles();
  const qc = useQueryClient();
  const { data: publicCompany } = useSuspenseQuery(publicBySlugQO(params));

  const { data: privateCompany, isLoading: privateLoading } = useQuery({
    ...privateBySlugQO(params),
    enabled: !publicCompany && !authLoading && !!user,
  });

  const companyRaw = (publicCompany ?? privateCompany) as
    | (Record<string, unknown> & {
        id: string;
        name: string;
        cover_url: string | null;
        logo_url: string | null;
        description: string | null;
        address: string | null;
        number: string | null;
        neighborhood: string | null;
        city: string | null;
        state: string | null;
        status: string | null;
        owner_id: string | null;
        lat: number | null;
        lng: number | null;
        hours: unknown;
        gallery_urls: string[] | null;
        category_id: string | null;
        neighborhood_id: string | null;
        city_id: string | null;
        categories: { name: string | null; slug: string | null } | null;
        products: unknown[];
        reviews: Array<{ rating: number }>;
      })
    | null
    | undefined;

  const { data: contact } = useQuery({
    queryKey: ["company-contact", companyRaw?.id ?? ""],
    queryFn: () => getCompanyContact({ data: { id: companyRaw!.id } }),
    enabled: !!user && !!publicCompany && !!companyRaw?.id,
    staleTime: 60_000,
  });

  const isOwner = !!user && !!companyRaw && companyRaw.owner_id === user.id;
  const isPending = !!companyRaw && companyRaw.status !== "approved";

  useEffect(() => {
    if (companyRaw && !isPending && !isOwner && publicCompany) {
      trackEvent(companyRaw.id, "view");
    }
  }, [companyRaw, isPending, isOwner, publicCompany]);

  if (!companyRaw) {
    if (!publicCompany && (authLoading || (user && privateLoading))) {
      return (
        <PageShell>
          <div className="mx-auto max-w-5xl px-4 py-8">
            <CompanyDetailSkeleton />
          </div>
        </PageShell>
      );
    }
    throw notFound();
  }

  const company = companyRaw;
  const reviews = (company.reviews ?? []) as Array<{ rating: number }>;
  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const canClaim = !company.owner_id && !isPending;
  const fullAddress = [
    company.address, company.number, company.neighborhood, company.city, company.state,
  ].filter(Boolean).join(", ");
  const gallery = (company.gallery_urls as string[] | null) ?? [];

  return (
    <PageShell>
      {isPending ? (
        <div className="bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <p className="flex-1">
              <strong>Aguardando aprovação.</strong> Esta página está visível somente para você.
            </p>
            {isOwner || isAdmin ? (
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link to="/owner/empresa/$id/editar" params={{ id: company.id }}>
                  <Pencil className="mr-1 h-3 w-3" /> Editar
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-6 max-w-5xl px-4">
        <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-muted md:h-72">
          {company.cover_url ? (
            <img src={company.cover_url} alt={company.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-hero-gradient opacity-90" />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4">


        <CompanyHeader
          company={company}
          avg={avg}
          reviewsCount={reviews.length}
          isPending={isPending}
          canClaim={canClaim}
          user={user}
          canEdit={isOwner || isAdmin}
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
            <CompanyEventsBlock companyId={company.id} />
            <CompanyProductsBlock products={company.products as never} />

            {!isPending ? (
              <CompanyReviewsSection
                companyId={company.id}
                reviews={company.reviews as never}
                user={user}
                onReviewSubmitted={() =>
                  qc.invalidateQueries({ queryKey: publicBySlugQO(params).queryKey })
                }
              />
            ) : null}
          </div>

          <aside className="space-y-4">
            <CompanyContactCard
              company={{ ...(company as unknown as Record<string, unknown>), ...(contact ?? {}) } as never}
              fullAddress={fullAddress}
              isPending={isPending}
            />
            <HoursBlock hours={company.hours} />
            <CompanyMapCard
              companyId={company.id}
              name={company.name}
              lat={company.lat ?? null}
              lng={company.lng ?? null}
              address={fullAddress}
              isPending={isPending}
            />
            {!isPending ? (
              <QrCodeCard
                url={`https://www.temnaminhacidade.com.br/${params.citySlug}/empresa/${params.compSlug}`}
                companyName={company.name}
              />
            ) : null}
          </aside>
        </div>

        {!isPending ? (
          <SimilarCompanies
            id={company.id}
            categoryId={company.category_id}
            neighborhoodId={company.neighborhood_id}
            cityId={company.city_id}
          />
        ) : null}

        <div className="h-16" />
      </div>
    </PageShell>
  );
}
