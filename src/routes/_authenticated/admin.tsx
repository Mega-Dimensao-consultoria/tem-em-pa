import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/use-auth";
import { ShieldAlert } from "lucide-react";
import { AdminStats } from "@/components/admin/AdminStats";
import { PendingCompaniesTab } from "@/components/admin/tabs/PendingCompaniesTab";
import { PendingClaimsTab } from "@/components/admin/tabs/PendingClaimsTab";
import { PendingReviewsTab } from "@/components/admin/tabs/PendingReviewsTab";
import { ReportsTab } from "@/components/admin/tabs/ReportsTab";
import { CategoriesTab } from "@/components/admin/tabs/CategoriesTab";
import { BannedWordsTab } from "@/components/admin/tabs/BannedWordsTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { AuditLogTab } from "@/components/admin/tabs/AuditLogTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Tem em P.A" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useRoles();

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">
          Carregando permissões…
        </div>
      </PageShell>
    );
  }
  if (!isAdmin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é exclusiva para administradores.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modere conteúdo, gerencie categorias e usuários.
        </p>

        <AdminStats />

        <Tabs defaultValue="empresas" className="mt-8">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="reivindicacoes">Reivindicações</TabsTrigger>
            <TabsTrigger value="comentarios">Comentários</TabsTrigger>
            <TabsTrigger value="denuncias">Denúncias</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="palavras">Palavras proibidas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas"><PendingCompaniesTab /></TabsContent>
          <TabsContent value="reivindicacoes"><PendingClaimsTab /></TabsContent>
          <TabsContent value="comentarios"><PendingReviewsTab /></TabsContent>
          <TabsContent value="denuncias"><ReportsTab /></TabsContent>
          <TabsContent value="categorias"><CategoriesTab /></TabsContent>
          <TabsContent value="palavras"><BannedWordsTab /></TabsContent>
          <TabsContent value="usuarios"><UsersTab /></TabsContent>
          <TabsContent value="auditoria"><AuditLogTab /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}
