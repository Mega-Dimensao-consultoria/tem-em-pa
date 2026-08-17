import { createFileRoute } from "@tanstack/react-router";
import { 
  renderSitemap, 
  sitemapClient, 
  SITEMAP_PAGE_SIZE 
} from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap-products/$page")({
  loader: async ({ params }) => {
    const page = parseInt(params.page, 10);
    if (isNaN(page) || page < 1) return new Response("Invalid page", { status: 400 });

    const sb = sitemapClient();
    const from = (page - 1) * SITEMAP_PAGE_SIZE;
    const to = from + SITEMAP_PAGE_SIZE - 1;

    // Apenas produtos ativos de empresas aprovadas
    const { data, error } = await sb
      .from("products")
      .select("id, created_at, companies!inner(status)")
      .eq("is_active", true)
      .eq("companies.status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const entries = (data || []).map((p) => ({
      path: `/vendas?id=${p.id}`,
      lastmod: p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : undefined,
      changefreq: "weekly" as const,
      priority: "0.6",
    }));

    return renderSitemap(entries);
  },
});
