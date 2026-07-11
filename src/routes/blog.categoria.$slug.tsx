import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BLOG_PAGE_SIZE, blogQueries, useBlogCategoriesActive } from "@/features/blog/hooks/useBlogPublic";
import { PostCard } from "@/features/blog/components/PostCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { SITE_URL } from "@/lib/site";

const search = z.object({ page: z.coerce.number().int().min(1).max(500).default(1) });

export const Route = createFileRoute("/blog/categoria/$slug")({
  validateSearch: search,
  loaderDeps: ({ search: s }) => ({ page: s.page }),
  loader: async ({ context, params, deps }) => {
    const cat = await context.queryClient.ensureQueryData(blogQueries.category(params.slug));
    if (!cat) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(blogQueries.list(deps.page - 1, cat.id)),
      context.queryClient.ensureQueryData(blogQueries.categories()),
    ]);
    return { category: cat };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.category?.name ?? "Categoria";
    const description = loaderData?.category?.description ??
      `Todos os posts da categoria ${name} no blog do Tem na minha cidade.`;
    return {
      meta: [
        { title: `${name} — Blog Tem na minha cidade` },
        { name: "description", content: description },
        { property: "og:title", content: `${name} — Blog Tem na minha cidade` },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE_URL}/blog/categoria/${params.slug}` },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/blog/categoria/${params.slug}` }],
    };
  },
  component: BlogCategoryPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <ErrorState error={error} reset={reset} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <NotFoundState
        title="Categoria não encontrada"
        description="A categoria buscada não existe ou está inativa."
      />
    </div>
  ),
});

function BlogCategoryPage() {
  const { slug } = Route.useParams();
  const { page } = Route.useSearch();
  const { category } = Route.useLoaderData();
  const { data: list } = useSuspenseQuery(blogQueries.list(page - 1, category.id));
  const { data: categories = [] } = useBlogCategoriesActive();

  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <Link to="/blog" className="text-xs font-semibold text-primary hover:underline">
          ← Voltar para o blog
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            {category.description}
          </p>
        ) : null}
      </header>

      {categories.length > 0 ? (
        <nav aria-label="Categorias do blog" className="mb-8 flex flex-wrap gap-2">
          <Link
            to="/blog"
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/blog/categoria/$slug"
              params={{ slug: c.slug }}
              className={
                c.slug === slug
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              }
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {list.items.length === 0 ? (
        <EmptyState
          title="Nenhum post nesta categoria"
          description="Explore outras categorias ou volte em breve."
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
              to="/blog/categoria/$slug"
              params={{ slug }}
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
              to="/blog/categoria/$slug"
              params={{ slug }}
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
