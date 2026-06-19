import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Check, X, Trash2, Plus, Pencil, Shield, ShieldOff, ExternalLink, History, Flag } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";

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
            <TabsTrigger value="palavras">Palavras proibidas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas"><PendingCompaniesTab /></TabsContent>
          <TabsContent value="reivindicacoes"><PendingClaimsTab /></TabsContent>
          <TabsContent value="comentarios"><PendingReviewsTab /></TabsContent>
          <TabsContent value="categorias"><CategoriesTab /></TabsContent>
          <TabsContent value="palavras"><BannedWordsTab /></TabsContent>
          <TabsContent value="usuarios"><UsersTab /></TabsContent>
          <TabsContent value="auditoria"><AuditLogTab /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

/* ===========================================================
   EMPRESAS PENDENTES
=========================================================== */
function PendingCompaniesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "pending-companies"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, description, city, status, created_at")
        .in("status", ["pending", "claimed_pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, name: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("companies").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, status === "approved" ? "company.approve" : "company.reject", "company", id, { name });
    toast.success(status === "approved" ? "Empresa aprovada" : "Empresa rejeitada");
    qc.invalidateQueries({ queryKey: key });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma empresa aguardando aprovação.</Empty>;

  return (
    <ul className="mt-4 divide-y rounded-2xl border border-border bg-card shadow-soft">
      {data.map((c) => (
        <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.status} · {c.city ?? "—"} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
            {c.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/empresa/$id" params={{ id: c.id }} target="_blank"><ExternalLink className="mr-1 h-3 w-3" />Ver</Link>
            </Button>
            <ConfirmDestructive
              trigger={<Button size="sm" variant="outline"><X className="mr-1 h-4 w-4" />Rejeitar</Button>}
              title="Rejeitar empresa?"
              description={<p>A empresa <strong>{c.name}</strong> ficará oculta para todos. Isso pode ser revertido depois mudando o status.</p>}
              confirmText="Rejeitar"
              onConfirm={() => decide(c.id, c.name, "rejected")}
            />
            <Button size="sm" onClick={() => decide(c.id, c.name, "approved")}><Check className="mr-1 h-4 w-4" />Aprovar</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ===========================================================
   REIVINDICAÇÕES
=========================================================== */
function PendingClaimsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "pending-claims"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_claims")
        .select("id, company_id, user_id, status, created_at, message, document_urls, companies:company_id(name)")
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
      const { error: e2 } = await supabase.from("companies")
        .update({ owner_id: claim.user_id, status: "approved" })
        .eq("id", claim.company_id);
      if (e2) toast.error("Claim aprovada, mas falhou ao atribuir dono: " + e2.message);
    }
    if (user) await logAdminAction(user.id, status === "approved" ? "claim.approve" : "claim.reject", "claim", claim.id, { company_id: claim.company_id, user_id: claim.user_id });
    toast.success(status === "approved" ? "Reivindicação aprovada" : "Reivindicação rejeitada");
    qc.invalidateQueries({ queryKey: key });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma reivindicação pendente.</Empty>;

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
              <ConfirmDestructive
                trigger={<Button size="sm" variant="outline"><X className="h-4 w-4" /></Button>}
                title="Rejeitar reivindicação?"
                description="O usuário não receberá a posse desta empresa."
                onConfirm={() => decide(c, "rejected")}
              />
              <Button size="sm" onClick={() => decide(c, "approved")}><Check className="h-4 w-4" /></Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ===========================================================
   COMENTÁRIOS EM MODERAÇÃO
=========================================================== */
function PendingReviewsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "pending-reviews"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, comment, status, created_at, rating, company_id, companies:company_id(name)")
        .in("status", ["pending_moderation", "flagged"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, status === "approved" ? "review.approve" : "review.reject", "review", id);
    toast.success(status === "approved" ? "Comentário aprovado" : "Comentário rejeitado");
    qc.invalidateQueries({ queryKey: key });
  }

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhum comentário em moderação.</Empty>;

  return (
    <ul className="mt-4 space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {r.companies?.name ?? "Empresa"} · Nota {r.rating} · {new Date(r.created_at).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-sm">{r.comment ?? "(sem texto)"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <ConfirmDestructive
                trigger={<Button size="sm" variant="outline"><X className="h-4 w-4" /></Button>}
                title="Rejeitar comentário?"
                description="O comentário não aparecerá publicamente."
                onConfirm={() => decide(r.id, "rejected")}
              />
              <Button size="sm" onClick={() => decide(r.id, "approved")}><Check className="h-4 w-4" /></Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ===========================================================
   CATEGORIAS (CRUD)
=========================================================== */
function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);
}

function CategoriesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "categories"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, icon, sort_order").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [editing, setEditing] = useState<{ id?: string; name: string; slug: string; icon: string; sort_order: number } | null>(null);

  async function save() {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) { toast.error("Informe o nome."); return; }
    const slug = (editing.slug.trim() || slugify(name));
    const payload = { name, slug, icon: editing.icon.trim() || null, sort_order: editing.sort_order || 0 };
    if (editing.id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      if (user) await logAdminAction(user.id, "category.update", "category", editing.id, payload);
      toast.success("Categoria atualizada");
    } else {
      const { data: ins, error } = await supabase.from("categories").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      if (user) await logAdminAction(user.id, "category.create", "category", ins.id, payload);
      toast.success("Categoria criada");
    }
    setEditing(null);
    qc.invalidateQueries({ queryKey: key });
  }

  async function remove(id: string, name: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, "category.delete", "category", id, { name });
    toast.success("Categoria excluída");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.length} categoria(s)</p>
        <Button size="sm" onClick={() => setEditing({ name: "", slug: "", icon: "", sort_order: (data[data.length - 1]?.sort_order ?? 0) + 10 })}>
          <Plus className="mr-1 h-4 w-4" />Nova categoria
        </Button>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 font-semibold">{editing.id ? "Editar" : "Nova"} categoria</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label className="text-xs">Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} maxLength={60} /></div>
            <div><Label className="text-xs">Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} maxLength={50} /></div>
            <div><Label className="text-xs">Ícone (emoji ou nome)</Label><Input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} maxLength={30} /></div>
            <div><Label className="text-xs">Ordem</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button size="sm" onClick={save}>Salvar</Button>
          </div>
        </div>
      ) : null}

      {isLoading ? <Loading /> : (
        <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
          {data.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium">{c.icon ? `${c.icon} ` : ""}{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug} · ordem {c.sort_order ?? 0}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({ id: c.id, name: c.name, slug: c.slug, icon: c.icon ?? "", sort_order: c.sort_order ?? 0 })}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <ConfirmDestructive
                  trigger={<Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-3 w-3" /></Button>}
                  title="Excluir categoria?"
                  description={<><p>Isso pode afetar empresas vinculadas a <strong>{c.name}</strong>. Recomendamos mover essas empresas para outra categoria antes.</p></>}
                  confirmText="Excluir"
                  onConfirm={() => remove(c.id, c.name)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===========================================================
   PALAVRAS PROIBIDAS
=========================================================== */
function BannedWordsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "banned-words"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("banned_words").select("id, word").order("word");
      if (error) throw error;
      return data;
    },
  });
  const [word, setWord] = useState("");

  async function add() {
    const w = word.trim().toLowerCase();
    if (w.length < 2) { toast.error("Palavra muito curta."); return; }
    const { data: ins, error } = await supabase.from("banned_words").insert({ word: w }).select("id").single();
    if (error) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, "banned_word.add", "banned_word", ins.id, { word: w });
    setWord("");
    toast.success("Palavra adicionada");
    qc.invalidateQueries({ queryKey: key });
  }

  async function remove(id: string, w: string) {
    const { error } = await supabase.from("banned_words").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, "banned_word.remove", "banned_word", id, { word: w });
    toast.success("Palavra removida");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Nova palavra…" maxLength={40} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
      </div>
      {isLoading ? <Loading /> : data.length === 0 ? <Empty>Nenhuma palavra cadastrada.</Empty> : (
        <ul className="flex flex-wrap gap-2">
          {data.map((b) => (
            <li key={b.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm shadow-soft">
              <span className="font-mono text-xs">{b.word}</span>
              <ConfirmDestructive
                trigger={<button className="text-muted-foreground hover:text-destructive" aria-label="Remover"><X className="h-3 w-3" /></button>}
                title="Remover palavra?"
                description={<p>A palavra <code className="font-mono">{b.word}</code> deixará de bloquear novos comentários.</p>}
                onConfirm={() => remove(b.id, b.word)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===========================================================
   USUÁRIOS
=========================================================== */
function UsersTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "users"];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_banned, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = profiles.map((p) => p.id);
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      return profiles.map((p) => ({ ...p, is_admin: adminSet.has(p.id) }));
    },
  });
  const [filter, setFilter] = useState("");
  const filtered = data.filter((u) => !filter || (u.full_name ?? "").toLowerCase().includes(filter.toLowerCase()) || u.id.includes(filter));

  async function toggleBan(id: string, banned: boolean, name: string | null) {
    const { error } = await supabase.from("profiles").update({ is_banned: !banned }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, banned ? "user.unban" : "user.ban", "user", id, { name });
    toast.success(!banned ? "Usuário banido" : "Banimento removido");
    qc.invalidateQueries({ queryKey: key });
  }

  async function promote(id: string, name: string | null) {
    const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    if (user) await logAdminAction(user.id, "user.promote_admin", "user", id, { name });
    toast.success("Usuário promovido a administrador");
    qc.invalidateQueries({ queryKey: key });
  }

  async function demote(id: string, name: string | null) {
    if (user && id === user.id) { toast.error("Você não pode remover o seu próprio acesso admin."); return; }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
    if (error) { toast.error(error.message); return; }
    await logAdminAction(user!.id, "user.demote_admin", "user", id, { name });
    toast.success("Acesso admin removido");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="mt-4 space-y-3">
      <Input placeholder="Filtrar por nome ou ID…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      {isLoading ? <Loading /> : filtered.length === 0 ? <Empty>Nenhum usuário encontrado.</Empty> : (
        <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
          {filtered.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-semibold">
                  {u.full_name ?? "(sem nome)"}
                  {u.is_admin ? <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Admin</span> : null}
                  {u.is_banned ? <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Banido</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}… · {new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.is_admin ? (
                  <ConfirmDestructive
                    trigger={<Button size="sm" variant="outline"><ShieldOff className="mr-1 h-3 w-3" />Remover admin</Button>}
                    title="Remover acesso de administrador?"
                    description={<p>O usuário <strong>{u.full_name ?? u.id.slice(0, 8)}</strong> deixará de ter acesso ao painel administrativo.</p>}
                    requirePhrase="REMOVER ADMIN"
                    confirmText="Remover acesso admin"
                    onConfirm={() => demote(u.id, u.full_name)}
                  />
                ) : (
                  <ConfirmDestructive
                    trigger={<Button size="sm" variant="outline"><Shield className="mr-1 h-3 w-3" />Promover a admin</Button>}
                    title="Promover a administrador?"
                    description={<><p>O usuário <strong>{u.full_name ?? u.id.slice(0, 8)}</strong> terá acesso total ao painel administrativo, incluindo aprovar empresas, moderar conteúdo, gerenciar usuários e outros admins.</p><p className="text-destructive">Esta é uma ação sensível. Tenha certeza de que confia neste usuário.</p></>}
                    requirePhrase="PROMOVER ADMIN"
                    confirmText="Promover a admin"
                    onConfirm={() => promote(u.id, u.full_name)}
                  />
                )}
                <ConfirmDestructive
                  trigger={<Button size="sm" variant={u.is_banned ? "outline" : "destructive"}>{u.is_banned ? "Desbanir" : "Banir"}</Button>}
                  title={u.is_banned ? "Remover banimento?" : "Banir usuário?"}
                  description={u.is_banned
                    ? <p>O usuário voltará a poder usar a plataforma normalmente.</p>
                    : <p>O usuário <strong>{u.full_name ?? u.id.slice(0, 8)}</strong> será marcado como banido. Considere também rejeitar suas empresas e comentários.</p>}
                  requirePhrase={u.is_banned ? undefined : "BANIR"}
                  confirmText={u.is_banned ? "Desbanir" : "Banir"}
                  onConfirm={() => toggleBan(u.id, u.is_banned, u.full_name)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===========================================================
   AUDITORIA
=========================================================== */
function AuditLogTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, actor_id, action, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loading />;
  if (data.length === 0) return <Empty>Nenhuma ação registrada ainda.</Empty>;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <History className="h-3 w-3" /> Últimas {data.length} ações
      </div>
      <ul className="divide-y">
        {data.map((row) => (
          <li key={row.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[160px_1fr]">
            <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</span>
            <div className="min-w-0">
              <p><code className="rounded bg-muted px-1 font-mono text-xs">{row.action}</code> · {row.entity_type}{row.entity_id ? ` ${row.entity_id.toString().slice(0, 8)}…` : ""}</p>
              <p className="text-xs text-muted-foreground">por {row.actor_id.slice(0, 8)}…</p>
              {row.details ? <pre className="mt-1 max-w-full overflow-x-auto rounded bg-muted/50 p-2 text-[11px]">{JSON.stringify(row.details, null, 2)}</pre> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===========================================================
   HELPERS
=========================================================== */
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
function Loading() {
  return <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>;
}
