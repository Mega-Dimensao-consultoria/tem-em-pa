import { useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SeoOverride } from "@/lib/seo/types";

type Props = {
  value: SeoOverride;
  onChange: (patch: Partial<SeoOverride>) => void;
  /** upload retorna URL pública ou lança. Se omitido, campo de imagem só aceita URL. */
  uploadImage?: (file: File) => Promise<string>;
  /** Quais campos exibir. Padrão: todos. */
  fields?: {
    ogTitle?: boolean;
    ogDescription?: boolean;
    ogImage?: boolean;
    canonical?: boolean;
    noindex?: boolean;
  };
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
};

export function SeoFieldsSection({ value, onChange, uploadImage, fields, helperFor }: Props) {
  const f = { ...DEFAULT_FIELDS, ...(fields ?? {}) };
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!uploadImage) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange({ og_image_url: url });
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const titleLen = (value.seo_title ?? "").length;
  const descLen = (value.seo_description ?? "").length;

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
          <Label htmlFor="seo-desc">Descrição SEO</Label>
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
                  aria-label="Remover imagem"
                  onClick={() => onChange({ og_image_url: null })}
                  className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow-soft"
                >
                  <X className="h-3.5 w-3.5" />
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
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="self-start"
                  >
                    {uploading ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-1 h-4 w-4" />
                    )}
                    Enviar imagem
                  </Button>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                Recomendado: 1200×630px, JPG/PNG.
              </p>
            </div>
          </div>
        </div>
      )}

      {f.canonical && (
        <div>
          <Label htmlFor="canonical">URL canônica</Label>
          <Input
            id="canonical"
            value={value.canonical_url ?? ""}
            onChange={(e) => onChange({ canonical_url: e.target.value || null })}
            placeholder="Deixe vazio para usar a própria URL da página"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Só preencha se quiser apontar esta página para outra URL nos buscadores.
          </p>
        </div>
      )}

      {f.noindex && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
          <div>
            <div className="text-sm font-medium">Não indexar (noindex)</div>
            <p className="text-xs text-muted-foreground">
              Página fica invisível para buscadores como Google.
            </p>
          </div>
          <Switch
            checked={!!value.noindex}
            onCheckedChange={(v) => onChange({ noindex: v })}
          />
        </div>
      )}
    </div>
  );
}
