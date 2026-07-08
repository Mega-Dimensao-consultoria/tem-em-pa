import { breadcrumbJsonLd } from "@/components/Breadcrumbs";

const BASE = "https://temnacidade.com";
const DAY_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type AnyCompany = Record<string, unknown> | null | undefined;
type HoursRow = {
  day?: number;
  open?: string;
  close?: string;
  closed?: boolean;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export type CompanyHeadParams =
  | string /* legacy: company id path only */
  | { citySlug: string; compSlug: string };

export function buildCompanyHead(loaderData: AnyCompany, params: CompanyHeadParams) {
  const isSlug = typeof params === "object";
  const path = isSlug
    ? `/${params.citySlug}/empresa/${params.compSlug}`
    : `/empresa/${params}`;
  const url = `${BASE}${path}`;
  const name = asString(loaderData?.name) ?? "Empresa";
  const cityName = asString(loaderData?.city) ?? "";
  const stateUf = asString(loaderData?.state) ?? "";
  const cityLabel = [cityName, stateUf].filter(Boolean).join("/");
  const desc =
    asString(loaderData?.description) ??
    (cityLabel ? `Empresa em ${cityLabel}` : "Empresa no Tem na cidade");
  const img = asString(loaderData?.cover_url) ?? asString(loaderData?.logo_url);
  const reviews = (Array.isArray(loaderData?.reviews) ? loaderData?.reviews : []) as Array<{
    rating: number;
  }>;
  const ratingCount = reviews.length;
  const ratingValue =
    ratingCount > 0
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / ratingCount).toFixed(2))
      : 0;

  const hoursArr: HoursRow[] = Array.isArray(loaderData?.hours)
    ? (loaderData?.hours as HoursRow[])
    : [];
  const openingHoursSpecification = hoursArr
    .filter(
      (r): r is HoursRow & { day: number; open: string; close: string } =>
        !!r && !r.closed && !!r.open && !!r.close && typeof r.day === "number",
    )
    .map((r) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_MAP[r.day],
      opens: r.open,
      closes: r.close,
    }));

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description: desc,
    url,
    ...(img ? { image: img } : {}),
    ...(loaderData?.phone ? { telephone: loaderData.phone } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: loaderData?.address ?? undefined,
      addressLocality: cityName || undefined,
      addressRegion: stateUf || undefined,
      addressCountry: "BR",
    },
    ...(loaderData?.lat && loaderData?.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: loaderData.lat, longitude: loaderData.lng } }
      : {}),
    ...(ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue,
            reviewCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
  };
  const cat = asRecord(loaderData?.categories);
  const catName = asString(cat?.name);
  const catSlug = asString(cat?.slug);
  const citySlugFromCompany = asString(loaderData?.city_slug);
  const citySlugForCrumb = isSlug ? params.citySlug : citySlugFromCompany;

  const crumbs: { label: string; path: string }[] = [];
  if (citySlugForCrumb && cityName) {
    crumbs.push({ label: cityName, path: `/${citySlugForCrumb}` });
  }
  if (catName && catSlug && citySlugForCrumb) {
    crumbs.push({ label: catName, path: `/${citySlugForCrumb}/categoria/${catSlug}` });
  }
  crumbs.push({ label: name, path });
  const crumbLd = breadcrumbJsonLd(BASE, crumbs);

  return {
    meta: [
      { title: `${name}${cityLabel ? " — " + cityLabel : ""} | Tem na cidade` },
      { name: "description", content: desc },
      { property: "og:title", content: `${name}${cityLabel ? " — " + cityLabel : ""} | Tem na cidade` },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { property: "og:type", content: "business.business" },
      ...(img
        ? [
            { property: "og:image", content: img },
            { name: "twitter:image", content: img },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(ld) },
      { type: "application/ld+json", children: JSON.stringify(crumbLd) },
    ],
  };
}
