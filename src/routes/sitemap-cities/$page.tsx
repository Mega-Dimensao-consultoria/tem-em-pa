import { createFileRoute, notFound } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  CITIES_PER_SITEMAP_PAGE,
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

        const [citiesRes, catsRes] = await Promise.all([
          (
            sb.rpc as unknown as (
              fn: string,
              args: Record<string, unknown>,
            ) => Promise<{
              data: Array<{ slug: string }> | null;
              error: { message: string } | null;
            }>
          )("sitemap_cities_page", { _offset: offset, _limit: CITIES_PER_SITEMAP_PAGE }),
          sb
            .from("categories")
            .select("slug, noindex")
            .or("noindex.is.null,noindex.eq.false")
            .order("sort_order", { ascending: true }),
        ]);
        if (citiesRes.error) throw new Error(citiesRes.error.message);

        const cats = ((catsRes.data ?? []) as Array<{ slug: string | null }>)
          .map((c) => c.slug)
          .filter((s): s is string => !!s);

        const entries: SitemapEntry[] = [];
        for (const c of citiesRes.data ?? []) {
          const s = c.slug;
          entries.push({ path: `/${s}`, changefreq: "daily", priority: "0.9" });
          entries.push({ path: `/${s}/buscar`, changefreq: "daily", priority: "0.8" });
          entries.push({ path: `/${s}/eventos`, changefreq: "daily", priority: "0.7" });
          for (const cat of cats) {
            entries.push({
              path: `/${s}/categoria/${cat}`,
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
