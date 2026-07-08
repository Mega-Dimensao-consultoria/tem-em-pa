import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://temnacidade.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/sobre", changefreq: "monthly", priority: "0.5" },
          { path: "/contato", changefreq: "monthly", priority: "0.5" },
          { path: "/termos", changefreq: "yearly", priority: "0.3" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
        ];

        const nowIso = new Date().toISOString();
        const [cities, cats, companies, events, hoods] = await Promise.all([
          sb.from("cities").select("id, slug").eq("is_active", true),
          sb.from("categories").select("slug"),
          sb
            .from("companies")
            .select("id, slug, updated_at, cities:city_id(slug)")
            .eq("status", "approved")
            .limit(5000),
          sb
            .from("city_events")
            .select("id, updated_at, starts_at, cities:city_id(slug)")
            .eq("is_active", true)
            .gte("starts_at", nowIso)
            .limit(2000),
          sb
            .from("neighborhoods")
            .select("slug, cities:city_id(slug)")
            .eq("is_active", true)
            .limit(5000),
        ]);

        const activeCitySlugs = new Set<string>(
          ((cities.data ?? []) as Array<{ slug: string | null }>)
            .map((c) => c.slug)
            .filter((s): s is string => !!s),
        );

        for (const s of activeCitySlugs) {
          entries.push({ path: `/${s}`, changefreq: "daily", priority: "0.9" });
          entries.push({ path: `/${s}/buscar`, changefreq: "daily", priority: "0.8" });
          entries.push({ path: `/${s}/eventos`, changefreq: "daily", priority: "0.7" });
          for (const cat of cats.data ?? []) {
            entries.push({
              path: `/${s}/categoria/${cat.slug}`,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        }

        for (const row of (companies.data ?? []) as Array<{
          id: string;
          slug: string | null;
          updated_at: string | null;
          cities: { slug: string | null } | null;
        }>) {
          const citySlug = row.cities?.slug;
          if (!citySlug || !row.slug) continue;
          entries.push({
            path: `/${citySlug}/empresa/${row.slug}`,
            lastmod: row.updated_at ? new Date(row.updated_at).toISOString().slice(0, 10) : undefined,
            changefreq: "weekly",
            priority: "0.7",
          });
        }

        for (const e of (events.data ?? []) as Array<{
          id: string;
          updated_at: string | null;
        }>) {
          entries.push({
            path: `/eventos/${e.id}`,
            lastmod: e.updated_at ? new Date(e.updated_at).toISOString().slice(0, 10) : undefined,
            changefreq: "daily",
            priority: "0.6",
          });
        }

        const seen = new Set<string>();
        for (const row of (hoods.data ?? []) as Array<{
          slug: string | null;
          cities: { slug: string | null } | null;
        }>) {
          const s = row.cities?.slug;
          const b = row.slug;
          if (!s || !b) continue;
          const key = `${s}/${b}`;
          if (seen.has(key)) continue;
          seen.add(key);
          entries.push({ path: `/${s}/bairro/${b}`, changefreq: "weekly", priority: "0.6" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
