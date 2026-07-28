import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  fetchAll,
  renderSitemap,
  sitemapClient,
  type SitemapEntry,
} from "@/lib/sitemap";

/** Páginas estáticas + cidades + categorias + bairros (índice) + blog + eventos. */
export const Route = createFileRoute("/sitemap-main.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = sitemapClient();
        const nowIso = new Date().toISOString();

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/buscar", changefreq: "daily", priority: "0.8" },
          { path: "/blog", changefreq: "daily", priority: "0.8" },
          { path: "/sobre", changefreq: "monthly", priority: "0.5" },
          { path: "/contato", changefreq: "monthly", priority: "0.5" },
          { path: "/termos", changefreq: "yearly", priority: "0.3" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
        ];

        const [cats, cities, blogCats, blogPosts, events] = await Promise.all([
          sb
            .from("categories")
            .select("slug, noindex")
            .or("noindex.is.null,noindex.eq.false"),
          sb
            .from("cities")
            .select("slug, noindex")
            .eq("is_active", true)
            .or("noindex.is.null,noindex.eq.false"),
          sb
            .from("blog_categories")
            .select("slug, noindex")
            .eq("is_active", true)
            .or("noindex.is.null,noindex.eq.false"),
          sb
            .from("blog_posts")
            .select("slug, updated_at, noindex")
            .eq("status", "published")
            .eq("noindex", false)
            .lte("published_at", nowIso)
            .limit(5000),
          sb
            .from("city_events")
            .select("id, updated_at, starts_at, noindex")
            .eq("is_active", true)
            .or("noindex.is.null,noindex.eq.false")
            .gte("starts_at", nowIso)
            .limit(5000),
        ]);

        for (const row of (cities.data ?? []) as Array<{ slug: string | null }>) {
          const s = row.slug;
          if (!s) continue;
          entries.push({ path: `/${s}`, changefreq: "daily", priority: "0.9" });
          entries.push({ path: `/${s}/buscar`, changefreq: "daily", priority: "0.8" });
          entries.push({ path: `/${s}/eventos`, changefreq: "daily", priority: "0.7" });
          for (const cat of (cats.data ?? []) as Array<{ slug: string | null }>) {
            if (!cat.slug) continue;
            entries.push({
              path: `/${s}/categoria/${cat.slug}`,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        }

        for (const row of (blogCats.data ?? []) as Array<{ slug: string | null }>) {
          if (!row.slug) continue;
          entries.push({
            path: `/blog/categoria/${row.slug}`,
            changefreq: "weekly",
            priority: "0.6",
          });
        }
        for (const row of (blogPosts.data ?? []) as Array<{
          slug: string | null;
          updated_at: string | null;
        }>) {
          if (!row.slug) continue;
          entries.push({
            path: `/blog/${row.slug}`,
            lastmod: row.updated_at
              ? new Date(row.updated_at).toISOString().slice(0, 10)
              : undefined,
            changefreq: "monthly",
            priority: "0.7",
          });
        }
        for (const e of (events.data ?? []) as Array<{
          id: string;
          updated_at: string | null;
        }>) {
          entries.push({
            path: `/eventos/${e.id}`,
            lastmod: e.updated_at
              ? new Date(e.updated_at).toISOString().slice(0, 10)
              : undefined,
            changefreq: "daily",
            priority: "0.6",
          });
        }

        // Silencia lint de `fetchAll` não usado neste arquivo.
        void fetchAll;

        return renderSitemap(entries);
      },
    },
  },
});
