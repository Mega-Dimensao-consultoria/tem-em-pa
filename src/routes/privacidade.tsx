import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'

const CANONICAL = 'https://www.temnaminhacidade.com.br/privacidade'

export const Route = createFileRoute('/privacidade')({
  loader: () => getSitePage({ data: { slug: 'privacidade' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Política de Privacidade'} — Tem na minha cidade` },
      {
        name: 'description',
        content:
          'Política de Privacidade do Tem na minha cidade: como coletamos, usamos e protegemos seus dados (LGPD).',
      },
      {
        property: 'og:title',
        content: `${loaderData?.title ?? 'Política de Privacidade'} — Tem na minha cidade`,
      },
      {
        property: 'og:description',
        content: 'Como tratamos seus dados no Tem na minha cidade (LGPD).',
      },
      { property: 'og:url', content: CANONICAL },
    ],
    links: [{ rel: 'canonical', href: CANONICAL }],
  }),
  component: PrivacidadePage,
})

function PrivacidadePage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">
          {page?.title ?? 'Política de Privacidade'}
        </h1>
        <div className="mt-6">
          <HtmlContent content={page?.content_html ?? ''} />
        </div>
      </article>
    </PageShell>
  )
}
