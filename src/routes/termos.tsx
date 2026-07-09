import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'

const CANONICAL = 'https://temnacidade.com/termos'

export const Route = createFileRoute('/termos')({
  loader: () => getSitePage({ data: { slug: 'termos' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Termos de Uso'} — Tem na cidade` },
      {
        name: 'description',
        content:
          'Termos de Uso do Tem na cidade: regras da plataforma, direitos e deveres de usuários e cadastros.',
      },
      { property: 'og:title', content: `${loaderData?.title ?? 'Termos de Uso'} — Tem na cidade` },
      { property: 'og:description', content: 'Regras de uso do Tem na cidade.' },
      { property: 'og:url', content: CANONICAL },
    ],
    links: [{ rel: 'canonical', href: CANONICAL }],
  }),
  component: TermosPage,
})

function TermosPage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">
          {page?.title ?? 'Termos de Uso'}
        </h1>
        <div className="mt-6">
          <HtmlContent content={page?.content_html ?? ''} />
        </div>
      </article>
    </PageShell>
  )
}
