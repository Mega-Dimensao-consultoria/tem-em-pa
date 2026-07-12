import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSeoGlobals, useUpdateSeoGlobals } from "@/features/seo/functions/settings";
import {
  TEMPLATE_LABELS,
  TEMPLATE_VARIABLES,
  type SeoGlobals,
  type SeoTemplate,
  type SeoTemplateKind,
} from "@/lib/seo/types";
import { renderTemplate } from "@/lib/seo/render";
import { SeoPreview } from "@/features/seo/components/SeoPreview";
import { Loading } from "../admin-ui";
import { CitiesSeoTab } from "./CitiesSeoTab";
import { AttachmentPicker } from "@/components/upload/AttachmentPicker";
import { uploadSitePageImage } from "@/features/content/functions/sitePageVersions";
import { removeFromBucket } from "@/lib/storage/uploadFile";

const uploadSeoImage = (file: File) => uploadSitePageImage("seo", file);
const removeSeoImage = (url: string) => removeFromBucket("site-pages-images", url);


export function SeoTab() {
  const { data, isLoading } = useSeoGlobals();
  if (isLoading || !data) return <Loading />;
  return (
    <Tabs defaultValue="globals" className="mt-4">
      <TabsList>
        <TabsTrigger value="globals">Padrões globais</TabsTrigger>
        <TabsTrigger value="templates">Templates dinâmicos</TabsTrigger>
        <TabsTrigger value="cidades">Cidades</TabsTrigger>
      </TabsList>
      <TabsContent value="globals" className="mt-4">
        <GlobalsEditor initial={data} />
      </TabsContent>
      <TabsContent value="templates" className="mt-4">
        <TemplatesEditor initial={data} />
      </TabsContent>
      <TabsContent value="cidades" className="mt-4">
        <CitiesSeoTab />
      </TabsContent>
    </Tabs>
  );
}

