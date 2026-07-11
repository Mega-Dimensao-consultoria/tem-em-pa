import { createFileRoute } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { getSitePage } from '@/features/content/functions/getSitePage'
import { resolveSeo, buildSeoHead, SEO_SITE_URL } from '@/lib/seo/render'
import { ContactDialog } from '@/features/contact/ContactDialog'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/contato')({
  loader: () => getSitePage({ data: { slug: 'contato' } }),
  head: ({ loaderData }) => {
    const url = `${SEO_SITE_URL}/contato`
    const seo = resolveSeo({
      url,
      fallbackTitle: `${loaderData?.title ?? 'Contato'} — Tem na minha cidade`,
      fallbackDescription:
        'Fale com a equipe do Tem na minha cidade. Tire dúvidas, envie sugestões ou reporte problemas pelo nosso formulário.',
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

        <div className="mt-8 rounded-2xl border bg-card p-6 text-center shadow-sm">
          <p className="text-base text-muted-foreground">
            Clique no botão abaixo para abrir o formulário e nos enviar sua mensagem. Nossa equipe
            responde no e-mail que você informar.
          </p>
          <div className="mt-4 flex justify-center">
            <ContactDialog
              defaultOpen
              trigger={
                <Button size="lg" className="gap-2">
                  <Mail className="h-4 w-4" /> Fale conosco
                </Button>
              }
            />
          </div>
        </div>
      </section>
    </PageShell>
  )
}
