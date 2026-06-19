import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { RatingStars } from "@/components/RatingStars";
import { getCompanyById } from "@/lib/companies.functions";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Globe, Mail, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ReviewForm } from "@/components/ReviewForm";
import { ClaimDialog } from "@/components/ClaimDialog";

const qo = (id: string) =>
  queryOptions({
    queryKey: ["company", id],
    queryFn: async () => {
      const r = await getCompanyById({ data: { id } });
      if (!r) throw notFound();
      return r;
    },
  });

export const Route = createFileRoute("/empresa/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(qo(params.id)),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Empresa"} — Tem em P.A` },
      { name: "description", content: loaderData?.description ?? "Empresa em Pouso Alegre/MG" },
      { property: "og:title", content: `${loaderData?.name ?? "Empresa"} — Tem em P.A` },
      { property: "og:description", content: loaderData?.description ?? "Empresa em Pouso Alegre/MG" },
      ...(loaderData?.cover_url ? [{ property: "og:image", content: loaderData.cover_url }] : []),
    ],
  }),
  component: CompanyPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Empresa não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta empresa não existe ou ainda não foi aprovada.</p>
        <Button asChild className="mt-6"><Link to="/">Voltar para a home</Link></Button>
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
  const { data: company } = useSuspenseQuery(qo(id));
  const { user } = useAuth();
  const qc = useQueryClient();
  const avg =
    company.reviews.length > 0
      ? company.reviews.reduce((s, r) => s + r.rating, 0) / company.reviews.length
      : 0;
  const canClaim = !company.owner_id;
  const fullAddress = [company.address, company.number, company.neighborhood, company.city, company.state]
    .filter(Boolean)
    .join(", ");
  const mapsQuery = encodeURIComponent(fullAddress || company.name);

  return (
    <PageShell>
      {/* Capa */}
      <div className="relative h-48 w-full overflow-hidden bg-muted md:h-72">
        {company.cover_url ? (
          <img src={company.cover_url} alt={company.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-hero-gradient opacity-90" />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4">
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
              <span>{avg > 0 ? avg.toFixed(1) : "Sem avaliações"} · {company.reviews.length} avaliação(ões)</span>
            </div>
          </div>
          {canClaim && user ? (
            <ClaimDialog companyId={company.id} userId={user.id} />
          ) : canClaim && !user ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/auth">Entrar para reivindicar</Link>
            </Button>
          ) : null}
        </div>

        {/* Conteúdo */}
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {company.description ? (
              <section>
                <h2 className="mb-2 font-display text-lg font-semibold">Sobre</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{company.description}</p>
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
                    <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                      {p.image_url_1 ? (
                        <img src={p.image_url_1} alt={p.name} className="aspect-video w-full object-cover" />
                      ) : null}
                      <div className="p-3">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.price != null ? (
                          <p className="text-sm font-bold text-primary">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.price))}
                          </p>
                        ) : null}
                        {p.description ? <p className="mt-1 text-xs text-muted-foreground">{p.description}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Avaliações</h2>
              {user ? (
                <div className="mb-4">
                  <ReviewForm
                    companyId={company.id}
                    userId={user.id}
                    onSubmitted={() => qc.invalidateQueries({ queryKey: ["company", id] })}
                  />
                </div>
              ) : (
                <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
                  <Link to="/auth" className="font-semibold text-primary hover:underline">Entre</Link>{" "}
                  para deixar sua avaliação.
                </div>
              )}
              {company.reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                  Seja o primeiro a avaliar esta empresa.
                </div>
              ) : (
                <div className="space-y-3">
                  {company.reviews.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                      <div className="flex items-center gap-2">
                        <RatingStars value={r.rating} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">— Avaliação anônima</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>


          {/* Aside */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="mb-3 font-display text-base font-semibold">Contato</h3>
              <ul className="space-y-2 text-sm">
                {fullAddress ? (
                  <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /><span>{fullAddress}</span></li>
                ) : null}
                {company.phone ? (
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${company.phone}`} className="hover:underline">{company.phone}</a></li>
                ) : null}
                {company.whatsapp ? (
                  <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /><a href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:underline">{company.whatsapp}</a></li>
                ) : null}
                {company.email ? (
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${company.email}`} className="hover:underline">{company.email}</a></li>
                ) : null}
                {company.website ? (
                  <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /><a href={company.website} target="_blank" rel="noreferrer" className="hover:underline">{company.website}</a></li>
                ) : null}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="aspect-square w-full bg-muted">
                {fullAddress ? (
                  <iframe
                    title="Mapa"
                    src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
                    className="h-full w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Endereço não informado</div>
                )}
              </div>
              <div className="p-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
                >
                  Como chegar
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="h-16" />
      </div>
    </PageShell>
  );
}
