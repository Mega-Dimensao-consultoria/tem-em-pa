import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'
import { resolveSeo, buildSeoHead, SEO_SITE_URL } from '@/lib/seo/render'

export const Route = createFileRoute('/sobre')({
  loader: () => getSitePage({ data: { slug: 'sobre' } }),
  head: ({ loaderData }) => {
    const url = `${SEO_SITE_URL}/sobre`
    const seo = resolveSeo({
      url,
      fallbackTitle: `${loaderData?.title ?? 'Sobre'} — Tem na minha cidade`,
      fallbackDescription:
        'Conheça o Tem na minha cidade, o catálogo digital de empresas, comércios e profissionais liberais das cidades atendidas.',
      fallbackSchemaType: 'AboutPage',
      override: loaderData ?? undefined,
    })
    return buildSeoHead({ seo })
  },
  component: SobrePage,
})

function SobrePage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">{page?.title ?? 'Sobre'}</h1>
        <div className="mt-6">
          <HtmlContent content={page?.content_html ?? ''} />
        </div>
      </section>
    </PageShell>
  )
}
