import { createFileRoute, notFound } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  SITEMAP_PAGE_SIZE,
  fetchAll,
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

        type Row = {
          slug: string | null;
          cities: { slug: string | null; is_active: boolean | null; noindex: boolean | null } | null;
        };
        const rows = await fetchAll<Row>(async (from, to) => {
          const absFrom = offset + from;
          const absTo = offset + to;
          if (absFrom >= offset + SITEMAP_PAGE_SIZE) return { data: [], error: null };
          const cappedTo = Math.min(absTo, offset + SITEMAP_PAGE_SIZE - 1);
          const res = await sb
            .from("neighborhoods")
            .select("slug, cities:city_id(slug, is_active, noindex)")
            .eq("is_active", true)
            .order("id", { ascending: true })
            .range(absFrom, cappedTo);
          return { data: res.data as unknown as Row[] | null, error: res.error };
        });

        const seen = new Set<string>();
        const entries: SitemapEntry[] = [];
        for (const row of rows) {
          const s = row.cities?.slug;
          const b = row.slug;
          if (!s || !b) continue;
          if (row.cities?.is_active === false) continue;
          if (row.cities?.noindex === true) continue;
          const key = `${s}/${b}`;
          if (seen.has(key)) continue;
          seen.add(key);
          entries.push({ path: `/${s}/bairro/${b}`, changefreq: "weekly", priority: "0.6" });
        }

        return renderSitemap(entries);
      },
    },
  },
});
