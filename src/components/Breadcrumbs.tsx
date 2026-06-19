import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li className="flex items-center gap-1">
          <a href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <Home className="h-3 w-3" /> Início
          </a>
        </li>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 opacity-60" />
              {c.to && !last ? (
                <a href={c.to} className="hover:text-foreground">{c.label}</a>
              ) : (
                <span className={last ? "font-medium text-foreground" : ""}>{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function breadcrumbJsonLd(
  baseUrl: string,
  items: { label: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: baseUrl + "/" },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: it.label,
        item: baseUrl + it.path,
      })),
    ],
  };
}
