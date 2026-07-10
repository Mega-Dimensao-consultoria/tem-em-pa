import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
} from "@/features/products/hooks/useProducts";
import { ProductForm } from "@/features/products/components/ProductForm";
import { ProductList } from "@/features/products/components/ProductList";
import { queryKeys } from "@/lib/queryKeys";

export const Route = createFileRoute("/_authenticated/owner/empresa/$id/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos e serviços da empresa — Tem na cidade" },
      { name: "description", content: "Cadastre e organize o catálogo de produtos e serviços da sua empresa exibido na ficha pública do Tem na cidade." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const company = useQuery({
    queryKey: queryKeys.owner.companyAny(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, owner_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const products = useProducts(id);
  const createProduct = useCreateProduct(id);
  const deleteProduct = useDeleteProduct(id);
  const isOwner = !!user && company.data?.owner_id === user.id;

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/owner">
            <ArrowLeft className="mr-1 h-4 w-4" /> Minhas empresas
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">
          Produtos — {company.data?.name ?? "…"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Até 20 produtos ativos por empresa.
        </p>

        {!isOwner && !company.isLoading ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Você não tem permissão para gerenciar esta empresa.
          </div>
        ) : (
          <>
            <ProductForm
              userId={user?.id}
              submitting={createProduct.isPending}
              onSubmit={(input) => createProduct.mutateAsync(input)}
            />

            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold">Cadastrados</h2>
              <ProductList
                products={products.data ?? []}
                isLoading={products.isLoading}
                onDelete={(pid) => deleteProduct.mutate(pid)}
              />
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
