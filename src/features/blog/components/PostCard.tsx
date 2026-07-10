import { Link } from "@tanstack/react-router";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { truncateWords } from "@/features/blog/lib/excerpt";
import type { BlogPostWithCategory } from "@/features/blog/lib/types";

/** Card de post na listagem do blog. Excerpt sempre truncado em 80 palavras. */
export function PostCard({ post }: { post: BlogPostWithCategory }) {
  const excerpt = truncateWords(post.excerpt || post.content_html, 80);
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:border-primary/40 hover:shadow-lg">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        aria-label={`Ler ${post.title}`}
        className="block aspect-[16/9] overflow-hidden bg-muted"
      >
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={`Imagem de capa do post: ${post.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-display text-muted-foreground/40">
            {post.title.slice(0, 1)}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.category ? (
            <Link
              to="/blog/categoria/$slug"
              params={{ slug: post.category.slug }}
              className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary transition hover:bg-primary/20"
            >
              {post.category.name}
            </Link>
          ) : null}
          {date ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {date}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.reading_minutes} min
          </span>
        </div>

        <Link to="/blog/$slug" params={{ slug: post.slug }}>
          <h2 className="font-display text-lg font-bold leading-tight text-foreground transition group-hover:text-primary md:text-xl">
            {post.title}
          </h2>
        </Link>

        {excerpt ? (
          <p className="line-clamp-4 flex-1 text-sm text-muted-foreground">{excerpt}</p>
        ) : null}

        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="mt-1 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary transition hover:gap-2"
        >
          Continuar lendo
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
