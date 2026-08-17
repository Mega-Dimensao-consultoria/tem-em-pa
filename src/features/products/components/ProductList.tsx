import { Trash2, Star, Image as ImageIcon } from "lucide-react";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { Button } from "@/components/ui/button";
import { NoProducts } from "@/components/feedback/EmptyState";
import { ProductGridSkeleton } from "@/components/feedback/Skeletons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ProductRowItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_promoted: boolean;
  is_active: boolean;
  image_url_1: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  image_url_5?: string | null;
  image_url_6?: string | null;
  image_url_7?: string | null;
  image_url_8?: string | null;
  image_url_9?: string | null;
  image_url_10?: string | null;
};

export function ProductList({
  products,
  isLoading,
  onDelete,
}: {
  products: ProductRowItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}) {
  if (isLoading) return <ProductGridSkeleton count={4} />;
  
  if (products.length === 0) {
    return (
      <NoProducts 
        title="Nenhum produto ainda" 
        description="Cadastre seus produtos para exibi-los na sua página e no marketplace da cidade." 
      />
    );
  }

  const getPhotoCount = (p: ProductRowItem) => {
    let count = 0;
    for (let i = 1; i <= 10; i++) {
      if ((p as any)[`image_url_${i}`]) count++;
    }
    return count;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {products.map((p) => {
        const photoCount = getPhotoCount(p);
        
        return (
          <div
            key={p.id}
            className={cn(
              "group relative flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-md",
              p.is_promoted && "border-primary/20 bg-primary/[0.02]"
            )}
          >
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
              {p.image_url_1 ? (
                <img
                  src={p.image_url_1}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              {photoCount > 1 && (
                <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  <ImageIcon className="h-2.5 w-2.5" />
                  {photoCount}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">{p.name}</h3>
                  {p.is_promoted && (
                    <Badge variant="secondary" className="h-5 gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 shrink-0">
                      <Star className="h-3 w-3 fill-primary" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Promovido</span>
                    </Badge>
                  )}
                </div>
                
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {p.price != null && (
                    <span className="text-sm font-bold text-primary">
                      R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {p.category && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {p.category}
                    </span>
                  )}
                </div>

                {p.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  p.is_active ? "text-emerald-500" : "text-amber-500"
                )}>
                  {p.is_active ? "Ativo" : "Pausado"}
                </span>

                <ConfirmDestructive
                  trigger={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Excluir produto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  title="Excluir produto?"
                  description={<p>O produto <strong>{p.name}</strong> será removido permanentemente do seu catálogo e do marketplace.</p>}
                  confirmText="Sim, excluir"
                  onConfirm={() => onDelete(p.id)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}