import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { MarkdownRenderer } from '@/features/content/components/MarkdownRenderer'
import { getSitePage } from '@/features/content/functions/getSitePage'

const CANONICAL = 'https://pousoalegre.megadimensao.com.br/privacidade'

export const Route = createFileRoute('/privacidade')({
  loader: () => getSitePage({ data: { slug: 'privacidade' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Política de Privacidade'} — Tem em Pouso Alegre` },
      {
        name: 'description',
        content:
          'Política de Privacidade do Tem em Pouso Alegre: como coletamos, usamos e protegemos seus dados (LGPD).',
      },
      {
        property: 'og:title',
        content: `${loaderData?.title ?? 'Política de Privacidade'} — Tem em Pouso Alegre`,
      },
      {
        property: 'og:description',
        content: 'Como tratamos seus dados no Tem em Pouso Alegre (LGPD).',
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
          <MarkdownRenderer content={page?.content_md ?? ''} />
        </div>
      </article>
    </PageShell>
  )
}
