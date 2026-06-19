import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { slugify } from "../../admin-ui";
import { useSaveCategory } from "@/lib/admin/categories";

export type EditingCategory = {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
};

export function CategoryFormCard({
  editing,
  onChange,
  onCancel,
  onSaved,
}: {
  editing: EditingCategory;
  onChange: (next: EditingCategory) => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const saveCategory = useSaveCategory();

  function save() {
    const name = editing.name.trim();
    if (!name) {
      toast.error("Informe o nome.");
      return;
    }
    saveCategory.mutate(
      {
        id: editing.id,
        name,
        slug: editing.slug.trim() || slugify(name),
        icon: editing.icon.trim() || null,
        sort_order: editing.sort_order || 0,
      },
      { onSuccess: onSaved },
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h3 className="mb-3 font-semibold">{editing.id ? "Editar" : "Nova"} categoria</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Nome</Label>
          <Input
            value={editing.name}
            onChange={(e) =>
              onChange({
                ...editing,
                name: e.target.value,
                slug: editing.id ? editing.slug : slugify(e.target.value),
              })
            }
            maxLength={60}
          />
        </div>
        <div>
          <Label className="text-xs">Slug</Label>
          <Input
            value={editing.slug}
            onChange={(e) => onChange({ ...editing, slug: slugify(e.target.value) })}
            maxLength={50}
          />
        </div>
        <div>
          <Label className="text-xs">Ícone (emoji ou nome)</Label>
          <Input
            value={editing.icon}
            onChange={(e) => onChange({ ...editing, icon: e.target.value })}
            maxLength={30}
          />
        </div>
        <div>
          <Label className="text-xs">Ordem</Label>
          <Input
            type="number"
            value={editing.sort_order}
            onChange={(e) =>
              onChange({ ...editing, sort_order: Number(e.target.value) })
            }
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={save} disabled={saveCategory.isPending}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
