import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { isHtmlContent, sanitizeHtml } from "@/features/blog/lib/sanitize";

type Props = {
  content: string;
  className?: string;
};

/**
 * Renderiza conteúdo institucional. Aceita dois formatos:
 * - **HTML sanitizado** (novo, vindo do editor WYSIWYG Tiptap).
 * - **Markdown** (formato legado das páginas já existentes).
 *
 * A detecção é por prefixo: se começar com `<`, tratamos como HTML;
 * caso contrário, mantemos o parser markdown antigo para compatibilidade.
 */
export function MarkdownRenderer({ content, className }: Props) {
  const baseClass = cn(
    "prose prose-neutral max-w-none dark:prose-invert",
    "prose-headings:font-display prose-headings:text-foreground",
    "prose-a:text-primary hover:prose-a:underline",
    "prose-strong:text-foreground",
    className,
  );

  if (isHtmlContent(content)) {
    return (
      <div
        className={baseClass}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <div className={baseClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
