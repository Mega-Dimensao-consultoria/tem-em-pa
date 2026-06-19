import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { logAdminAction } from "@/lib/admin-audit";
import { Loading, slugify } from "../admin-ui";

type EditingCategory = {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
};

export function CategoriesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["admin", "categories"];

  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [editing, setEditing] = useState<EditingCategory | null>(null);

  async function save() {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) {
      toast.error("Informe o nome.");
      return;
    }
    const slug = editing.slug.trim() || slugify(name);
    const payload = {
      name,
      slug,
      icon: editing.icon.trim() || null,
      sort_order: editing.sort_order || 0,
    };
    if (editing.id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (user) await logAdminAction(user.id, "category.update", "category", editing.id, payload);
      toast.success("Categoria atualizada");
    } else {
      const { data: ins, error } = await supabase
        .from("categories")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (user) await logAdminAction(user.id, "category.create", "category", ins.id, payload);
      toast.success("Categoria criada");
    }
    setEditing(null);
    qc.invalidateQueries({ queryKey: key });
  }

  async function remove(id: string, name: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) await logAdminAction(user.id, "category.delete", "category", id, { name });
    toast.success("Categoria excluída");
    qc.invalidateQueries({ queryKey: key });
  }

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
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 font-semibold">{editing.id ? "Editar" : "Nova"} categoria</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({
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
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                maxLength={50}
              />
            </div>
            <div>
              <Label className="text-xs">Ícone (emoji ou nome)</Label>
              <Input
                value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                maxLength={30}
              />
            </div>
            <div>
              <Label className="text-xs">Ordem</Label>
              <Input
                type="number"
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={save}>
              Salvar
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <Loading />
      ) : (
        <ul className="divide-y rounded-2xl border border-border bg-card shadow-soft">
          {data.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  /{c.slug} · ordem {c.sort_order ?? 0}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditing({
                      id: c.id,
                      name: c.name,
                      slug: c.slug,
                      icon: c.icon ?? "",
                      sort_order: c.sort_order ?? 0,
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
                      Isso pode afetar empresas vinculadas a <strong>{c.name}</strong>. Recomendamos mover essas empresas para outra categoria antes.
                    </p>
                  }
                  confirmText="Excluir"
                  onConfirm={() => remove(c.id, c.name)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
