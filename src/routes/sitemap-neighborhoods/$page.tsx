import { createFileRoute, notFound } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_PAGE_SIZE,
  renderSitemap,
  sitemapClient,
  type SitemapEntry,
} from "@/lib/sitemap";

/** Sitemap paginado de bairros ativos. */
export const Route = createFileRoute("/sitemap-neighborhoods/$page")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const pageNum = Number.parseInt(params.page, 10);
        if (!Number.isFinite(pageNum) || pageNum < 1) throw notFound();

        const sb = sitemapClient();
        const offset = (pageNum - 1) * SITEMAP_PAGE_SIZE;

        const { data, error } = await (
          sb.rpc as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{
            data: Array<{ slug: string; city_slug: string }> | null;
            error: { message: string } | null;
          }>
        )("sitemap_neighborhoods_page", { _offset: offset, _limit: SITEMAP_PAGE_SIZE });
        if (error) throw new Error(error.message);

        const seen = new Set<string>();
        const entries: SitemapEntry[] = [];
        for (const row of data ?? []) {
          const key = `${row.city_slug}/${row.slug}`;
          if (seen.has(key)) continue;
          seen.add(key);
          entries.push({
            path: `/${row.city_slug}/bairro/${row.slug}`,
            changefreq: "weekly",
            priority: "0.6",
          });
        }

        return renderSitemap(entries);
      },
    },
  },
});
