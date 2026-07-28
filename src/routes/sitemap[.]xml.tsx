import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_PAGE_SIZE,
  getSitemapCounts,
  renderSitemapIndex,
} from "@/lib/sitemap";

/**
 * Sitemap index — enumera todos os sub-sitemaps do site.
 * O Google limita cada sitemap a 50k URLs; usamos 40k por segurança.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { companyCount, neighborhoodCount } = await getSitemapCounts();

        const children: { path: string }[] = [{ path: "/sitemap-main.xml" }];

        const companyPages = Math.max(
          1,
          Math.ceil(companyCount / SITEMAP_PAGE_SIZE),
        );
        for (let i = 1; i <= companyPages; i += 1) {
          children.push({ path: `/sitemap-companies/${i}` });
        }

        const hoodPages = Math.max(
          1,
          Math.ceil(neighborhoodCount / SITEMAP_PAGE_SIZE),
        );
        for (let i = 1; i <= hoodPages; i += 1) {
          children.push({ path: `/sitemap-neighborhoods/${i}` });
        }

        return renderSitemapIndex(children);
      },
    },
  },
});
