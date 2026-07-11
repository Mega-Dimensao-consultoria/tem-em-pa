import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'
import { resolveSeo, buildSeoHead, SEO_SITE_URL } from '@/lib/seo/render'

export const Route = createFileRoute('/contato')({
  loader: () => getSitePage({ data: { slug: 'contato' } }),
  head: ({ loaderData }) => {
    const url = `${SEO_SITE_URL}/contato`
    const seo = resolveSeo({
      url,
      fallbackTitle: `${loaderData?.title ?? 'Contato'} — Tem na minha cidade`,
      fallbackDescription:
        'Fale com a equipe do Tem na minha cidade. Tire dúvidas, envie sugestões ou reporte problemas.',
      fallbackSchemaType: 'ContactPage',
      override: loaderData ?? undefined,
    })
    return buildSeoHead({ seo })
  },
  component: ContatoPage,
})

function ContatoPage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">{page?.title ?? 'Contato'}</h1>
        <div className="mt-6">
          <HtmlContent content={page?.content_html ?? ''} />
        </div>
      </section>
    </PageShell>
  )
}
