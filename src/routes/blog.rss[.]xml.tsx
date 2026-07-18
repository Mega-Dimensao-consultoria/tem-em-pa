import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://www.temnaminhacidade.com.br";
const FEED_URL = `${BASE_URL}/blog/rss.xml`;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const nowIso = new Date().toISOString();
        const { data } = await sb
          .from("blog_posts")
          .select("slug, title, excerpt, content_html, published_at, updated_at, cover_url, noindex")
          .eq("status", "published")
          .eq("noindex", false)
          .lte("published_at", nowIso)
          .order("published_at", { ascending: false })
          .limit(50);

        const posts = data ?? [];
        const lastBuild = posts[0]?.updated_at ?? posts[0]?.published_at ?? nowIso;

        const items = posts
          .map((p) => {
            const url = `${BASE_URL}/blog/${p.slug}`;
            const desc = p.excerpt ?? stripHtml(p.content_html ?? "").slice(0, 320);
            const pub = p.published_at ? new Date(p.published_at).toUTCString() : "";
            return [
              "  <item>",
              `    <title>${escapeXml(p.title ?? "")}</title>`,
              `    <link>${url}</link>`,
              `    <guid isPermaLink="true">${url}</guid>`,
              pub ? `    <pubDate>${pub}</pubDate>` : "",
              `    <description>${escapeXml(desc)}</description>`,
              p.cover_url
                ? `    <enclosure url="${escapeXml(p.cover_url)}" type="image/jpeg" />`
                : "",
              "  </item>",
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
          `<channel>`,
          `  <title>Blog — Tem na minha cidade</title>`,
          `  <link>${BASE_URL}/blog</link>`,
          `  <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />`,
          `  <description>Novidades, dicas para donos de negócio e conteúdo sobre comércio local no Brasil.</description>`,
          `  <language>pt-BR</language>`,
          `  <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>`,
          items,
          `</channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
