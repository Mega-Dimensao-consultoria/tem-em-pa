import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminCategories } from "@/features/admin/functions/categories";
import { Loading } from "../admin-ui";
import {
  CategoryFormCard,
  type EditingCategory,
} from "./categories/CategoryFormCard";
import { CategoryRow } from "./categories/CategoryRow";

export function CategoriesTab() {
  const { data = [], isLoading } = useAdminCategories();
  const [editing, setEditing] = useState<EditingCategory | null>(null);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.length} categoria(s)</p>
        <Button
          size="sm"
          onClick={() =>
            setEditing({
              name: "",
              slug: "",
              icon: "",
              sort_order: (data[data.length - 1]?.sort_order ?? 0) + 10,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {editing ? (
        <CategoryFormCard
          editing={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      ) : null}

      {isLoading ? (
        <Loading />
      ) : (
        <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
          {data.map((c) => (
            <CategoryRow key={c.id} category={c} onEdit={setEditing} />
          ))}
        </ul>
      )}
    </div>
  );
}
