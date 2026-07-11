import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'

const CANONICAL = 'https://www.temnaminhacidade.com.br/sobre'

export const Route = createFileRoute('/sobre')({
  loader: () => getSitePage({ data: { slug: 'sobre' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Sobre'} — Tem na minha cidade` },
      {
        name: 'description',
        content:
          'Conheça o Tem na minha cidade, o catálogo digital de empresas, comércios e profissionais liberais das cidades atendidas.',
      },
      { property: 'og:title', content: `${loaderData?.title ?? 'Sobre'} — Tem na minha cidade` },
      {
        property: 'og:description',
        content: 'Catálogo digital multi-cidade.',
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
          <HtmlContent content={page?.content_html ?? ''} />
        </div>
      </section>
    </PageShell>
  )
}
