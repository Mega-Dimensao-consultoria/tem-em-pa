import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/features/blog/lib/sanitize";

/** Renderiza o corpo HTML sanitizado do post com tipografia consistente. */
export function PostContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:font-display prose-headings:text-foreground",
        "prose-a:text-primary hover:prose-a:underline",
        "prose-img:rounded-xl prose-img:shadow-soft",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        className,
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
