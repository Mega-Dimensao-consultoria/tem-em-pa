import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { isOpenNow } from "@/lib/hours";

type Company = {
  id: string;
  slug?: string | null;
  name: string;
  description: string | null;
  neighborhood: string | null;
  neighborhood_slug?: string | null;
  city: string | null;
  city_slug?: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  hours?: unknown;
  categories?: { name: string | null } | null;
};

export function CompanyCard({ company }: { company: Company }) {
  const openNow = isOpenNow(company.hours);
  const hasCanonical = !!company.city_slug && !!company.slug;
  const linkProps = hasCanonical
    ? ({
        to: "/$citySlug/empresa/$compSlug",
        params: { citySlug: company.city_slug!, compSlug: company.slug! },
      } as const)
    : ({ to: "/empresa/$id", params: { id: company.id } } as const);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant">
      <Link {...linkProps} className="flex flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {company.cover_url ? (
            <img
              src={company.cover_url}
              alt={`Foto de capa da empresa ${company.name}${company.city ? ` em ${company.city}` : ""}`}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-hero-gradient opacity-90" />
          )}
          {company.is_featured ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
              <Star className="h-3 w-3 fill-primary" /> Destaque
            </span>
          ) : null}
          {openNow ? (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Aberto agora
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 p-4">
          {company.categories?.name ? (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {company.categories.name}
            </span>
          ) : null}
          <h3 className="line-clamp-1 text-base font-semibold">{company.name}</h3>
          {company.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{company.description}</p>
          ) : null}
        </div>
      </Link>

      <FavoriteButton companyId={company.id} className="absolute right-3 top-3" />
      {company.neighborhood || company.city ? (
        <div className="border-t border-border/60 px-4 py-2.5">
          {company.city_slug && company.neighborhood_slug ? (
            <Link
              to="/$citySlug/bairro/$bairroSlug"
              params={{ citySlug: company.city_slug, bairroSlug: company.neighborhood_slug }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary"
            >
              <MapPin className="h-3 w-3" />
              {[company.neighborhood, company.city].filter(Boolean).join(" · ")}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[company.neighborhood, company.city].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
