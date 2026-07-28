import { createFileRoute, notFound } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  CITIES_PER_SITEMAP_PAGE,
  fetchAll,
  renderSitemap,
  sitemapClient,
  type SitemapEntry,
} from "@/lib/sitemap";

/**
 * Sitemap paginado de cidades: hub + busca + eventos + uma URL por categoria
 * para cada cidade ativa e indexável. Fica separado do sitemap-main para não
 * ultrapassar o teto de 50k URLs quando o número de cidades × categorias cresce.
 */
export const Route = createFileRoute("/sitemap-cities/$page")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const pageNum = Number.parseInt(params.page, 10);
        if (!Number.isFinite(pageNum) || pageNum < 1) throw notFound();

        const sb = sitemapClient();
        const offset = (pageNum - 1) * CITIES_PER_SITEMAP_PAGE;

        type CityRow = { slug: string | null };
        const cities = await fetchAll<CityRow>(async (from, to) => {
          const absFrom = offset + from;
          const absTo = offset + to;
          if (absFrom >= offset + CITIES_PER_SITEMAP_PAGE) {
            return { data: [], error: null };
          }
          const cappedTo = Math.min(absTo, offset + CITIES_PER_SITEMAP_PAGE - 1);
          const res = await sb
            .from("cities")
            .select("slug")
            .eq("is_active", true)
            .or("noindex.is.null,noindex.eq.false")
            .order("id", { ascending: true })
            .range(absFrom, cappedTo);
          return { data: res.data as CityRow[] | null, error: res.error };
        });

        const { data: cats } = await sb
          .from("categories")
          .select("slug, noindex")
          .or("noindex.is.null,noindex.eq.false")
          .order("sort_order", { ascending: true });

        const entries: SitemapEntry[] = [];
        for (const c of cities) {
          const s = c.slug;
          if (!s) continue;
          entries.push({ path: `/${s}`, changefreq: "daily", priority: "0.9" });
          entries.push({ path: `/${s}/buscar`, changefreq: "daily", priority: "0.8" });
          entries.push({ path: `/${s}/eventos`, changefreq: "daily", priority: "0.7" });
          for (const cat of (cats ?? []) as Array<{ slug: string | null }>) {
            if (!cat.slug) continue;
            entries.push({
              path: `/${s}/categoria/${cat.slug}`,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        }

        return renderSitemap(entries);
      },
    },
  },
});
