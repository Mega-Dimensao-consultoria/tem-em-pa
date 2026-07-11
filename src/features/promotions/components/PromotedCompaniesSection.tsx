import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin } from "lucide-react";
import { listPromotedCompanies } from "@/features/companies/functions/featured";

export function PromotedCompaniesSection({
  cityId,
  limit = 10,
  title = "Empresas em destaque",
  subtitle,
}: {
  cityId?: string | null;
  limit?: number;
  title?: string;
  subtitle?: string;
}) {
  const { data = [] } = useQuery({
    queryKey: ["companies", "promoted", cityId ?? "all", limit],
    queryFn: () => listPromotedCompanies({ data: { cityId: cityId ?? null, limit } }),
    staleTime: 60_000,
  });

  if (data.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.map((c) => {
          const linkProps = c.city_slug && c.slug
            ? { to: "/$citySlug/empresa/$compSlug" as const, params: { citySlug: c.city_slug!, compSlug: c.slug! } }
            : { to: "/empresa/$id" as const, params: { id: c.id } };
          return (
            <Link
              key={c.id}
              {...linkProps}
              className="group relative overflow-hidden rounded-xl border border-primary/30 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <div
                className="h-24 w-full bg-cover bg-center"
                style={{
                  backgroundImage: c.cover_url
                    ? `url(${c.cover_url})`
                    : "linear-gradient(135deg,var(--hero-from,#3b82f6),var(--hero-to,#8b5cf6))",
                }}
              />
              <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow">
                Destaque
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt=""
                      className="h-10 w-10 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-sm font-semibold">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[c.neighborhood_name, c.city_name].filter(Boolean).join(" · ") || c.city_name || ""}
                    </div>
                  </div>
                </div>
                {c.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
