import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/features/auth/use-auth";
import { ShieldAlert } from "lucide-react";
import { AdminStats } from "@/features/admin/components/AdminStats";
import { CompaniesAdminSection } from "@/features/admin/components/tabs/CompaniesAdminSection";
import { PendingClaimsTab } from "@/features/admin/components/tabs/PendingClaimsTab";
import { PendingReviewsTab } from "@/features/admin/components/tabs/PendingReviewsTab";
import { ReportsTab } from "@/features/admin/components/tabs/ReportsTab";
import { CategoriesTab } from "@/features/admin/components/tabs/CategoriesTab";
import { BannedWordsTab } from "@/features/admin/components/tabs/BannedWordsTab";
import { UsersTab } from "@/features/admin/components/tabs/UsersTab";
import { AuditLogTab } from "@/features/admin/components/tabs/AuditLogTab";
import { TwoFaResetRequestsTab } from "@/features/admin/components/tabs/TwoFaResetRequestsTab";
import { PendingRemovalsTab } from "@/features/admin/components/tabs/PendingRemovalsTab";
import { ContactMessagesTab } from "@/features/admin/components/tabs/ContactMessagesTab";
import { SitePagesTab } from "@/features/admin/components/tabs/SitePagesTab";
import { SeoTab } from "@/features/admin/components/tabs/SeoTab";
import { EmailLogTab } from "@/features/admin/components/tabs/EmailLogTab";

import { BlogSection } from "@/features/admin/components/tabs/BlogSection";
import { AdminOverviewTab } from "@/features/admin/components/tabs/AdminOverviewTab";
import { ImportPublicTab } from "@/features/admin/components/tabs/ImportPublicTab";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Tem na minha cidade" },
      { name: "description", content: "Área restrita da equipe Tem na minha cidade para moderar empresas, avaliações, denúncias e usuários do guia local." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useRoles();

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-40 w-full" />
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

        <Tabs defaultValue="visao" className="mt-8">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="reivindicacoes">Reivindicações</TabsTrigger>
            <TabsTrigger value="remocoes">Remoções</TabsTrigger>
            <TabsTrigger value="comentarios">Comentários</TabsTrigger>
            <TabsTrigger value="denuncias">Denúncias</TabsTrigger>
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="palavras">Palavras proibidas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="paginas">Páginas</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="reset2fa">Reset 2FA</TabsTrigger>
            <TabsTrigger value="emails">E-mails</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="importar">Importar</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>


          <TabsContent value="visao"><AdminOverviewTab /></TabsContent>
          <TabsContent value="empresas"><CompaniesAdminSection /></TabsContent>
          <TabsContent value="reivindicacoes"><PendingClaimsTab /></TabsContent>
          <TabsContent value="remocoes"><PendingRemovalsTab /></TabsContent>
          <TabsContent value="comentarios"><PendingReviewsTab /></TabsContent>
          <TabsContent value="denuncias"><ReportsTab /></TabsContent>
          <TabsContent value="contato"><ContactMessagesTab /></TabsContent>
          <TabsContent value="categorias"><CategoriesTab /></TabsContent>
          <TabsContent value="palavras"><BannedWordsTab /></TabsContent>
          <TabsContent value="usuarios"><UsersTab /></TabsContent>
          <TabsContent value="paginas"><SitePagesTab /></TabsContent>
          <TabsContent value="blog"><BlogSection /></TabsContent>
          <TabsContent value="reset2fa"><TwoFaResetRequestsTab /></TabsContent>
          <TabsContent value="emails"><EmailLogTab /></TabsContent>
          <TabsContent value="seo"><SeoTab /></TabsContent>
          <TabsContent value="importar"><ImportPublicTab /></TabsContent>
          <TabsContent value="auditoria"><AuditLogTab /></TabsContent>

        </Tabs>
      </section>
    </PageShell>
  );
}
