import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

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
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pending-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, status, created_at")
        .in("status", ["pending", "claimed_pending"]);
      if (error) throw error;
      return data;
    },
  });
  return <AdminList isLoading={isLoading} items={data} emptyText="Nenhuma empresa aguardando aprovação." />;
}

function PendingClaimsTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pending-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_claims")
        .select("id, company_id, status, created_at")
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
  });
  return (
    <AdminList
      isLoading={isLoading}
      items={data.map((c) => ({ id: c.id, name: `Reivindicação ${c.id.slice(0, 8)}`, status: c.status, created_at: c.created_at }))}
      emptyText="Nenhuma reivindicação pendente."
    />
  );
}

function PendingReviewsTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pending-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, comment, status, created_at")
        .in("status", ["pending_moderation", "flagged"]);
      if (error) throw error;
      return data;
    },
  });
  return (
    <AdminList
      isLoading={isLoading}
      items={data.map((r) => ({ id: r.id, name: r.comment ?? "(sem texto)", status: r.status, created_at: r.created_at }))}
      emptyText="Nenhum comentário em moderação."
    />
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
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.length} categoria(s)</p>
        <Button size="sm" disabled>+ Nova categoria</Button>
      </div>
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
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      Gestão de usuários (banir, resetar senhas) será habilitada na próxima etapa.
    </div>
  );
}

function AdminList({ items, isLoading, emptyText }: { items: { id: string; name: string; status: string; created_at: string }[]; isLoading: boolean; emptyText: string }) {
  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>;
  if (items.length === 0)
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  return (
    <ul className="mt-4 divide-y rounded-2xl border border-border bg-card shadow-soft">
      {items.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="line-clamp-1 font-semibold">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.status} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled>Aprovar</Button>
            <Button size="sm" variant="outline" disabled>Rejeitar</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
