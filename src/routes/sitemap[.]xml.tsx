import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_PAGE_SIZE,
  CITIES_PER_SITEMAP_PAGE,
  getSitemapCounts,
  renderSitemapIndex,
} from "@/lib/sitemap";

/**
 * Sitemap index — enumera todos os sub-sitemaps do site.
 * Cada sub-sitemap tem no máximo 40k URLs (limite do Google é 50k).
 * As páginas são calculadas em tempo real: quando novos dados são inseridos,
 * o índice cresce sozinho e novos sub-sitemaps ficam disponíveis.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { companyCount, neighborhoodCount, cityCount } =
          await getSitemapCounts();

        const children: { path: string }[] = [{ path: "/sitemap-main.xml" }];

        const cityPages = Math.max(1, Math.ceil(cityCount / CITIES_PER_SITEMAP_PAGE));
        for (let i = 1; i <= cityPages; i += 1) {
          children.push({ path: `/sitemap-cities/${i}` });
        }

        const companyPages = Math.max(1, Math.ceil(companyCount / SITEMAP_PAGE_SIZE));
        for (let i = 1; i <= companyPages; i += 1) {
          children.push({ path: `/sitemap-companies/${i}` });
        }

        const hoodPages = Math.max(1, Math.ceil(neighborhoodCount / SITEMAP_PAGE_SIZE));
        for (let i = 1; i <= hoodPages; i += 1) {
          children.push({ path: `/sitemap-neighborhoods/${i}` });
        }

        return renderSitemapIndex(children);
      },
    },
  },
});
