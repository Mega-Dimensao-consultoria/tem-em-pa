import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload, GalleryUpload } from "@/components/ImageUpload";
import { FormSection, FormField } from "@/components/forms/FormSection";
import { HoursEditor, defaultHours, type HourRow } from "@/features/companies/components/HoursEditor";
import { useCategories } from "@/features/companies/hooks/useCategories";
import { useAuth } from "@/features/auth/use-auth";
import { lookupCep } from "@/lib/viacep.functions";
import { maskCep, maskPhone, maskUf } from "@/lib/masks";
import { toast } from "sonner";

export type CompanyFormValues = {
  name: string;
  category_id: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram_url: string;
  facebook_url: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  logo_url: string | null;
  cover_url: string | null;
  gallery_urls: string[];
  hours: HourRow[];
};

export const emptyCompanyForm = (): CompanyFormValues => ({
  name: "",
  category_id: "",
  description: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  instagram_url: "",
  facebook_url: "",
  cep: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "Pouso Alegre",
  state: "MG",
  logo_url: null,
  cover_url: null,
  gallery_urls: [],
  hours: defaultHours(),
});

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial?: Partial<CompanyFormValues>;
  /** Optional sections — `gallery` defaults to true in edit mode, false in create. */
  showSections?: {
    socials?: boolean;
    complement?: boolean;
    hours?: boolean;
    gallery?: boolean;
  };
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: CompanyFormValues) => void | Promise<void>;
  rightSlot?: React.ReactNode;
};

/**
 * Single source of truth for company create + edit forms.
 * Renders all standard sections (identity, contact, address, hours, gallery)
 * controlled by `showSections`.
 */
export function CompanyForm({
  mode,
  initial,
  showSections,
  submitting,
  submitLabel,
  onSubmit,
  rightSlot,
}: Props) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();

  const sections = {
    socials: showSections?.socials ?? mode === "edit",
    complement: showSections?.complement ?? mode === "edit",
    hours: showSections?.hours ?? mode === "edit",
    gallery: showSections?.gallery ?? mode === "edit",
  };

  const [form, setForm] = useState<CompanyFormValues>({
    ...emptyCompanyForm(),
    ...initial,
  });
  const [loadingCep, setLoadingCep] = useState(false);

  // Hydrate when `initial` arrives asynchronously (edit mode after fetch).
  useEffect(() => {
    if (!initial) return;
    setForm((f) => ({ ...f, ...initial }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function set<K extends keyof CompanyFormValues>(k: K, v: CompanyFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onCepBlur() {
    if (!/^\d{5}-?\d{3}$/.test(form.cep)) return;
    setLoadingCep(true);
    try {
      const res = await lookupCep({ data: { cep: form.cep } });
      setForm((f) => ({
        ...f,
        address: res.address,
        neighborhood: res.neighborhood,
        city: res.city || f.city,
        state: res.state || f.state,
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao consultar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormSection title="Identidade">
        <FormField label="Nome da empresa *" id="name">
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            maxLength={120}
          />
        </FormField>
        <FormField label="Categoria *" id="cat">
          <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
            <SelectTrigger id="cat">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Descrição" id="desc">
          <Textarea
            id="desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Conte um pouco sobre seu negócio…"
          />
        </FormField>
        {user ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Logo</Label>
              <ImageUpload
                bucket="company-logos"
                userId={user.id}
                value={form.logo_url}
                onChange={(v) => set("logo_url", v)}
                label="Enviar logo"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Capa</Label>
              <ImageUpload
                bucket="company-logos"
                userId={user.id}
                value={form.cover_url}
                onChange={(v) => set("cover_url", v)}
                label="Enviar capa"
              />
            </div>
          </div>
        ) : null}
      </FormSection>

      <FormSection title={sections.socials ? "Contato & Redes sociais" : "Contato"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Telefone" id="phone">
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", maskPhone(e.target.value))}
              inputMode="tel"
              maxLength={16}
              placeholder="(35) 3421-0000"
            />
          </FormField>
          <FormField label="WhatsApp" id="wpp">
            <Input
              id="wpp"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
              inputMode="tel"
              maxLength={16}
              placeholder="(35) 99999-0000"
            />
          </FormField>
          <FormField label="E-mail" id="email">
            <Input
              id="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              type="email"
              maxLength={120}
            />
          </FormField>
          <FormField label="Site" id="site">
            <Input
              id="site"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              type="url"
              maxLength={200}
              placeholder="https://..."
            />
          </FormField>
          {sections.socials ? (
            <>
              <FormField label="Instagram (URL)" id="ig">
                <Input
                  id="ig"
                  value={form.instagram_url}
                  onChange={(e) => set("instagram_url", e.target.value)}
                  placeholder="https://instagram.com/sua-empresa"
                />
              </FormField>
              <FormField label="Facebook (URL)" id="fb">
                <Input
                  id="fb"
                  value={form.facebook_url}
                  onChange={(e) => set("facebook_url", e.target.value)}
                  placeholder="https://facebook.com/sua-empresa"
                />
              </FormField>
            </>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Endereço">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="CEP" id="cep">
            <Input
              id="cep"
              value={form.cep}
              onChange={(e) => set("cep", maskCep(e.target.value))}
              onBlur={onCepBlur}
              maxLength={9}
              inputMode="numeric"
              placeholder="37550-000"
            />
            {loadingCep ? (
              <p className="text-xs text-muted-foreground">Consultando…</p>
            ) : null}
          </FormField>
          <FormField label="Número" id="num">
            <Input
              id="num"
              value={form.number}
              onChange={(e) => set("number", e.target.value)}
              inputMode="numeric"
              maxLength={10}
            />
          </FormField>
        </div>
        <FormField label="Endereço" id="addr">
          <Input
            id="addr"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </FormField>
        {sections.complement ? (
          <FormField label="Complemento" id="comp">
            <Input
              id="comp"
              value={form.complement}
              onChange={(e) => set("complement", e.target.value)}
            />
          </FormField>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Bairro" id="bairro">
            <Input
              id="bairro"
              value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
            />
          </FormField>
          <FormField label="Cidade" id="city">
            <Input
              id="city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </FormField>
          <FormField label="UF" id="uf">
            <Input
              id="uf"
              value={form.state}
              onChange={(e) => set("state", maskUf(e.target.value))}
              maxLength={2}
            />
          </FormField>
        </div>
      </FormSection>

      {sections.hours ? (
        <FormSection title="Horário de funcionamento">
          <HoursEditor value={form.hours} onChange={(v) => set("hours", v)} />
        </FormSection>
      ) : null}

      {sections.gallery && user ? (
        <FormSection title="Galeria de fotos">
          <GalleryUpload
            userId={user.id}
            value={form.gallery_urls}
            onChange={(v) => set("gallery_urls", v)}
            max={8}
          />
        </FormSection>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {rightSlot}
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
