import { useEffect, useState } from "react";
import { Loader2, Save, X, ImagePlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RichEditor } from "@/features/content/components/RichEditor";
import { uploadBlogImage } from "@/features/blog/lib/uploadImage";
import { useAdminBlogCategories, useAdminPost, useSavePost } from "@/features/blog/hooks/useBlogAdmin";
import type { BlogStatus } from "@/features/blog/lib/types";
import { slugify } from "../admin-ui";
import { SeoFieldsSection } from "@/features/seo/components/SeoFieldsSection";
import { SeoPreview } from "@/features/seo/components/SeoPreview";
import type { SeoOverride } from "@/lib/seo/types";


type Props = {
  postId: string | null; // null = novo post
  onClose: () => void;
};

/**
 * Editor completo de post — usado no dialog do BlogPostsTab.
 * Suporta criação (postId=null) e edição.
 */
export function BlogPostEditor({ postId, onClose }: Props) {
  const { data: existing, isLoading } = useAdminPost(postId);
  const { data: categories = [] } = useAdminBlogCategories();
  const save = useSavePost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [publishedAt, setPublishedAt] = useState<string>("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [seo, setSeo] = useState<SeoOverride>({
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    schema_type: null,
    og_image_url: null,
    canonical_url: null,
    noindex: false,
  });

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setSlug(existing.slug);
    setSlugTouched(true);
    setExcerpt(existing.excerpt ?? "");
    setContent(existing.content_html);
    setCover(existing.cover_image_url);
    setCategoryId(existing.category_id);
    setStatus(existing.status);
    setPublishedAt(existing.published_at ? existing.published_at.slice(0, 16) : "");
    setSeo({
      seo_title: existing.seo_title,
      seo_description: existing.seo_description,
      seo_keywords: existing.seo_keywords,
      schema_type: existing.schema_type,
      og_image_url: existing.og_image_url,
      canonical_url: existing.canonical_url,
      noindex: existing.noindex,
    });
  }, [existing]);

  async function handleCoverFile(file: File) {
    setCoverUploading(true);
    try {
      const url = await uploadBlogImage("cover", file);
      setCover(url);
      toast.success("Capa atualizada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCoverUploading(false);
    }
  }

  function handleSave(overrideStatus?: BlogStatus) {
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast.error("Escreva o conteúdo do post");
      return;
    }
    const finalStatus = overrideStatus ?? status;
    save.mutate(
      {
        id: postId ?? undefined,
        title,
        slug: slugTouched && slug ? slug : null,
        excerpt: excerpt || null,
        content_html: content,
        cover_image_url: cover,
        category_id: categoryId,
        status: finalStatus,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        seo_title: seo.seo_title ?? null,
        seo_description: seo.seo_description ?? null,
        seo_keywords: seo.seo_keywords ?? null,
        schema_type: (seo.schema_type as string | null) ?? null,
        og_image_url: seo.og_image_url ?? null,
        canonical_url: seo.canonical_url ?? null,
        noindex: !!seo.noindex,
      },
      { onSuccess: () => onClose() },
    );
  }


  if (postId && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">
            {postId ? "Editar post" : "Novo post"}
          </h3>
          {postId && slug ? (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              /blog/{slug} <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="mr-1 h-4 w-4" /> Fechar
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={save.isPending}>
            <Save className="mr-1 h-4 w-4" /> Salvar rascunho
          </Button>
          <Button size="sm" onClick={() => handleSave("published")} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Editor principal */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              maxLength={180}
              placeholder="Título do post"
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              maxLength={200}
              placeholder="slug-do-post"
            />
            <p className="text-xs text-muted-foreground">
              URL final: /blog/{slug || "gerado-automaticamente"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Resumo (opcional)</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Se vazio, geramos automaticamente das primeiras palavras."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Conteúdo</Label>
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder="Comece a escrever o post…"
              uploadImage={(f) => uploadBlogImage("content", f)}
              minHeight={480}
            />
          </div>

          <details className="rounded-xl border border-border bg-card p-4" open>
            <summary className="cursor-pointer font-medium">SEO</summary>
            <div className="mt-4 space-y-4">
              <SeoFieldsSection
                value={seo}
                onChange={(p) => setSeo((prev) => ({ ...prev, ...p }))}
                uploadImage={(f) => uploadBlogImage("cover", f)}
                fields={{ ogTitle: false, ogDescription: false }}
                helperFor={{ title }}
              />
              <SeoPreview
                title={seo.seo_title || title}
                description={seo.seo_description || excerpt || ""}
                url={`https://www.temnaminhacidade.com.br/blog/${slug || "post"}`}
                image={seo.og_image_url || cover}
              />
            </div>
          </details>

        </div>

        {/* Sidebar de metadados */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 font-medium">Publicação</h4>

            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BlogStatus)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Label className="mt-3 block text-xs">Data de publicação</Label>
            <Input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Deixe vazio para publicar agora. Datas futuras agendam a exibição.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 font-medium">Categoria</h4>
            <Select
              value={categoryId ?? "none"}
              onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 font-medium">Capa</h4>
            {cover ? (
              <div className="mb-3 overflow-hidden rounded-lg border border-border">
                <img src={cover} alt="Capa" className="aspect-[16/9] w-full object-cover" />
              </div>
            ) : (
              <div className="mb-3 flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground">
                Sem capa
              </div>
            )}
            <div className="flex gap-2">
              <label
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
              >
                {coverUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                Enviar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleCoverFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {cover ? (
                <Button variant="outline" size="sm" onClick={() => setCover(null)}>
                  Remover
                </Button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
