import { useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import type { AdminCategory } from "@/features/admin/functions/categories";
import { useDeleteCategory } from "@/features/admin/functions/categories";
import type { EditingCategory } from "./CategoryFormCard";
import { CategoryIcon } from "./CategoryIcon";
import { SeoOverrideDialog } from "@/features/seo/components/SeoOverrideDialog";
import { adminKeys } from "@/features/admin/functions/keys";

export function CategoryRow({
  category,
  onEdit,
  type = "company",
}: {
  category: AdminCategory;
  onEdit: (editing: EditingCategory) => void;
  type?: "company" | "product";
}) {
  const deleteCategory = useDeleteCategory(type);
  const [seoOpen, setSeoOpen] = useState(false);

  const startEdit = () =>
    onEdit({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? "",
      sort_order: category.sort_order ?? 0,
      type,
    });

  return (
    <tr className="border-t border-border transition hover:bg-muted/40">
      <td className="px-4 py-3">
        {type === "company" ? (
          <>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CategoryIcon name={category.icon} />
            </span>
            <span className="sr-only">Ícone: {category.icon || "padrão"}</span>
          </>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={startEdit}
          className="text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {category.name}
        </button>
        <p className="text-xs text-muted-foreground">/{category.slug}</p>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
        {category.sort_order ?? 0}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={startEdit}
            aria-label={`Editar categoria ${category.name}`}
          >
            <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
          {type === "company" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSeoOpen(true)}
              aria-label={`Editar SEO da categoria ${category.name}`}
            >
              <Search className="mr-1 h-4 w-4" aria-hidden="true" />
              SEO
            </Button>
          )}
          <ConfirmDestructive
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                aria-label={`Excluir categoria ${category.name}`}
              >
                <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                Excluir
              </Button>
            }
            title="Excluir categoria?"
            description={
              <p>
                Isso pode afetar {type === "company" ? "empresas" : "produtos"} vinculados a{" "}
                <strong>{category.name}</strong>. Recomendamos mover esses
                itens para outra categoria antes.
              </p>
            }
            confirmText="Excluir"
            onConfirm={() =>
              deleteCategory.mutate({ id: category.id, name: category.name })
            }
          />
        </div>
      </td>
      {type === "company" && (
        <SeoOverrideDialog
          table="categories"
          id={category.id}
          open={seoOpen}
          onOpenChange={setSeoOpen}
          title={category.name}
          previewUrl={`https://www.temnaminhacidade.com.br/exemplo/categoria/${category.slug}`}
          initial={{
            seo_title: category.seo_title,
            seo_description: category.seo_description,
            og_image_url: category.og_image_url,
            canonical_url: category.canonical_url,
            noindex: category.noindex,
          }}
          invalidateKeys={[adminKeys.categories()]}
        />
      )}
    </tr>
  );
}
