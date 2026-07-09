import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BLOG_PAGE_SIZE, blogQueries, useBlogCategoriesActive } from "@/features/blog/hooks/useBlogPublic";
import { PostCard } from "@/features/blog/components/PostCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { SITE_URL } from "@/lib/site";

const search = z.object({ page: z.coerce.number().int().min(1).max(500).default(1) });

export const Route = createFileRoute("/blog/")({
  validateSearch: search,
  loaderDeps: ({ search: s }) => ({ page: s.page }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(blogQueries.list(deps.page - 1, null)),
      context.queryClient.ensureQueryData(blogQueries.categories()),
    ]);
    return null;
  },
  head: () => ({
    meta: [
      { title: "Blog — Tem na cidade" },
      {
        name: "description",
        content:
          "Dicas, novidades e histórias do comércio local. Explore os melhores conteúdos sobre cidades, empresas e serviços.",
      },
      { property: "og:title", content: "Blog — Tem na cidade" },
      { property: "og:description", content: "Dicas, novidades e histórias do comércio local." },
      { property: "og:url", content: `${SITE_URL}/blog` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
  }),
  component: BlogIndex,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <ErrorState title="Não foi possível carregar o blog" error={error} reset={reset} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <EmptyState title="Blog não encontrado" description="Volte em breve." />
    </div>
  ),
});

function BlogIndex() {
  const { page } = Route.useSearch();
  const { data: list } = useSuspenseQuery(blogQueries.list(page - 1, null));
  const { data: categories = [] } = useBlogCategoriesActive();

  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Blog</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Dicas, novidades e histórias do comércio local. Explore os melhores conteúdos sobre cidades, empresas e serviços.
        </p>
      </header>

      {categories.length > 0 ? (
        <nav aria-label="Categorias do blog" className="mb-8 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Todos
          </span>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/blog/categoria/$slug"
              params={{ slug: c.slug }}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {list.items.length === 0 ? (
        <EmptyState
          title="Nenhum post publicado ainda"
          description="Assim que a equipe publicar novos conteúdos, eles vão aparecer aqui."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              to="/blog"
              search={{ page: page - 1 }}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary/40"
            >
              ← Anterior
            </Link>
          ) : null}
          <span className="rounded-full bg-muted px-4 py-2 text-sm">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              to="/blog"
              search={{ page: page + 1 }}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary/40"
            >
              Próxima →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
