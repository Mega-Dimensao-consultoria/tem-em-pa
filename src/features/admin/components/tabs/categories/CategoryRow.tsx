import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import type { AdminCategory } from "@/features/admin/functions/categories";
import { useDeleteCategory } from "@/features/admin/functions/categories";
import type { EditingCategory } from "./CategoryFormCard";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryRow({
  category,
  onEdit,
}: {
  category: AdminCategory;
  onEdit: (editing: EditingCategory) => void;
}) {
  const deleteCategory = useDeleteCategory();

  const startEdit = () =>
    onEdit({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? "",
      sort_order: category.sort_order ?? 0,
    });

  return (
    <tr className="border-t border-border transition hover:bg-muted/40">
      <td className="px-4 py-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <CategoryIcon name={category.icon} />
        </span>
        <span className="sr-only">Ícone: {category.icon || "padrão"}</span>
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
                Isso pode afetar empresas vinculadas a{" "}
                <strong>{category.name}</strong>. Recomendamos mover essas
                empresas para outra categoria antes.
              </p>
            }
            confirmText="Excluir"
            onConfirm={() =>
              deleteCategory.mutate({ id: category.id, name: category.name })
            }
          />
        </div>
      </td>
    </tr>
  );
}
