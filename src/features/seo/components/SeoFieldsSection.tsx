import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SeoOverride, SchemaType } from "@/lib/seo/types";
import { SCHEMA_TYPE_OPTIONS } from "@/lib/seo/types";
import { AttachmentPicker } from "@/components/upload/AttachmentPicker";
import { uploadSitePageImage } from "@/features/content/functions/sitePageVersions";
import { removeFromBucket } from "@/lib/storage/uploadFile";

type Props = {
  value: SeoOverride;
  onChange: (patch: Partial<SeoOverride>) => void;
  /** Faz upload da imagem OG. Padrão: bucket `site-pages-images`. */
  uploadImage?: (file: File) => Promise<string>;
  /** Remove a imagem OG anterior. Padrão: bucket `site-pages-images`. */
  removeImage?: (url: string) => Promise<void>;
  fields?: {
    ogTitle?: boolean;
    ogDescription?: boolean;
    ogImage?: boolean;
    canonical?: boolean;
    noindex?: boolean;
    keywords?: boolean;
    schemaType?: boolean;
  };
  /** Lista personalizada para o seletor de schema. Padrão: todas as opções. */
  schemaOptions?: SchemaType[];
  helperFor?: {
    title?: string;
    description?: string;
  };
};

const DEFAULT_FIELDS = {
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  canonical: true,
  noindex: true,
  keywords: true,
  schemaType: true,
};

export function SeoFieldsSection({
  value,
  onChange,
  uploadImage,
  removeImage,
  fields,
  schemaOptions,
  helperFor,
}: Props) {
  const f = { ...DEFAULT_FIELDS, ...(fields ?? {}) };
  const doUpload = uploadImage ?? ((file: File) => uploadSitePageImage("seo", file));
  const doRemove =
    removeImage ?? ((url: string) => removeFromBucket("site-pages-images", url));


  const titleLen = (value.seo_title ?? "").length;
  const descLen = (value.seo_description ?? "").length;
  const schemaList = schemaOptions
    ? SCHEMA_TYPE_OPTIONS.filter((o) => schemaOptions.includes(o.value))
    : SCHEMA_TYPE_OPTIONS;

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="seo-title">Título SEO</Label>
          <span
            className={`text-xs ${titleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {titleLen}/60
          </span>
        </div>
        <Input
          id="seo-title"
          value={value.seo_title ?? ""}
          onChange={(e) => onChange({ seo_title: e.target.value })}
          placeholder={helperFor?.title ?? "Padrão do site será usado se vazio"}
          maxLength={140}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="seo-desc">Descrição SEO (meta description)</Label>
          <span
            className={`text-xs ${descLen > 160 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {descLen}/160
          </span>
        </div>
        <Textarea
          id="seo-desc"
          rows={2}
          value={value.seo_description ?? ""}
          onChange={(e) => onChange({ seo_description: e.target.value })}
          placeholder={helperFor?.description ?? "Padrão do site será usado se vazio"}
          maxLength={320}
        />
      </div>

      {f.keywords && (
        <div>
          <Label htmlFor="seo-keywords">Palavras-chave</Label>
          <Textarea
            id="seo-keywords"
            rows={2}
            value={value.seo_keywords ?? ""}
            onChange={(e) => onChange({ seo_keywords: e.target.value })}
            placeholder="Separadas por vírgula. Ex.: restaurante, delivery, centro"
            maxLength={320}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separe por vírgula. Deixe vazio para usar as palavras-chave padrão do site.
          </p>
        </div>
      )}

      {f.schemaType && (
        <div>
          <Label htmlFor="schema-type">Tipo de conteúdo (schema.org)</Label>
          <Select
            value={value.schema_type ?? "__auto"}
            onValueChange={(v) =>
              onChange({ schema_type: v === "__auto" ? null : (v as SchemaType) })
            }
          >
            <SelectTrigger id="schema-type" className="mt-1">
              <SelectValue placeholder="Automático" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto">Automático (padrão desta página)</SelectItem>
              {schemaList.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Diz aos buscadores o que esta página representa (post de blog, contato, produto, etc.).
          </p>
        </div>
      )}

      {f.ogTitle && (
        <div>
          <Label htmlFor="og-title">Título social (og:title)</Label>
          <Input
            id="og-title"
            value={value.og_title ?? ""}
            onChange={(e) => onChange({ og_title: e.target.value })}
            placeholder="Usa o título SEO se vazio"
          />
        </div>
      )}

      {f.ogDescription && (
        <div>
          <Label htmlFor="og-desc">Descrição social (og:description)</Label>
          <Textarea
            id="og-desc"
            rows={2}
            value={value.og_description ?? ""}
            onChange={(e) => onChange({ og_description: e.target.value })}
            placeholder="Usa a descrição SEO se vazio"
          />
        </div>
      )}

      {f.ogImage && (
        <div>
          <Label>Imagem social (og:image)</Label>
          <div className="mt-1 flex flex-wrap items-start gap-3">
            {value.og_image_url ? (
              <div className="relative">
                <img
                  src={value.og_image_url}
                  alt="Prévia og:image"
                  className="h-24 w-40 rounded-md border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange({ og_image_url: null })}
                  className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow ring-1 ring-border"
                  aria-label="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-24 w-40 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <Input
                value={value.og_image_url ?? ""}
                onChange={(e) => onChange({ og_image_url: e.target.value || null })}
                placeholder="Cole uma URL ou envie um arquivo"
              />
              {uploadImage && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Enviar imagem
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {f.canonical && (
        <div>
          <Label htmlFor="canonical">Canonical URL</Label>
          <Input
            id="canonical"
            value={value.canonical_url ?? ""}
            onChange={(e) => onChange({ canonical_url: e.target.value || null })}
            placeholder="Deixe vazio para usar a URL desta página"
          />
        </div>
      )}

      {f.noindex && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
          <div>
            <Label htmlFor="noindex" className="cursor-pointer">
              Não indexar (noindex)
            </Label>
            <p className="text-xs text-muted-foreground">
              Se ativo, buscadores não vão listar esta página.
            </p>
          </div>
          <Switch
            id="noindex"
            checked={!!value.noindex}
            onCheckedChange={(v) => onChange({ noindex: v })}
          />
        </div>
      )}
    </div>
  );
}
