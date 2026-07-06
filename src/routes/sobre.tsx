import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { MarkdownRenderer } from '@/features/content/components/MarkdownRenderer'
import { getSitePage } from '@/features/content/functions/getSitePage'

const CANONICAL = 'https://pousoalegre.megadimensao.com.br/sobre'

export const Route = createFileRoute('/sobre')({
  loader: () => getSitePage({ data: { slug: 'sobre' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Sobre'} — Tem em Pouso Alegre` },
      {
        name: 'description',
        content:
          'Conheça o Tem em Pouso Alegre, o catálogo digital de empresas, comércios e profissionais liberais de Pouso Alegre/MG.',
      },
      { property: 'og:title', content: `${loaderData?.title ?? 'Sobre'} — Tem em Pouso Alegre` },
      {
        property: 'og:description',
        content: 'Catálogo digital de Pouso Alegre/MG.',
      },
      { property: 'og:url', content: CANONICAL },
    ],
    links: [{ rel: 'canonical', href: CANONICAL }],
  }),
  component: SobrePage,
})

function SobrePage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">
          {page?.title ?? 'Sobre'}
        </h1>
        <div className="mt-6">
          <MarkdownRenderer content={page?.content_md ?? ''} />
        </div>
      </section>
    </PageShell>
  )
}
