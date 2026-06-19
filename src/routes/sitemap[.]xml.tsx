import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://tem-em-pa.lovable.app";

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
          { path: "/buscar", changefreq: "daily", priority: "0.9" },
          { path: "/sobre", changefreq: "monthly", priority: "0.5" },
          { path: "/contato", changefreq: "monthly", priority: "0.5" },
        ];

        const [cats, companies] = await Promise.all([
          sb.from("categories").select("slug"),
          sb.from("companies").select("id, updated_at").eq("status", "approved").limit(5000),
        ]);

        for (const c of cats.data ?? []) {
          entries.push({ path: `/categoria/${c.slug}`, changefreq: "weekly", priority: "0.8" });
        }
        for (const c of companies.data ?? []) {
          entries.push({
            path: `/empresa/${c.id}`,
            lastmod: c.updated_at ? new Date(c.updated_at).toISOString().slice(0, 10) : undefined,
            changefreq: "weekly",
            priority: "0.7",
          });
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
