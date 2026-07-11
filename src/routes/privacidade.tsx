import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'
import { resolveSeo, buildSeoHead, SEO_SITE_URL } from '@/lib/seo/render'

export const Route = createFileRoute('/privacidade')({
  loader: () => getSitePage({ data: { slug: 'privacidade' } }),
  head: ({ loaderData }) => {
    const url = `${SEO_SITE_URL}/privacidade`
    const seo = resolveSeo({
      url,
      fallbackTitle: `${loaderData?.title ?? 'Política de Privacidade'} — Tem na minha cidade`,
      fallbackDescription:
        'Política de Privacidade do Tem na minha cidade: como coletamos, usamos e protegemos seus dados (LGPD).',
      override: loaderData ?? undefined,
    })
    return buildSeoHead({ seo })
  },
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
