import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://pousoalegre.megadimensao.com.br";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function slugifyNeighborhood(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
          { path: "/eventos", changefreq: "daily", priority: "0.8" },
          { path: "/sobre", changefreq: "monthly", priority: "0.5" },
          { path: "/contato", changefreq: "monthly", priority: "0.5" },
          { path: "/termos", changefreq: "yearly", priority: "0.3" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
        ];

        const nowIso = new Date().toISOString();
        const [cats, companies, events, hoods] = await Promise.all([
          sb.from("categories").select("slug"),
          sb
            .from("companies")
            .select("id, updated_at, neighborhood")
            .eq("status", "approved")
            .limit(5000),
          sb
            .from("city_events")
            .select("id, updated_at, starts_at")
            .eq("is_active", true)
            .gte("starts_at", nowIso)
            .limit(2000),
          sb
            .from("companies")
            .select("neighborhood")
            .eq("status", "approved")
            .not("neighborhood", "is", null)
            .limit(5000),
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
        for (const e of events.data ?? []) {
          entries.push({
            path: `/eventos/${e.id}`,
            lastmod: e.updated_at ? new Date(e.updated_at).toISOString().slice(0, 10) : undefined,
            changefreq: "daily",
            priority: "0.6",
          });
        }
        const slugs = new Set<string>();
        for (const row of hoods.data ?? []) {
          const n = (row.neighborhood ?? "").trim();
          if (!n) continue;
          const s = slugifyNeighborhood(n);
          if (s) slugs.add(s);
        }
        for (const s of slugs) {
          entries.push({ path: `/bairro/${s}`, changefreq: "weekly", priority: "0.6" });
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
