import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { RatingStars } from "@/components/RatingStars";
import { getCompanyById } from "@/lib/companies.functions";
import { Button } from "@/components/ui/button";
import { Clock, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ClaimDialog } from "@/components/ClaimDialog";
import { supabase } from "@/integrations/supabase/client";
import { CompanyMap } from "@/components/CompanyMap";
import { trackEvent } from "@/lib/track";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { SimilarCompanies } from "@/components/SimilarCompanies";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { HoursBlock } from "@/components/company/HoursBlock";
import { CompanyContactCard } from "@/components/company/CompanyContactCard";
import { CompanyReviewsSection } from "@/components/company/CompanyReviewsSection";
import { buildCompanyHead } from "@/components/company/buildCompanyHead";

type CompanyData = NonNullable<Awaited<ReturnType<typeof getCompanyById>>>;

const publicQo = (id: string) =>
  queryOptions({
    queryKey: ["company-public", id],
    queryFn: () => getCompanyById({ data: { id } }),
  });

const privateQo = (id: string) =>
  queryOptions({
    queryKey: ["company-private", id],
    queryFn: async (): Promise<CompanyData | null> => {
      const { data: company, error } = await supabase
        .from("companies")
        .select(
          "id, name, description, cep, address, number, complement, neighborhood, city, state, lat, lng, phone, whatsapp, email, website, instagram_url, facebook_url, hours, gallery_urls, logo_url, cover_url, status, owner_id, is_featured, category_id, categories:category_id(name, slug, icon)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!company) return null;
      const [products, reviews] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, image_url_1, image_url_2")
          .eq("company_id", id)
          .eq("is_active", true),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, owner_reply, owner_reply_at")
          .eq("company_id", id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      return {
        ...(company as unknown as CompanyData),
        products: products.data ?? [],
        reviews: reviews.data ?? [],
      } as CompanyData;
    },
  });

export const Route = createFileRoute("/empresa/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(publicQo(params.id)),
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
  const { data: publicCompany } = useSuspenseQuery(publicQo(id));

  // Fallback for owner/admin viewing pending companies (not public)
  const { data: privateCompany, isLoading: privateLoading } = useQuery({
    ...privateQo(id),
    enabled: !publicCompany && !authLoading && !!user,
  });

  const company = publicCompany ?? privateCompany;

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
  const isOwner = !!user && company.owner_id === user.id;
  const isPending = company.status !== "approved";
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

  useEffect(() => {
    if (!isPending && !isOwner && publicCompany) {
      trackEvent(publicCompany.id, "view");
    }
  }, [isPending, isOwner, publicCompany]);
  const mapsQuery = encodeURIComponent(fullAddress || company.name);
  const gallery = ((company as any).gallery_urls as string[] | null) ?? [];

  return (
    <PageShell>
      {isPending ? (
        <div className="bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <p className="flex-1">
              <strong>Aguardando aprovação.</strong> Esta página está visível somente para você. Após a análise do nosso time, ela será publicada.
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

      {/* Capa */}
      <div className="relative h-48 w-full overflow-hidden bg-muted md:h-72">
        {company.cover_url ? (
          <img src={company.cover_url} alt={company.name} className="h-full w-full object-cover" />
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

        {/* Header */}
        <div className="-mt-12 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:flex-row md:items-end">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-background">
            {company.logo_url ? (
              <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            {company.categories?.name ? (
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {company.categories.name}
              </span>
            ) : null}
            <h1 className="font-display text-2xl font-bold md:text-3xl">{company.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <RatingStars value={avg} />
              <span>
                {avg > 0 ? avg.toFixed(1) : "Sem avaliações"} · {company.reviews.length} avaliação(ões)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isPending ? <FavoriteButton companyId={company.id} variant="button" /> : null}
            {!isPending ? (
              <ShareButton
                title={company.name}
                text={
                  company.description?.slice(0, 140) ?? `Conheça ${company.name} no Tem em P.A`
                }
              />
            ) : null}
            {canClaim && user ? (
              <ClaimDialog companyId={company.id} userId={user.id} />
            ) : canClaim && !user ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/auth">Entrar para reivindicar</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Conteúdo */}
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

            {gallery.length > 0 ? (
              <section>
                <h2 className="mb-3 font-display text-lg font-semibold">Galeria</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {gallery.map((url, i) => (
                    <a
                      key={url + i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border"
                    >
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Produtos & Serviços</h2>
              {company.products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                  Esta empresa ainda não cadastrou produtos.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.products.map((p) => (
                    <article
                      key={p.id}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
                    >
                      {p.image_url_1 ? (
                        <img
                          src={p.image_url_1}
                          alt={p.name}
                          className="aspect-video w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="p-3">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.price != null ? (
                          <p className="text-sm font-bold text-primary">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(p.price))}
                          </p>
                        ) : null}
                        {p.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {!isPending ? (
              <CompanyReviewsSection
                companyId={company.id}
                reviews={company.reviews as any}
                user={user}
                onReviewSubmitted={() =>
                  qc.invalidateQueries({ queryKey: ["company-public", id] })
                }
              />
            ) : null}
          </div>

          {/* Aside */}
          <aside className="space-y-4">
            <CompanyContactCard
              company={company as any}
              fullAddress={fullAddress}
              isPending={isPending}
            />

            <HoursBlock hours={(company as any).hours} />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <CompanyMap
                lat={(company as any).lat ?? null}
                lng={(company as any).lng ?? null}
                name={company.name}
                address={fullAddress}
                height="h-72"
              />
              <div className="p-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => !isPending && trackEvent(company.id, "maps_click")}
                  className="inline-flex w-full items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
                >
                  Como chegar
                </a>
              </div>
            </div>
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
