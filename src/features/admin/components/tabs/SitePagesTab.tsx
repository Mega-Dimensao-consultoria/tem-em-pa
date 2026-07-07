import { useState, useEffect, useRef } from 'react'
import { Save, Eye, PencilLine, Loader2, Image as ImageIcon, History, Columns, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { MarkdownRenderer } from '@/features/content/components/MarkdownRenderer'
import { Empty, Loading } from '../admin-ui'
import { toast } from 'sonner'

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
  const [content, setContent] = useState(page.content_md)
  const [splitView, setSplitView] = useState(true)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const update = useUpdateSitePage()

  const dirty = title !== page.title || content !== page.content_md

  function insertAtCursor(insert: string) {
    const el = textareaRef.current
    if (!el) {
      setContent((c) => c + insert)
      return
    }
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    const next = content.slice(0, start) + insert + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + insert.length
      el.setSelectionRange(pos, pos)
    })
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem acima de 5 MB')
      return
    }
    setUploading(true)
    try {
      const url = await uploadSitePageImage(page.slug, file)
      const alt = file.name.replace(/\.[^.]+$/, '')
      insertAtCursor(`\n\n![${alt}](${url})\n\n`)
      toast.success('Imagem inserida')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={splitView ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSplitView((v) => !v)}
            aria-pressed={splitView}
            title="Alternar preview lado a lado"
          >
            <Columns className="mr-1 h-4 w-4" /> Lado a lado
          </Button>
          <Button
            onClick={() => update.mutate({ slug: page.slug, title, content_md: content })}
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
        </div>
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
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-1 h-4 w-4" />
              )}
              Inserir imagem
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG/JPG/WebP até 5 MB. A imagem é enviada e o Markdown é inserido no cursor.
            </p>
          </div>

          <div className={splitView ? 'grid gap-3 md:grid-cols-2' : ''}>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={22}
              aria-label="Conteúdo em Markdown"
              className="font-mono text-sm"
              placeholder="Escreva em Markdown..."
            />
            {splitView ? (
              <section
                aria-label="Pré-visualização"
                className="max-h-[520px] overflow-auto rounded-xl border border-border bg-background p-5"
              >
                <h1 className="mb-3 font-display text-2xl font-bold">{title}</h1>
                <MarkdownRenderer content={content} />
              </section>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Suporta Markdown: <code>## Título</code>, <code>**negrito**</code>,{' '}
            <code>[link](url)</code>, <code>- lista</code>, <code>![alt](url)</code>. HTML é bloqueado.
          </p>
        </TabsContent>

        <TabsContent value="preview" className="mt-3">
          <div className="rounded-xl border border-border bg-background p-6">
            <h1 className="mb-4 font-display text-3xl font-bold">{title}</h1>
            <MarkdownRenderer content={content} />
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <VersionHistory
            slug={page.slug}
            onRestore={(v) => {
              setTitle(v.title)
              setContent(v.content_md)
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
            <MarkdownRenderer content={previewing.content_md} />
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
