import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Tem em P.A" }] }),
  component: ProductsPage,
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(999999).optional().or(z.literal("" as unknown as number)),
});

function ProductsPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [image1, setImage1] = useState<string | null>(null);

  const company = useQuery({
    queryKey: ["owner-company", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, owner_id").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["owner-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("id, name, description, price, image_url_1, is_active")
        .eq("company_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const isOwner = !!user && company.data?.owner_id === user.id;

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const priceRaw = String(fd.get("price") ?? "").replace(",", ".");
    const parsed = productSchema.safeParse({
      name: fd.get("name"),
      description: fd.get("description") ?? "",
      price: priceRaw === "" ? undefined : Number(priceRaw),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("products").insert({
      company_id: id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: typeof parsed.data.price === "number" ? parsed.data.price : null,
      image_url_1: image1,
      is_active: true,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto adicionado");
    setImage1(null);
    (e.target as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["owner-products", id] });
  }

  async function onDelete(pid: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", pid);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["owner-products", id] });
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner"><ArrowLeft className="mr-1 h-4 w-4" /> Minhas empresas</Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Produtos — {company.data?.name ?? "…"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Até 20 produtos ativos por empresa.</p>

        {!isOwner && !company.isLoading ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Você não tem permissão para gerenciar esta empresa.
          </div>
        ) : (
          <>
            <form onSubmit={onAdd} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Adicionar produto</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="pn">Nome *</Label><Input id="pn" name="name" required maxLength={120} /></div>
                <div className="space-y-1.5"><Label htmlFor="pp">Preço (R$)</Label><Input id="pp" name="price" inputMode="decimal" placeholder="0,00" /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="pd">Descrição</Label><Textarea id="pd" name="description" rows={3} maxLength={500} /></div>
              {user ? (
                <div className="space-y-1.5"><Label>Imagem</Label>
                  <ImageUpload bucket="product-images" userId={user.id} value={image1} onChange={setImage1} label="Enviar imagem" />
                </div>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</> : "Adicionar"}
              </Button>
            </form>

            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold">Cadastrados</h2>
              {products.isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p>
                : (products.data ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">Nenhum produto ainda.</div>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {products.data!.map((p) => (
                      <li key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
                        {p.image_url_1 ? <img src={p.image_url_1} alt="" className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-muted" />}
                        <div className="flex-1">
                          <p className="font-semibold">{p.name}</p>
                          {p.price != null ? <p className="text-sm text-primary font-bold">R$ {Number(p.price).toFixed(2)}</p> : null}
                          {p.description ? <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p> : null}
                        </div>
                        <button onClick={() => onDelete(p.id)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
