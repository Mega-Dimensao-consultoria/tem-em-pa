import { createFileRoute, notFound } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_PAGE_SIZE,
  renderSitemap,
  sitemapClient,
  type SitemapEntry,
} from "@/lib/sitemap";

/** Sitemap paginado de empresas aprovadas indexáveis. */
export const Route = createFileRoute("/sitemap-companies/$page")({
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
            data:
              | Array<{ slug: string; updated_at: string | null; city_slug: string }>
              | null;
            error: { message: string } | null;
          }>
        )("sitemap_companies_page", { _offset: offset, _limit: SITEMAP_PAGE_SIZE });
        if (error) throw new Error(error.message);

        const entries: SitemapEntry[] = (data ?? []).map((row) => ({
          path: `/${row.city_slug}/empresa/${row.slug}`,
          lastmod: row.updated_at
            ? new Date(row.updated_at).toISOString().slice(0, 10)
            : undefined,
          changefreq: "weekly",
          priority: "0.7",
        }));

        return renderSitemap(entries);
      },
    },
  },
});
