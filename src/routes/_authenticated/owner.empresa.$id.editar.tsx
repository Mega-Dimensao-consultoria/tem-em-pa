import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/categories.functions";
import { lookupCep } from "@/lib/viacep.functions";
import { ImageUpload, GalleryUpload } from "@/components/ImageUpload";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { maskCep, maskPhone, maskUf } from "@/lib/masks";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/editar")({
  head: () => ({ meta: [{ title: "Editar empresa — Tem em P.A" }] }),
  component: EditarEmpresa,
});

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
type Hour = { day: number; open: string; close: string; closed?: boolean };

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  category_id: z.string().uuid(),
  description: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().max(120).optional().or(z.literal("")),
  website: z.string().url().max(200).optional().or(z.literal("")),
  instagram_url: z.string().url().max(200).optional().or(z.literal("")),
  facebook_url: z.string().url().max(200).optional().or(z.literal("")),
});

function EditarEmpresa() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-edit", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "", description: "", phone: "", whatsapp: "", email: "", website: "",
    instagram_url: "", facebook_url: "",
    cep: "", address: "", number: "", complement: "", neighborhood: "", city: "Pouso Alegre", state: "MG",
  });
  const [categoryId, setCategoryId] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [hours, setHours] = useState<Hour[]>(
    DAYS.map((_, i) => ({ day: i, open: "08:00", close: "18:00", closed: i === 0 })),
  );
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name ?? "",
      description: company.description ?? "",
      phone: company.phone ?? "",
      whatsapp: company.whatsapp ?? "",
      email: company.email ?? "",
      website: company.website ?? "",
      instagram_url: (company as any).instagram_url ?? "",
      facebook_url: (company as any).facebook_url ?? "",
      cep: company.cep ?? "",
      address: company.address ?? "",
      number: company.number ?? "",
      complement: company.complement ?? "",
      neighborhood: company.neighborhood ?? "",
      city: company.city ?? "Pouso Alegre",
      state: company.state ?? "MG",
    });
    setCategoryId(company.category_id ?? "");
    setLogoUrl(company.logo_url ?? null);
    setCoverUrl(company.cover_url ?? null);
    setGallery((((company as any).gallery_urls as string[] | null) ?? []));
    const h = (company as any).hours as Hour[] | null;
    if (h && Array.isArray(h) && h.length === 7) setHours(h);
  }, [company]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onCepBlur() {
    if (!/^\d{5}-?\d{3}$/.test(form.cep)) return;
    setLoadingCep(true);
    try {
      const res = await lookupCep({ data: { cep: form.cep } });
      setForm((f) => ({ ...f, address: res.address, neighborhood: res.neighborhood, city: res.city || f.city, state: res.state || f.state }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao consultar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ ...form, category_id: categoryId });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    // Re-geocode se o endereço mudou
    let lat: number | null | undefined = undefined;
    let lng: number | null | undefined = undefined;
    const fullAddr = [form.address, form.number, form.neighborhood, form.city, form.state, "Brasil"].filter(Boolean).join(", ");
    if (fullAddr.length > 10) {
      try {
        const { geocodeAddress } = await import("@/lib/geocode.functions");
        const geo = await geocodeAddress({ data: { address: fullAddr } });
        lat = geo.lat;
        lng = geo.lng;
      } catch {/* silencioso */}
    }

    const { error } = await supabase.from("companies").update({
      name: form.name,
      category_id: categoryId,
      description: form.description || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      website: form.website || null,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      cep: form.cep || null,
      address: form.address || null,
      number: form.number || null,
      complement: form.complement || null,
      neighborhood: form.neighborhood || null,
      city: form.city || null,
      state: form.state || null,
      logo_url: logoUrl,
      cover_url: coverUrl,
      gallery_urls: gallery,
      hours: hours,
      ...(lat !== undefined ? { lat, lng } : {}),
    } as any).eq("id", id);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Empresa atualizada com sucesso!");
    navigate({ to: "/empresa/$id", params: { id } });
  }

  if (isLoading) {
    return <PageShell><div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">Carregando…</div></PageShell>;
  }
  if (!company) {
    return <PageShell><div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p>Empresa não encontrada ou sem permissão.</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/owner">Voltar</Link></Button>
    </div></PageShell>;
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/owner" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Minhas empresas
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Editar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mantenha os dados do seu negócio sempre atualizados.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <Card title="Identidade">
            <Field label="Nome da empresa *" id="name">
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
            </Field>
            <Field label="Categoria *" id="cat">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="cat"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Descrição" id="desc">
              <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={500} rows={4} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="mb-1.5 block">Logo</Label>
                <ImageUpload bucket="company-logos" userId={user!.id} value={logoUrl} onChange={setLogoUrl} label="Enviar logo" /></div>
              <div><Label className="mb-1.5 block">Capa</Label>
                <ImageUpload bucket="company-logos" userId={user!.id} value={coverUrl} onChange={setCoverUrl} label="Enviar capa" /></div>
            </div>
          </Card>

          <Card title="Contato & Redes sociais">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefone" id="phone"><Input id="phone" value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} inputMode="tel" maxLength={16} placeholder="(35) 3421-0000" /></Field>
              <Field label="WhatsApp" id="wpp"><Input id="wpp" value={form.whatsapp} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} inputMode="tel" maxLength={16} placeholder="(35) 99999-0000" /></Field>
              <Field label="E-mail" id="email"><Input id="email" value={form.email} onChange={(e) => set("email", e.target.value)} type="email" /></Field>
              <Field label="Site" id="site"><Input id="site" value={form.website} onChange={(e) => set("website", e.target.value)} type="url" placeholder="https://..." /></Field>
              <Field label="Instagram (URL)" id="ig"><Input id="ig" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/sua-empresa" /></Field>
              <Field label="Facebook (URL)" id="fb"><Input id="fb" value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/sua-empresa" /></Field>
            </div>
          </Card>

          <Card title="Endereço">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP" id="cep">
                <Input id="cep" value={form.cep} onChange={(e) => set("cep", maskCep(e.target.value))} onBlur={onCepBlur} maxLength={9} inputMode="numeric" placeholder="37550-000" />
                {loadingCep ? <p className="text-xs text-muted-foreground">Consultando…</p> : null}
              </Field>
              <Field label="Número" id="num"><Input id="num" value={form.number} onChange={(e) => set("number", e.target.value)} inputMode="numeric" /></Field>
            </div>
            <Field label="Endereço" id="addr"><Input id="addr" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Complemento" id="comp"><Input id="comp" value={form.complement} onChange={(e) => set("complement", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Bairro" id="bairro"><Input id="bairro" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></Field>
              <Field label="Cidade" id="city"><Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="UF" id="uf"><Input id="uf" value={form.state} onChange={(e) => set("state", maskUf(e.target.value))} maxLength={2} /></Field>
            </div>
          </Card>

          <Card title="Horário de funcionamento">
            <div className="space-y-2">
              {hours.map((h, i) => (
                <div key={i} className="grid grid-cols-[3rem_auto_1fr_1fr] items-center gap-3 rounded-lg border border-border p-2">
                  <span className="text-sm font-semibold">{DAYS[h.day]}</span>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={!h.closed} onChange={(e) => {
                      const next = [...hours]; next[i] = { ...h, closed: !e.target.checked }; setHours(next);
                    }} />
                    Aberto
                  </label>
                  <Input type="time" value={h.open} disabled={h.closed}
                    onChange={(e) => { const next = [...hours]; next[i] = { ...h, open: e.target.value }; setHours(next); }} />
                  <Input type="time" value={h.close} disabled={h.closed}
                    onChange={(e) => { const next = [...hours]; next[i] = { ...h, close: e.target.value }; setHours(next); }} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Galeria de fotos">
            <GalleryUpload userId={user!.id} value={gallery} onChange={setGallery} max={8} />
          </Card>


          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" asChild><Link to="/owner">Cancelar</Link></Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</> : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
