import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Archive, Search as SearchIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { Empty, Loading } from "../admin-ui";
import { BlogPostEditor } from "./BlogPostEditor";
import {
  useAdminBlogCategories,
  useAdminPosts,
  useDeletePost,
  useSetPostStatus,
} from "@/features/blog/hooks/useBlogAdmin";
import type { BlogStatus } from "@/features/blog/lib/types";

const STATUS_LABEL: Record<BlogStatus | "all", string> = {
  all: "Todos",
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export function BlogPostsTab() {
  const [status, setStatus] = useState<BlogStatus | "all">("all");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);

  const { data: categories = [] } = useAdminBlogCategories();
  const { data: posts = [], isLoading } = useAdminPosts({
    status,
    categoryId,
    search: search.trim() || undefined,
  });
  const setStatusMut = useSetPostStatus();
  const remove = useDeletePost();

  return (
    <div className="mt-4 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as BlogStatus | "all")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["all", "draft", "published", "archived"] as const).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryId ?? "all"}
            onValueChange={(v) => setCategoryId(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-52"><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setEditing({ id: null })}>
          <Plus className="mr-1 h-4 w-4" /> Novo post
        </Button>
      </header>

      {isLoading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <Empty>Nenhum post encontrado com esses filtros.</Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Título</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Publicação</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="max-w-md px-4 py-3">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/blog/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.published_at
                      ? new Date(p.published_at).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {p.status === "published" && (
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          aria-label={`Abrir ${p.title}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar ${p.title}`}
                        onClick={() => setEditing({ id: p.id })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {p.status !== "published" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Publicar"
                          title="Publicar"
                          onClick={() => setStatusMut.mutate({ id: p.id, status: "published" })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Despublicar"
                          title="Mover para rascunho"
                          onClick={() => setStatusMut.mutate({ id: p.id, status: "draft" })}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      {p.status !== "archived" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Arquivar"
                          title="Arquivar"
                          onClick={() => setStatusMut.mutate({ id: p.id, status: "archived" })}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <ConfirmDestructive
                        title="Excluir post?"
                        description={`O post "${p.title}" será excluído permanentemente.`}
                        confirmText="Excluir"
                        onConfirm={() => remove.mutate(p.id)}
                      >
                        <Button size="icon" variant="ghost" aria-label={`Excluir ${p.title}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </ConfirmDestructive>
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
          <DialogContent className="max-h-[95vh] max-w-6xl overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>{editing.id ? "Editar post" : "Novo post"}</DialogTitle>
            </DialogHeader>
            <BlogPostEditor postId={editing.id} onClose={() => setEditing(null)} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: BlogStatus }) {
  const map: Record<BlogStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-primary/10 text-primary",
    archived: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  const label = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" }[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {label}
    </span>
  );
}
