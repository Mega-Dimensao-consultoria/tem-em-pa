import { createFileRoute, notFound } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_PAGE_SIZE,
  fetchAll,
  renderSitemap,
  sitemapClient,
  type SitemapEntry,
} from "@/lib/sitemap";

/** Sitemap paginado de empresas aprovadas indexáveis. */
export const Route = createFileRoute("/sitemap-companies/$page.xml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const pageNum = Number.parseInt(params.page, 10);
        if (!Number.isFinite(pageNum) || pageNum < 1) throw notFound();

        const sb = sitemapClient();
        const offset = (pageNum - 1) * SITEMAP_PAGE_SIZE;

        const rows = await fetchAll<{
          slug: string | null;
          updated_at: string | null;
          cities: { slug: string | null; is_active: boolean | null; noindex: boolean | null } | null;
        }>(async (from, to) => {
          const absFrom = offset + from;
          const absTo = offset + to;
          if (absFrom >= offset + SITEMAP_PAGE_SIZE) return { data: [], error: null };
          const cappedTo = Math.min(absTo, offset + SITEMAP_PAGE_SIZE - 1);
          const res = await sb
            .from("companies")
            .select("slug, updated_at, cities:city_id(slug, is_active, noindex)")
            .eq("status", "approved")
            .or("noindex.is.null,noindex.eq.false")
            .order("id", { ascending: true })
            .range(absFrom, cappedTo);
          return { data: res.data as unknown as typeof rows | null, error: res.error };
        });

        const entries: SitemapEntry[] = [];
        for (const row of rows) {
          const citySlug = row.cities?.slug;
          if (!citySlug || !row.slug) continue;
          if (row.cities?.is_active === false) continue;
          if (row.cities?.noindex === true) continue;
          entries.push({
            path: `/${citySlug}/empresa/${row.slug}`,
            lastmod: row.updated_at
              ? new Date(row.updated_at).toISOString().slice(0, 10)
              : undefined,
            changefreq: "weekly",
            priority: "0.7",
          });
        }

        return renderSitemap(entries);
      },
    },
  },
});
