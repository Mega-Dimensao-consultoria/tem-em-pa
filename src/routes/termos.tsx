import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'
import { resolveSeo, buildSeoHead, SEO_SITE_URL } from '@/lib/seo/render'

export const Route = createFileRoute('/termos')({
  loader: () => getSitePage({ data: { slug: 'termos' } }),
  head: ({ loaderData }) => {
    const url = `${SEO_SITE_URL}/termos`
    const seo = resolveSeo({
      url,
      fallbackTitle: `${loaderData?.title ?? 'Termos de Uso'} — Tem na minha cidade`,
      fallbackDescription:
        'Termos de Uso do Tem na minha cidade: regras da plataforma, direitos e deveres de usuários e cadastros.',
      fallbackSchemaType: 'WebPage',
      override: loaderData ?? undefined,
    })
    return buildSeoHead({ seo })
  },
  component: TermosPage,
})

function TermosPage() {
  const page = Route.useLoaderData()
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">{page?.title ?? 'Termos de Uso'}</h1>
        <div className="mt-6">
          <HtmlContent content={page?.content_html ?? ''} />
        </div>
      </article>
    </PageShell>
  )
}
