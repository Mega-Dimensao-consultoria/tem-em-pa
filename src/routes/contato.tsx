import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { MarkdownRenderer } from '@/features/content/components/MarkdownRenderer'
import { getSitePage } from '@/features/content/functions/getSitePage'


const CANONICAL = 'https://pousoalegre.megadimensao.com.br/contato'

export const Route = createFileRoute('/contato')({
  loader: () => getSitePage({ data: { slug: 'contato' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Contato'} — Tem na cidade` },
      {
        name: 'description',
        content:
          'Fale com a equipe do Tem na cidade. Tire dúvidas, envie sugestões ou reporte problemas.',
      },
      { property: 'og:title', content: `${loaderData?.title ?? 'Contato'} — Tem na cidade` },
      { property: 'og:description', content: 'Fale com a equipe do Tem na cidade.' },
      { property: 'og:url', content: CANONICAL },
    ],
    links: [{ rel: 'canonical', href: CANONICAL }],
  }),
  component: ContatoPage,
})

function ContatoPage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">
          {page?.title ?? 'Contato'}
        </h1>
        <div className="mt-6">
          <MarkdownRenderer content={page?.content_md ?? ''} />
        </div>
      </section>
    </PageShell>
  )
}
