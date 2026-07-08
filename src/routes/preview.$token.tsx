import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { MarkdownRenderer } from "@/features/content/components/MarkdownRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundState } from "@/components/feedback/NotFoundState";
import { ErrorState } from "@/components/feedback/ErrorState";

export const Route = createFileRoute("/preview/$token")({
  head: () => ({
    meta: [
      { title: "Pré-visualização de rascunho" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  errorComponent: () => <ErrorState />,
  notFoundComponent: () => (
    <PageShell>
      <NotFoundState title="Rascunho não encontrado" description="O link pode ter sido revogado." />
    </PageShell>
  ),
  component: PreviewPage,
});

type Version = {
  slug: string;
  title: string;
  content_md: string;
  created_at: string;
};

function PreviewPage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["site-page-preview", token],
    queryFn: async (): Promise<Version | null> => {
      const { data, error } = await supabase
        .from("site_pages_versions")
        .select("slug, title, content_md, created_at")
        .eq("preview_token", token)
        .maybeSingle();
      if (error) throw error;
      return data as Version | null;
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl space-y-3 px-4 py-10">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </section>
      </PageShell>
    );
  }
  if (error) throw error;
  if (!data) throw notFound();

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-center text-xs font-semibold text-amber-700 dark:text-amber-300">
          Pré-visualização de rascunho — não publicado
        </div>
        <h1 className="mb-4 font-display text-3xl font-bold">{data.title}</h1>
        <MarkdownRenderer content={data.content_md} />
        <p className="mt-6 text-xs text-muted-foreground">
          Salvo em {new Date(data.created_at).toLocaleString("pt-BR")}
        </p>
      </section>
    </PageShell>
  );
}
