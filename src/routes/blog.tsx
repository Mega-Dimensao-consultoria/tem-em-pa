import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tem na cidade" },
    ],
    links: [],
  }),
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}

export const BLOG_BASE_URL = `${SITE_URL}/blog`;
