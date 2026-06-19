import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { isOpenNow } from "@/lib/hours";

type Company = {
  id: string;
  name: string;
  description: string | null;
  neighborhood: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean | null;
  hours?: unknown;
  categories?: { name: string | null } | null;
};

export function CompanyCard({ company }: { company: Company }) {
  const openNow = isOpenNow(company.hours);
  return (
    <Link
      to="/empresa/$id"
      params={{ id: company.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {company.cover_url ? (
          <img src={company.cover_url} alt={company.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-hero-gradient opacity-90" />
        )}
        {company.is_featured ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
            <Star className="h-3 w-3 fill-primary" /> Destaque
          </span>
        ) : null}
        <FavoriteButton companyId={company.id} className="absolute right-3 top-3" />
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
        {company.neighborhood || company.city ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[company.neighborhood, company.city].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
