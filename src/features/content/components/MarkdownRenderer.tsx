import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

type Props = {
  content: string
  className?: string
}

/**
 * Shared markdown renderer for institutional pages and events.
 * Applies the app's typography/spacing rules and forbids raw HTML.
 */
export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div
      className={cn(
        'prose prose-neutral max-w-none dark:prose-invert',
        'prose-headings:font-display prose-headings:text-foreground',
        'prose-a:text-primary hover:prose-a:underline',
        'prose-strong:text-foreground',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  )
}
