import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'

const CANONICAL = 'https://temnacidade.com/sobre'

export const Route = createFileRoute('/sobre')({
  loader: () => getSitePage({ data: { slug: 'sobre' } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Sobre'} — Tem na cidade` },
      {
        name: 'description',
        content:
          'Conheça o Tem na cidade, o catálogo digital de empresas, comércios e profissionais liberais das cidades atendidas.',
      },
      { property: 'og:title', content: `${loaderData?.title ?? 'Sobre'} — Tem na cidade` },
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
