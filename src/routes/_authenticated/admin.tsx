import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Tem em P.A" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useRoles();

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">Carregando permissões…</div>
      </PageShell>
    );
  }
  if (!isAdmin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta área é exclusiva para administradores.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Modere conteúdo, gerencie categorias e usuários.</p>

        <Tabs defaultValue="empresas" className="mt-8">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="reivindicacoes">Reivindicações</TabsTrigger>
            <TabsTrigger value="comentarios">Comentários</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas"><PendingCompaniesTab /></TabsContent>
          <TabsContent value="reivindicacoes"><PendingClaimsTab /></TabsContent>
          <TabsContent value="comentarios"><PendingReviewsTab /></TabsContent>
          <TabsContent value="categorias"><CategoriesTab /></TabsContent>
          <TabsContent value="usuarios"><UsersTab /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

function PendingCompaniesTab() {
  const qc = useQueryClient();
  const key = ["admin", "pending-companies"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, status, created_at")
        .in("status", ["pending", "claimed_pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("companies").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Empresa aprovada" : "Empresa rejeitada");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <AdminList
      isLoading={isLoading}
      items={data}
      emptyText="Nenhuma empresa aguardando aprovação."
      onApprove={(id) => decide(id, "approved")}
      onReject={(id) => decide(id, "rejected")}
    />
  );
}

function PendingClaimsTab() {
  const qc = useQueryClient();
  const key = ["admin", "pending-claims"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_claims")
        .select("id, company_id, status, created_at, message, document_urls, companies:company_id(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(claim: typeof data[number], status: "approved" | "rejected") {
    const { error } = await supabase.from("company_claims").update({
      status, reviewed_at: new Date().toISOString(),
    }).eq("id", claim.id);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") {
      // assign ownership
      const { error: e2 } = await supabase.from("companies")
        .update({ owner_id: (claim as { user_id?: string }).user_id ?? undefined, status: "approved" })
        .eq("id", claim.company_id);
      if (e2) toast.error("Claim aprovada, mas falhou ao atribuir dono: " + e2.message);
    }
    toast.success(status === "approved" ? "Reivindicação aprovada" : "Reivindicação rejeitada");
    qc.invalidateQueries({ queryKey: key });
  }

  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>;
  if (data.length === 0)
    return <Empty>Nenhuma reivindicação pendente.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((c) => (
        <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.companies?.name ?? `Empresa ${c.company_id.slice(0, 8)}`}</p>
              <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
              {c.message ? <p className="mt-2 text-sm">{c.message}</p> : null}
              {Array.isArray(c.document_urls) && c.document_urls.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">{c.document_urls.length} documento(s) anexado(s)</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => decide(c, "rejected")}><X className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => decide(c, "approved")}><Check className="h-4 w-4" /></Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PendingReviewsTab() {
  const qc = useQueryClient();
  const key = ["admin", "pending-reviews"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, comment, status, created_at, rating")
        .in("status", ["pending_moderation", "flagged"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Comentário aprovado" : "Comentário rejeitado");
    qc.invalidateQueries({ queryKey: key });
  }

  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>;
  if (data.length === 0) return <Empty>Nenhum comentário em moderação.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Nota: {r.rating} · {new Date(r.created_at).toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-sm">{r.comment ?? "(sem texto)"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}><X className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => decide(r.id, "approved")}><Check className="h-4 w-4" /></Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CategoriesTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="mb-3 text-sm text-muted-foreground">{data.length} categoria(s)</p>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
        <ul className="divide-y">
          {data.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">/{c.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const key = ["admin", "users"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_banned, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  async function toggleBan(id: string, banned: boolean) {
    const { error } = await supabase.from("profiles").update({ is_banned: !banned }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!banned ? "Usuário banido" : "Banimento removido");
    qc.invalidateQueries({ queryKey: key });
  }

  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>;
  if (data.length === 0) return <Empty>Nenhum usuário ainda.</Empty>;

  return (
    <ul className="mt-4 divide-y rounded-2xl border border-border bg-card shadow-soft">
      {data.map((u) => (
        <li key={u.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{u.full_name ?? "(sem nome)"}</p>
            <p className="text-xs text-muted-foreground">
              {u.is_banned ? "Banido · " : ""}{new Date(u.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Button size="sm" variant={u.is_banned ? "outline" : "destructive"} onClick={() => toggleBan(u.id, u.is_banned)}>
            {u.is_banned ? "Desbanir" : "Banir"}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function AdminList({
  items, isLoading, emptyText, onApprove, onReject,
}: {
  items: { id: string; name: string; status: string; created_at: string }[];
  isLoading: boolean;
  emptyText: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>;
  if (items.length === 0) return <Empty>{emptyText}</Empty>;
  return (
    <ul className="mt-4 divide-y rounded-2xl border border-border bg-card shadow-soft">
      {items.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.status} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onReject(c.id)}><X className="mr-1 h-4 w-4" />Rejeitar</Button>
            <Button size="sm" onClick={() => onApprove(c.id)}><Check className="mr-1 h-4 w-4" />Aprovar</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
