import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { ImageUpload } from "@/components/ImageUpload";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cadastrar-empresa")({
  head: () => ({ meta: [{ title: "Cadastrar empresa — Tem em P.A" }] }),
  component: CadastrarPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  category_id: z.string().uuid("Selecione uma categoria"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  number: z.string().max(10).optional().or(z.literal("")),
  neighborhood: z.string().max(120).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").max(120).optional().or(z.literal("")),
  website: z.string().url("URL inválida").max(200).optional().or(z.literal("")),
});

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function CadastrarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const [categoryId, setCategoryId] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Pouso Alegre");
  const [state, setState] = useState("MG");
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onCepBlur() {
    if (!/^\d{5}-?\d{3}$/.test(cep)) return;
    setLoadingCep(true);
    try {
      const res = await lookupCep({ data: { cep } });
      setAddress(res.address);
      setNeighborhood(res.neighborhood);
      setCity(res.city || "Pouso Alegre");
      setState(res.state || "MG");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao consultar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      category_id: fd.get("category_id"),
      description: fd.get("description") ?? "",
      cep, address, neighborhood, city, state,
      number: fd.get("number") ?? "",
      phone: fd.get("phone") ?? "",
      whatsapp: fd.get("whatsapp") ?? "",
      email: fd.get("email") ?? "",
      website: fd.get("website") ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const v = parsed.data;
    const { data, error } = await supabase.from("companies").insert({
      name: v.name,
      slug: slugify(v.name) + "-" + Math.random().toString(36).slice(2, 6),
      category_id: v.category_id,
      description: v.description || null,
      cep: v.cep || null,
      address: v.address || null,
      number: v.number || null,
      neighborhood: v.neighborhood || null,
      city: v.city || null,
      state: v.state || null,
      phone: v.phone || null,
      whatsapp: v.whatsapp || null,
      email: v.email || null,
      website: v.website || null,
      logo_url: logoUrl,
      cover_url: coverUrl,
      owner_id: user.id,
      status: "pending",
    }).select("id").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Empresa enviada para aprovação!");
    navigate({ to: "/owner" });
    void data;
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Cadastrar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Após o envio, sua empresa passa por aprovação do nosso time antes de ficar visível.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <Field label="Nome da empresa *" id="name"><Input id="name" name="name" required maxLength={120} /></Field>

          <Field label="Categoria *" id="cat">
            <Select name="category_id" required>
              <SelectTrigger id="cat"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* hidden mirror so FormData picks it up regardless of Select internals */}
          </Field>

          <Field label="Descrição" id="desc">
            <Textarea id="desc" name="description" maxLength={500} rows={4} placeholder="Conte um pouco sobre seu negócio…" />
          </Field>

          {user ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Logo</Label>
                <ImageUpload bucket="company-logos" userId={user.id} value={logoUrl} onChange={setLogoUrl} label="Enviar logo" />
              </div>
              <div>
                <Label className="mb-1.5 block">Capa</Label>
                <ImageUpload bucket="company-logos" userId={user.id} value={coverUrl} onChange={setCoverUrl} label="Enviar capa" />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CEP" id="cep">
              <Input id="cep" value={cep} onChange={(e) => setCep(e.target.value)} onBlur={onCepBlur} placeholder="37550-000" maxLength={9} />
              {loadingCep ? <p className="text-xs text-muted-foreground">Consultando…</p> : null}
            </Field>
            <Field label="Número" id="num"><Input id="num" name="number" maxLength={10} /></Field>
          </div>

          <Field label="Endereço" id="addr">
            <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Bairro" id="bairro"><Input id="bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></Field>
            <Field label="Cidade" id="city"><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
            <Field label="UF" id="uf"><Input id="uf" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} /></Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" id="phone"><Input id="phone" name="phone" type="tel" maxLength={20} /></Field>
            <Field label="WhatsApp" id="wpp"><Input id="wpp" name="whatsapp" type="tel" maxLength={20} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" id="email"><Input id="email" name="email" type="email" maxLength={120} /></Field>
            <Field label="Site" id="site"><Input id="site" name="website" type="url" maxLength={200} /></Field>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : "Enviar para aprovação"}
          </Button>
        </form>
      </section>
    </PageShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