function GlobalsEditor({ initial }: { initial: SeoGlobals }) {
  const [g, setG] = useState<SeoGlobals>(initial);
  const update = useUpdateSeoGlobals();
  useEffect(() => setG(initial), [initial]);
  const dirty = JSON.stringify(g) !== JSON.stringify(initial);

  function patch<K extends keyof SeoGlobals>(k: K, v: SeoGlobals[K]) {
    setG((prev) => ({ ...prev, [k]: v }));
  }
  function socialAt(i: number, v: string) {
    setG((prev) => {
      const arr = [...prev.org_social_urls];
      arr[i] = v;
      return { ...prev, org_social_urls: arr };
    });
  }
  function addSocial() {
    setG((prev) => ({ ...prev, org_social_urls: [...prev.org_social_urls, ""] }));
  }
  function removeSocial(i: number) {
    setG((prev) => ({
      ...prev,
      org_social_urls: prev.org_social_urls.filter((_, idx) => idx !== i),
    }));
  }

  const linkedinUrl =
    g.org_social_urls.find((u) => /linkedin\.com/i.test(u)) ?? "";
  function setLinkedin(v: string) {
    setG((prev) => {
      const others = prev.org_social_urls.filter((u) => !/linkedin\.com/i.test(u));
      const trimmed = v.trim();
      return {
        ...prev,
        org_social_urls: trimmed ? [trimmed, ...others] : others,
      };
    });
  }



  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Identidade do site</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="site-name">Nome do site (site_name)</Label>
            <Input
              id="site-name"
              value={g.site_name}
              onChange={(e) => patch("site_name", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="title-base">Título base</Label>
            <Input
              id="title-base"
              value={g.title_base}
              onChange={(e) => patch("title_base", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sep">Separador de título</Label>
            <Input
              id="sep"
              value={g.title_separator}
              onChange={(e) => patch("title_separator", e.target.value)}
              placeholder=" — "
            />
          </div>
          <div>

            <Label htmlFor="tw">Handle do Twitter/X (com @)</Label>
            <Input
              id="tw"
              value={g.twitter_handle ?? ""}
              onChange={(e) => patch("twitter_handle", e.target.value || null)}
              placeholder="@temnaminhacidade"
            />
          <div>
            <Label htmlFor="linkedin">URL do LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://www.linkedin.com/company/temnaminhacidade"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="tagline">Slogan / descrição curta do site</Label>
          <Input
            id="tagline"
            value={g.site_tagline ?? ""}
            onChange={(e) => patch("site_tagline", e.target.value || null)}
            placeholder="Aparece no rodapé e como texto institucional em todo o site."
            maxLength={180}
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="desc">Descrição padrão do site (meta description)</Label>
          <Textarea
            id="desc"
            rows={2}
            value={g.default_description}
            onChange={(e) => patch("default_description", e.target.value)}
            maxLength={320}
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="kws">Palavras-chave padrão</Label>
          <Textarea
            id="kws"
            rows={2}
            value={g.default_keywords ?? ""}
            onChange={(e) => patch("default_keywords", e.target.value || null)}
            placeholder="Separadas por vírgula. Ex.: guia local, empresas, serviços"
            maxLength={320}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Usadas quando uma página não tem palavras-chave próprias.
          </p>
        </div>
        <div className="mt-4">
          <Label>Imagem social padrão (og:image fallback)</Label>
          <div className="mt-1">
            <AttachmentPicker
              value={g.default_og_image_url ?? null}
              onChange={(url) => patch("default_og_image_url", url)}
              upload={uploadSeoImage}
              remove={removeSeoImage}
              label="Enviar imagem padrão"
            />
          </div>
        </div>

      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Organização (JSON-LD)</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Estes dados aparecem no schema Organization exposto para buscadores.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="org-name">Nome da organização</Label>
            <Input
              id="org-name"
              value={g.org_name ?? ""}
              onChange={(e) => patch("org_name", e.target.value || null)}
            />
          </div>
          <div>
            <Label>Logo da organização</Label>
            <div className="mt-1">
              <AttachmentPicker
                value={g.org_logo_url ?? null}
                onChange={(url) => patch("org_logo_url", url)}
                upload={uploadSeoImage}
                remove={removeSeoImage}
                label="Enviar logo"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label>Redes sociais (sameAs)</Label>
          <div className="mt-2 space-y-2">
            {g.org_social_urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => socialAt(i, e.target.value)}
                  placeholder="https://instagram.com/..."
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeSocial(i)}
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addSocial}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar rede social
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Verificação de buscadores</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="gsc">Google Search Console (content=)</Label>
            <Input
              id="gsc"
              value={g.google_site_verification ?? ""}
              onChange={(e) => patch("google_site_verification", e.target.value || null)}
            />
          </div>
          <div>
            <Label htmlFor="bing">Bing Webmaster (content=)</Label>
            <Input
              id="bing"
              value={g.bing_site_verification ?? ""}
              onChange={(e) => patch("bing_site_verification", e.target.value || null)}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button
          onClick={() => update.mutate(g)}
          disabled={!dirty || update.isPending}
        >
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar padrões globais
        </Button>
      </div>
    </div>
  );
}

function TemplatesEditor({ initial }: { initial: SeoGlobals }) {
  const [templates, setTemplates] = useState(initial.templates);
  useEffect(() => setTemplates(initial.templates), [initial.templates]);
  const update = useUpdateSeoGlobals();

  const dirty = JSON.stringify(templates) !== JSON.stringify(initial.templates);
  const kinds: SeoTemplateKind[] = ["company", "city", "category", "event"];

  function patchTpl(kind: SeoTemplateKind, patch: Partial<SeoTemplate>) {
    setTemplates((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Estes templates são aplicados às páginas dinâmicas do site. Use variáveis entre chaves
        duplas: <code>{"{{cidade}}"}</code>, <code>{"{{nome}}"}</code> etc. Cada item individual
        (empresa, cidade, categoria, evento) pode sobrescrever manualmente esses valores no
        próprio cadastro.
      </p>

      {kinds.map((k) => {
        const tpl = templates[k];
        const vars = TEMPLATE_VARIABLES[k];
        const sampleVars: Record<string, string> = { siteName: initial.site_name };
        for (const v of vars) if (!(v in sampleVars)) sampleVars[v] = sampleFor(v);
        const previewTitle = renderTemplate(tpl.title, sampleVars);
        const previewDesc = renderTemplate(tpl.description, sampleVars);

        return (
          <section
            key={k}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <h3 className="mb-2 font-display text-lg font-semibold">{TEMPLATE_LABELS[k]}</h3>
            <div className="mb-3 flex flex-wrap gap-1 text-xs">
              <span className="text-muted-foreground">Variáveis:</span>
              {vars.map((v) => (
                <code
                  key={v}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]"
                >
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <Label>Template do título</Label>
                <Input
                  value={tpl.title}
                  onChange={(e) => patchTpl(k, { title: e.target.value })}
                />
              </div>
              <div>
                <Label>Template da descrição</Label>
                <Textarea
                  rows={2}
                  value={tpl.description}
                  onChange={(e) => patchTpl(k, { description: e.target.value })}
                />
              </div>
              <div>
                <Label>Imagem social padrão para este tipo</Label>
                <p className="mb-1 text-xs text-muted-foreground">
                  Opcional — usa a imagem global se vazio.
                </p>
                <AttachmentPicker
                  value={tpl.og_image_url ?? null}
                  onChange={(url) => patchTpl(k, { og_image_url: url })}
                  upload={uploadSeoImage}
                  remove={removeSeoImage}
                  label="Enviar imagem"
                />
              </div>

            </div>
            <div className="mt-4">
              <div className="mb-1 text-xs text-muted-foreground">Prévia com dados de exemplo</div>
              <SeoPreview
                title={previewTitle}
                description={previewDesc}
                url="https://www.temnaminhacidade.com.br/exemplo"
                image={tpl.og_image_url ?? initial.default_og_image_url}
              />
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-0 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur">
        <Button
          onClick={() => update.mutate({ templates })}
          disabled={!dirty || update.isPending}
        >
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar templates
        </Button>
      </div>
    </div>
  );
}

function sampleFor(v: string): string {
  switch (v) {
    case "cidade":
      return "Cidade Exemplo";
    case "estado":
      return "SP";
    case "categoria":
      return "Restaurantes";
    case "nome":
      return "Empresa Exemplo";
    case "bairro":
      return "Centro";
    case "data":
      return "15 de março";
    default:
      return v;
  }
}
