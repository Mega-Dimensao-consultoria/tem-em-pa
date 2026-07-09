import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/features/blog/lib/sanitize";

type Props = {
  content: string;
  className?: string;
};

/**
 * Renderiza conteúdo institucional a partir de HTML sanitizado
 * (produzido pelo editor WYSIWYG).
 */
export function HtmlContent({ content, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:font-display prose-headings:text-foreground",
        "prose-a:text-primary hover:prose-a:underline",
        "prose-strong:text-foreground",
        className,
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
