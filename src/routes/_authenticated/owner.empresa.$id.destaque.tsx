import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CompanyDetailSkeleton } from "@/components/feedback/Skeletons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";
import { useOwnerCompany } from "@/features/owner/hooks/useOwnerCompany";
import { PromotionStatusCard } from "@/features/promotions/components/PromotionStatusCard";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/destaque")({
  head: () => ({
    meta: [
      { title: "Destaque da empresa — Tem na minha cidade" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DestaquePage,
});

function DestaquePage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { data: company, isLoading } = useOwnerCompany(id, user?.id);
  const isOwner = !!user && !!company && company.owner_id === user.id;

  if (authLoading || isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <CompanyDetailSkeleton />
        </div>
      </PageShell>
    );
  }
  if (!company || !isOwner) throw notFound();

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner/empresa/$id/dashboard" params={{ id }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao painel
          </Link>
        </Button>
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Destacar {company.name}</h1>
            <p className="text-sm text-muted-foreground">
              Apareça no bloco principal da cidade e da home enquanto seu destaque estiver ativo.
            </p>
          </div>
        </div>
        <PromotionStatusCard companyId={id} />
      </div>
    </PageShell>
  );
}
