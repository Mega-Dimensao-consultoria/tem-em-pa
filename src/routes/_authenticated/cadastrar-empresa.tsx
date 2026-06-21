import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/features/auth/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { geocodeAddress } from "@/lib/geocode.functions";
import { CompanyForm, type CompanyFormValues } from "@/features/companies/components/CompanyForm";

export const Route = createFileRoute("/_authenticated/cadastrar-empresa")({
  head: () => ({ meta: [{ title: "Cadastrar empresa — Tem em P.A" }] }),
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

  async function handleSubmit(v: CompanyFormValues) {
    if (!user) return;
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    let lat: number | null = null;
    let lng: number | null = null;
    const fullAddr = [v.address, v.number, v.neighborhood, v.city || "Pouso Alegre", v.state || "MG", "Brasil"]
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
        neighborhood: v.neighborhood || null,
        city: v.city || null,
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
    </PageShell>
  );
}
