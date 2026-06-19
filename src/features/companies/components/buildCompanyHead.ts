import { breadcrumbJsonLd } from "@/components/Breadcrumbs";

const DAY_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type AnyCompany = Record<string, any> | null | undefined;

export function buildCompanyHead(loaderData: AnyCompany, id: string) {
  const url = `https://tem-em-pa.lovable.app/empresa/${id}`;
  const name = loaderData?.name ?? "Empresa";
  const desc = loaderData?.description ?? "Empresa em Pouso Alegre/MG";
  const img = loaderData?.cover_url ?? loaderData?.logo_url ?? undefined;
  const reviews: Array<{ rating: number }> = loaderData?.reviews ?? [];
  const ratingCount = reviews.length;
  const ratingValue =
    ratingCount > 0
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / ratingCount).toFixed(2))
      : 0;

  const hoursArr = Array.isArray(loaderData?.hours) ? (loaderData.hours as any[]) : [];
  const openingHoursSpecification = hoursArr
    .filter((r) => r && !r.closed && r.open && r.close && typeof r.day === "number")
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
      addressLocality: "Pouso Alegre",
      addressRegion: "MG",
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
  const catName = loaderData?.categories?.name as string | undefined;
  const catSlug = loaderData?.categories?.slug as string | undefined;
  const crumbLd = breadcrumbJsonLd("https://tem-em-pa.lovable.app", [
    ...(catName && catSlug
      ? [{ label: catName, path: `/categoria/${catSlug}` }]
      : [{ label: "Empresas", path: "/buscar" }]),
    { label: name, path: `/empresa/${id}` },
  ]);

  return {
    meta: [
      { title: `${name} — Tem em P.A` },
      { name: "description", content: desc },
      { property: "og:title", content: `${name} — Tem em P.A` },
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
