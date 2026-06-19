import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { CompanyForm, emptyCompanyForm, type CompanyFormValues } from "@/features/companies/components/CompanyForm";
import { defaultHours, type HourRow } from "@/features/companies/components/HoursEditor";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/editar")({
  head: () => ({ meta: [{ title: "Editar empresa — Tem em P.A" }] }),
  component: EditarEmpresa,
});

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
  const [submitting, setSubmitting] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-edit", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const initial = useMemo<Partial<CompanyFormValues> | undefined>(() => {
    if (!company) return undefined;
    const c = company as any;
    const h = c.hours as HourRow[] | null;
    return {
      ...emptyCompanyForm(),
      name: c.name ?? "",
      category_id: c.category_id ?? "",
      description: c.description ?? "",
      phone: c.phone ?? "",
      whatsapp: c.whatsapp ?? "",
      email: c.email ?? "",
      website: c.website ?? "",
      instagram_url: c.instagram_url ?? "",
      facebook_url: c.facebook_url ?? "",
      cep: c.cep ?? "",
      address: c.address ?? "",
      number: c.number ?? "",
      complement: c.complement ?? "",
      neighborhood: c.neighborhood ?? "",
      city: c.city ?? "Pouso Alegre",
      state: c.state ?? "MG",
      logo_url: c.logo_url ?? null,
      cover_url: c.cover_url ?? null,
      gallery_urls: (c.gallery_urls as string[] | null) ?? [],
      hours: h && Array.isArray(h) && h.length === 7 ? h : defaultHours(),
    };
  }, [company]);

  async function handleSubmit(v: CompanyFormValues) {
    if (!user) return;
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    let lat: number | null | undefined = undefined;
    let lng: number | null | undefined = undefined;
    const fullAddr = [v.address, v.number, v.neighborhood, v.city, v.state, "Brasil"]
      .filter(Boolean)
      .join(", ");
    if (fullAddr.length > 10) {
      try {
        const { geocodeAddress } = await import("@/lib/geocode.functions");
        const geo = await geocodeAddress({ data: { address: fullAddr } });
        lat = geo.lat;
        lng = geo.lng;
      } catch {
        /* silencioso */
      }
    }

    const { error } = await supabase
      .from("companies")
      .update({
        name: v.name,
        category_id: v.category_id,
        description: v.description || null,
        phone: v.phone || null,
        whatsapp: v.whatsapp || null,
        email: v.email || null,
        website: v.website || null,
        instagram_url: v.instagram_url || null,
        facebook_url: v.facebook_url || null,
        cep: v.cep || null,
        address: v.address || null,
        number: v.number || null,
        complement: v.complement || null,
        neighborhood: v.neighborhood || null,
        city: v.city || null,
        state: v.state || null,
        logo_url: v.logo_url,
        cover_url: v.cover_url,
        gallery_urls: v.gallery_urls,
        hours: v.hours,
        ...(lat !== undefined ? { lat, lng } : {}),
      } as any)
      .eq("id", id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Empresa atualizada com sucesso!");
    navigate({ to: "/empresa/$id", params: { id } });
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          Carregando…
        </div>
      </PageShell>
    );
  }
  if (!company) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p>Empresa não encontrada ou sem permissão.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/owner">Voltar</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/owner"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Minhas empresas
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Editar empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mantenha os dados do seu negócio sempre atualizados.
        </p>

        <div className="mt-8">
          <CompanyForm
            mode="edit"
            initial={initial}
            submitting={submitting}
            submitLabel="Salvar alterações"
            onSubmit={handleSubmit}
            rightSlot={
              <Button type="button" variant="outline" asChild>
                <Link to="/owner">Cancelar</Link>
              </Button>
            }
          />
        </div>
      </section>
    </PageShell>
  );
}
