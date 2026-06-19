import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import type { AdminCategory } from "@/features/admin/functions/categories";
import { useDeleteCategory } from "@/features/admin/functions/categories";
import type { EditingCategory } from "./CategoryFormCard";

export function CategoryRow({
  category,
  onEdit,
}: {
  category: AdminCategory;
  onEdit: (editing: EditingCategory) => void;
}) {
  const deleteCategory = useDeleteCategory();
  return (
    <li className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="font-medium">
          {category.icon ? `${category.icon} ` : ""}
          {category.name}
        </p>
        <p className="text-xs text-muted-foreground">
          /{category.slug} · ordem {category.sort_order ?? 0}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onEdit({
              id: category.id,
              name: category.name,
              slug: category.slug,
              icon: category.icon ?? "",
              sort_order: category.sort_order ?? 0,
            })
          }
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <ConfirmDestructive
          trigger={
            <Button size="sm" variant="outline" className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          }
          title="Excluir categoria?"
          description={
            <p>
              Isso pode afetar empresas vinculadas a <strong>{category.name}</strong>. Recomendamos mover essas empresas para outra categoria antes.
            </p>
          }
          confirmText="Excluir"
          onConfirm={() =>
            deleteCategory.mutate({ id: category.id, name: category.name })
          }
        />
      </div>
    </li>
  );
}
