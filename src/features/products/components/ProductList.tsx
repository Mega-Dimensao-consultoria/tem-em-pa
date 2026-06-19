import { Trash2 } from "lucide-react";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { Button } from "@/components/ui/button";

export type ProductRowItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url_1: string | null;
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
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Nenhum produto ainda.
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
        >
          {p.image_url_1 ? (
            <img
              src={p.image_url_1}
              alt=""
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-muted" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{p.name}</p>
            {p.price != null ? (
              <p className="text-sm font-bold text-primary">
                R$ {Number(p.price).toFixed(2)}
              </p>
            ) : null}
            {p.description ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {p.description}
              </p>
            ) : null}
          </div>
          <ConfirmDestructive
            trigger={
              <Button
                size="sm"
                variant="ghost"
                className="self-start text-muted-foreground hover:text-destructive"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Excluir produto?"
            description={<p>O produto será removido permanentemente.</p>}
            confirmText="Excluir"
            onConfirm={() => onDelete(p.id)}
          />
        </li>
      ))}
    </ul>
  );
}
