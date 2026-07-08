import { toastError } from "@/lib/safe";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/features/auth/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { geocodeAddress } from "@/lib/geocode.functions";
import { CompanyForm, type CompanyFormValues } from "@/features/companies/components/CompanyForm";
import {
  checkCompanyDuplicate,
  type DuplicateMatch,
} from "@/features/companies/functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cadastrar-empresa")({
  head: () => ({ meta: [{ title: "Cadastrar empresa — Tem na cidade" }] }),
  component: CadastrarPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  category_id: z.string().uuid("Selecione uma categoria"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").max(120).optional().or(z.literal("")),
  website: z.string().url("URL inválida").max(200).optional().or(z.literal("")),
});

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function CadastrarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const [pendingValues, setPendingValues] = useState<CompanyFormValues | null>(null);

  async function proceedInsert(v: CompanyFormValues) {
    if (!user) return;
    setSubmitting(true);

    // Resolve city_id (by name/UF) with fallback to default city.
    const cityName = (v.city || "").trim();
    const stateUf = (v.state || "").trim().toUpperCase();
    let city_id: string | null = null;
    if (cityName) {
      let q = supabase.from("cities").select("id").eq("is_active", true);
      q = q.ilike("name", cityName);
      if (stateUf) q = q.eq("state", stateUf);
      const { data: c } = await q.limit(1).maybeSingle();
      city_id = c?.id ?? null;
    }
    if (!city_id) {
      const { data: def } = await supabase
        .from("cities")
        .select("id")
        .eq("is_default", true)
        .maybeSingle();
      city_id = def?.id ?? null;
    }
    if (!city_id) {
      setSubmitting(false);
      toastError(new Error("Cidade não encontrada"), "Falha ao cadastrar");
      return;
    }

    // Resolve/create neighborhood.
    let neighborhood_id: string | null = null;
    if (v.neighborhood) {
      const nbSlug = slugify(v.neighborhood);
      const { data: existing } = await supabase
        .from("neighborhoods")
        .select("id")
        .eq("city_id", city_id)
        .eq("slug", nbSlug)
        .maybeSingle();
      if (existing?.id) neighborhood_id = existing.id;
      else {
        const { data: created } = await supabase
          .from("neighborhoods")
          .insert({ city_id, name: v.neighborhood, slug: nbSlug, is_active: true })
          .select("id")
          .single();
        neighborhood_id = created?.id ?? null;
      }
    }

    let lat: number | null = null;
    let lng: number | null = null;
    const fullAddr = [v.address, v.number, v.neighborhood, v.city, v.state || "MG", "Brasil"]
      .filter(Boolean)
      .join(", ");
    if (fullAddr.length > 10) {
      try {
        const geo = await geocodeAddress({ data: { address: fullAddr } });
        lat = geo.lat;
        lng = geo.lng;
      } catch {
        /* silencioso */
      }
    }

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: v.name,
        slug: slugify(v.name) + "-" + Math.random().toString(36).slice(2, 6),
        category_id: v.category_id,
        description: v.description || null,
        cep: v.cep || null,
        address: v.address || null,
        number: v.number || null,
        city_id,
        neighborhood_id,
        state: v.state || null,
        phone: v.phone || null,
        whatsapp: v.whatsapp || null,
        email: v.email || null,
        website: v.website || null,
        logo_url: v.logo_url,
        cover_url: v.cover_url,
        lat,
        lng,
        owner_id: user.id,
        status: "pending",
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toastError(error, "Falha ao cadastrar");
      return;
    }
    toast.success("Empresa enviada para aprovação!");
    navigate({ to: "/empresa/$id", params: { id: data.id } });
  }

  async function handleSubmit(v: CompanyFormValues) {
    if (!user) return;
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const matches = await checkCompanyDuplicate({
        data: { name: v.name, phone: v.phone || "", whatsapp: v.whatsapp || "" },
      });
      setSubmitting(false);
      if (matches.length > 0) {
        setPendingValues(v);
        setDuplicates(matches);
        return;
      }
    } catch {
      setSubmitting(false);
      // fall through — never block registration on the duplicate check
    }
    await proceedInsert(v);
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Cadastrar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Após o envio, sua empresa passa por aprovação do nosso time antes de ficar visível.
        </p>
        <div className="mt-8">
          <CompanyForm
            mode="create"
            submitting={submitting}
            submitLabel="Enviar para aprovação"
            onSubmit={handleSubmit}
          />
        </div>
      </section>

      <Dialog
        open={!!duplicates}
        onOpenChange={(open) => {
          if (!open) {
            setDuplicates(null);
            setPendingValues(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empresa parecida já cadastrada</DialogTitle>
            <DialogDescription>
              Encontramos {duplicates?.length ?? 0} cadastro(s) semelhante(s). Verifique
              se sua empresa já está listada antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-72 space-y-2 overflow-auto">
            {(duplicates ?? []).map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-border bg-muted/40 p-3 text-sm"
              >
                <Link
                  to="/empresa/$id"
                  params={{ id: m.id }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {m.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {[m.neighborhood, m.city].filter(Boolean).join(" · ") || "—"}
                  {m.phone ? ` · Tel: ${m.phone}` : ""}
                  {" · "}
                  <span className="italic">
                    {m.reason === "phone" ? "mesmo telefone" : "nome parecido"}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDuplicates(null);
                setPendingValues(null);
              }}
            >
              Cancelar cadastro
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const v = pendingValues;
                setDuplicates(null);
                setPendingValues(null);
                if (v) await proceedInsert(v);
              }}
            >
              Cadastrar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
