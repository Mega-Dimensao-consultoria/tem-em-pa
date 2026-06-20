import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { slugify } from "../../admin-ui";
import { useSaveCategory } from "@/features/admin/functions/categories";
import { IconPicker } from "./IconPicker";

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
  const nameId = useId();
  const slugId = useId();
  const orderId = useId();
  const iconId = useId();

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
    <Dialog open onOpenChange={(open) => (open ? null : onCancel())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing.id ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            Defina o nome, a ordem de exibição e escolha um ícone visual para a categoria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Nome</Label>
            <Input
              id={nameId}
              value={editing.name}
              onChange={(e) =>
                onChange({
                  ...editing,
                  name: e.target.value,
                  slug: editing.id ? editing.slug : slugify(e.target.value),
                })
              }
              maxLength={60}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={slugId}>Slug</Label>
            <Input
              id={slugId}
              value={editing.slug}
              onChange={(e) =>
                onChange({ ...editing, slug: slugify(e.target.value) })
              }
              maxLength={50}
              aria-describedby={`${slugId}-help`}
            />
            <p id={`${slugId}-help`} className="text-xs text-muted-foreground">
              Aparece na URL: /categoria/{editing.slug || "exemplo"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={orderId}>Ordem de exibição</Label>
            <Input
              id={orderId}
              type="number"
              value={editing.sort_order}
              onChange={(e) =>
                onChange({ ...editing, sort_order: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={iconId}>Ícone</Label>
            <IconPicker
              id={iconId}
              value={editing.icon}
              onChange={(next) => onChange({ ...editing, icon: next })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saveCategory.isPending}>
            {saveCategory.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
