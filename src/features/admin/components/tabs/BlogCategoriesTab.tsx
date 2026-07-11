import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { Empty, Loading, slugify } from "../admin-ui";
import {
  useAdminBlogCategories,
  useDeleteBlogCategory,
  useSaveBlogCategory,
  type BlogCategoryInput,
} from "@/features/blog/hooks/useBlogAdmin";
import type { BlogCategory } from "@/features/blog/lib/types";
import { SeoOverrideDialog } from "@/features/seo/components/SeoOverrideDialog";

const EMPTY: BlogCategoryInput = { name: "", slug: "", description: "", is_active: true };

export function BlogCategoriesTab() {
  const { data = [], isLoading } = useAdminBlogCategories();
  const [editing, setEditing] = useState<BlogCategoryInput | null>(null);
  const [seoForId, setSeoForId] = useState<string | null>(null);
  const save = useSaveBlogCategory();
  const remove = useDeleteBlogCategory();
  const seoCat = seoForId ? data.find((c) => c.id === seoForId) ?? null : null;

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Categorias do blog</h3>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="mr-1 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Nenhuma categoria criada ainda.</Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Nome</th>
                <th scope="col" className="px-4 py-3 font-medium">Slug</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((c: BlogCategory) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">/blog/categoria/{c.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar ${c.name}`}
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            name: c.name,
                            slug: c.slug,
                            description: c.description,
                            is_active: c.is_active,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar SEO de ${c.name}`}
                        onClick={() => setSeoForId(c.id)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <ConfirmDestructive
                        title="Excluir categoria?"
                        description={`A categoria "${c.name}" será excluída. Posts associados ficam sem categoria.`}
                        confirmText="Excluir"
                        onConfirm={() => remove.mutate(c.id)}
                        trigger={
                          <Button size="icon" variant="ghost" aria-label={`Excluir ${c.name}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <Dialog open onOpenChange={(o) => (o ? null : setEditing(null))}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  autoFocus
                  value={editing.name}
                  maxLength={80}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      name: e.target.value,
                      slug: editing.id ? editing.slug : slugify(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={editing.slug ?? ""}
                  maxLength={80}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  URL: /blog/categoria/{editing.slug || "exemplo"}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  maxLength={300}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm font-medium">Ativa</span>
                <Switch
                  checked={editing.is_active}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button
                onClick={() =>
                  save.mutate(editing, { onSuccess: () => setEditing(null) })
                }
                disabled={save.isPending || !editing.name.trim()}
              >
                {save.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {seoCat ? (
        <SeoOverrideDialog
          table="blog_categories"
          id={seoCat.id}
          open={!!seoForId}
          onOpenChange={(v) => (v ? null : setSeoForId(null))}
          title={seoCat.name}
          previewUrl={`https://www.temnaminhacidade.com.br/blog/categoria/${seoCat.slug}`}
          initial={{
            seo_title: seoCat.seo_title,
            seo_description: seoCat.seo_description,
            og_image_url: seoCat.og_image_url,
            canonical_url: seoCat.canonical_url,
            noindex: seoCat.noindex,
          }}
          invalidateKeys={[["admin", "blog", "categories"], ["blog", "categories"]]}
        />
      ) : null}
    </div>
  );
}
