import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Clock, ArrowLeft, User as UserIcon } from "lucide-react";
import { blogQueries } from "@/features/blog/hooks/useBlogPublic";
import { PostContent } from "@/features/blog/components/PostContent";
import { ShareBar } from "@/features/blog/components/ShareBar";
import { PostCard } from "@/features/blog/components/PostCard";
import { ErrorState } from "@/components/feedback/ErrorState";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { truncateWords } from "@/features/blog/lib/excerpt";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(blogQueries.post(params.slug));
    if (!post) throw notFound();
    await context.queryClient.ensureQueryData(blogQueries.related(post.category_id, post.id));
    return { post };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData?.post) {
      return {
        meta: [
          { title: "Post não encontrado — Tem na minha cidade" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.post;
    const description = p.excerpt || truncateWords(p.content_html, 30) || "Post do blog Tem na minha cidade.";
    const url = `${SITE_URL}/blog/${params.slug}`;
    const image = p.cover_image_url ?? undefined;
    const meta: Array<Record<string, string>> = [
      { title: `${p.title} — Blog Tem na minha cidade` },
      { name: "description", content: description },
      { property: "og:title", content: p.title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { property: "article:published_time", content: p.published_at ?? "" },
      { property: "article:modified_time", content: p.updated_at },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    if (p.category) {
      meta.push({ property: "article:section", content: p.category.name });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: p.title,
            description,
            image: image ? [image] : undefined,
            datePublished: p.published_at ?? undefined,
            dateModified: p.updated_at,
            mainEntityOfPage: url,
            author: p.author?.full_name
              ? { "@type": "Person", name: p.author.full_name }
              : { "@type": "Organization", name: "Tem na minha cidade" },
            publisher: {
              "@type": "Organization",
              name: "Tem na minha cidade",
              url: SITE_URL,
            },
            articleSection: p.category?.name,
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ErrorState error={error} reset={reset} />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <NotFoundState
        title="Post não encontrado"
        description="Este post não existe, foi arquivado ou ainda não foi publicado."
      />
    </div>
  ),
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { post } = Route.useLoaderData();
  const { data: related = [] } = useSuspenseQuery(blogQueries.related(post.category_id, post.id));

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar para o blog
      </Link>

      <header className="mb-6">
        {post.category ? (
          <Link
            to="/blog/categoria/$slug"
            params={{ slug: post.category.slug }}
            className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            {post.category.name}
          </Link>
        ) : null}
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author?.full_name ? (
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" aria-hidden="true" />
              {post.author.full_name}
            </span>
          ) : null}
          {date ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {date}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {post.reading_minutes} min de leitura
          </span>
        </div>
      </header>

      {post.cover_image_url ? (
        <figure className="mb-8 overflow-hidden rounded-2xl border border-border shadow-soft">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </figure>
      ) : null}

      <PostContent html={post.content_html} />

      <div className="mt-10">
        <ShareBar title={post.title} url={url} />
      </div>

      {related.length > 0 ? (
        <section className="mt-14" aria-labelledby="related-posts">
          <h2 id="related-posts" className="mb-5 font-display text-xl font-bold">
            Continue lendo
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
