import { useState, useEffect } from 'react'
import { Save, Eye, PencilLine, Loader2, History, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  useAdminSitePages,
  useUpdateSitePage,
  type AdminSitePage,
} from '@/features/content/functions/adminSitePages'
import {
  useSitePageVersions,
  useRestoreSitePageVersion,
  uploadSitePageImage,
  type SitePageVersion,
} from '@/features/content/functions/sitePageVersions'
import { HtmlContent } from '@/features/content/components/HtmlContent'
import { RichEditor } from '@/features/content/components/RichEditor'
import { Empty, Loading } from '../admin-ui'
import { SeoFieldsSection } from '@/features/seo/components/SeoFieldsSection'
import { SeoPreview } from '@/features/seo/components/SeoPreview'
import { Search } from 'lucide-react'
import type { SeoOverride } from '@/lib/seo/types'


const SLUG_LABELS: Record<string, string> = {
  sobre: 'Sobre',
  contato: 'Contato',
  termos: 'Termos de Uso',
  privacidade: 'Política de Privacidade',
}

export function SitePagesTab() {
  const { data = [], isLoading } = useAdminSitePages()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!activeSlug && data.length > 0) setActiveSlug(data[0].slug)
  }, [data, activeSlug])

  if (isLoading) return <Loading />
  if (data.length === 0) return <Empty>Nenhuma página cadastrada.</Empty>

  const active = data.find((p) => p.slug === activeSlug) ?? data[0]

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Páginas editáveis" className="space-y-1">
        {data.map((p) => (
          <button
            key={p.slug}
            onClick={() => setActiveSlug(p.slug)}
            aria-current={p.slug === active.slug ? 'page' : undefined}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              p.slug === active.slug
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <div className="font-medium">{SLUG_LABELS[p.slug] ?? p.title}</div>
            <div
              className={`text-xs ${
                p.slug === active.slug ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}
            >
              /{p.slug}
            </div>
          </button>
        ))}
      </nav>

      <PageEditor key={active.slug} page={active} />
    </div>
  )
}

function PageEditor({ page }: { page: AdminSitePage }) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content_html)
  const [seo, setSeo] = useState<SeoOverride>({
    seo_title: page.seo_title,
    seo_description: page.seo_description,
    og_title: page.og_title,
    og_description: page.og_description,
    og_image_url: page.og_image_url,
    canonical_url: page.canonical_url,
    noindex: page.noindex,
  })
  const update = useUpdateSitePage()

  const dirty =
    title !== page.title ||
    content !== page.content_html ||
    seo.seo_title !== page.seo_title ||
    seo.seo_description !== page.seo_description ||
    seo.og_title !== page.og_title ||
    seo.og_description !== page.og_description ||
    seo.og_image_url !== page.og_image_url ||
    seo.canonical_url !== page.canonical_url ||
    !!seo.noindex !== page.noindex

  return (
    <section
      className="rounded-2xl border border-border bg-card p-4 shadow-soft"
      aria-labelledby={`editor-title-${page.slug}`}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id={`editor-title-${page.slug}`} className="font-display text-lg font-semibold">
            {SLUG_LABELS[page.slug] ?? page.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            Última atualização: {new Date(page.updated_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <Button
          onClick={() =>
            update.mutate({ slug: page.slug, title, content_html: content, ...seo })
          }
          disabled={!dirty || update.isPending}
          size="sm"
        >
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </header>


      <label className="mb-1 block text-xs font-medium text-muted-foreground">Título</label>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={140}
        className="mb-4"
      />

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">
            <PencilLine className="mr-1 h-4 w-4" /> Editar
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-1 h-4 w-4" /> Visualizar
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-3">
          <RichEditor
            value={content}
            onChange={setContent}
            uploadImage={(f) => uploadSitePageImage(page.slug, f)}
            placeholder="Escreva o conteúdo da página…"
            minHeight={480}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Use a barra de ferramentas para formatar. Imagens são enviadas automaticamente.
          </p>
        </TabsContent>

        <TabsContent value="preview" className="mt-3">
          <div className="rounded-xl border border-border bg-background p-6">
            <h1 className="mb-4 font-display text-3xl font-bold">{title}</h1>
            <HtmlContent content={content} />
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <VersionHistory
            slug={page.slug}
            onRestore={(v) => {
              setTitle(v.title)
              setContent(v.content_html)
            }}
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function VersionHistory({
  slug,
  onRestore,
}: {
  slug: string
  onRestore: (v: SitePageVersion) => void
}) {
  const { data = [], isLoading } = useSitePageVersions(slug)
  const restore = useRestoreSitePageVersion()
  const [previewing, setPreviewing] = useState<SitePageVersion | null>(null)

  if (isLoading) return <Loading />
  if (data.length === 0) {
    return <Empty>Ainda não há versões anteriores para esta página.</Empty>
  }

  return (
    <div className="grid gap-3 md:grid-cols-[280px_1fr]">
      <ol className="space-y-1" aria-label="Versões anteriores">
        {data.map((v) => (
          <li key={v.id}>
            <button
              onClick={() => setPreviewing(v)}
              aria-current={previewing?.id === v.id ? 'true' : undefined}
              className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                previewing?.id === v.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="font-medium">
                {new Date(v.created_at).toLocaleString('pt-BR')}
              </div>
              <div className="truncate text-muted-foreground">{v.title}</div>
            </button>
          </li>
        ))}
      </ol>

      <section
        aria-label="Pré-visualização da versão"
        className="rounded-xl border border-border bg-background p-5"
      >
        {previewing ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Versão de {new Date(previewing.created_at).toLocaleString('pt-BR')}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  restore.mutate(previewing, {
                    onSuccess: () => {
                      onRestore(previewing)
                    },
                  })
                }}
                disabled={restore.isPending}
              >
                {restore.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-4 w-4" />
                )}
                Restaurar esta versão
              </Button>
            </div>
            <h1 className="mb-3 font-display text-2xl font-bold">{previewing.title}</h1>
            <HtmlContent content={previewing.content_html} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione uma versão à esquerda para visualizar.
          </p>
        )}
      </section>
    </div>
  )
}
