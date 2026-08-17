import { useState } from "react";
import { Search, Edit, Power, PowerOff, Filter, ShoppingBag, Store, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminPagination, DEFAULT_PAGE_SIZE } from "../AdminPagination";
import { Loading, Empty } from "../admin-ui";
import { 
  getAdminProducts, 
  updateProductAdmin, 
  toggleCompanyProducts,
  getProductCategories 
} from "@/features/products/functions/marketplace.functions";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";

export function MarketplaceAdminTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, pageSize, search, status, categoryId],
    queryFn: () => getAdminProducts({ 
      page, 
      pageSize, 
      search, 
      status, 
      categoryId: categoryId === "all" ? undefined : categoryId 
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => getProductCategories(),
  });

  const updateProduct = useMutation({
    mutationFn: (args: { id: string; updates: any }) => updateProductAdmin(args),
    onSuccess: () => {
      toast.success("Produto atualizado");
      setEditingProduct(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleCompany = useMutation({
    mutationFn: (args: { companyId: string; isActive: boolean }) => toggleCompanyProducts(args),
    onSuccess: () => {
      toast.success("Produtos da empresa atualizados");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleEditSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateProduct.mutate({
      id: editingProduct.id,
      updates: {
        name: fd.get("name") as string,
        description: fd.get("description") as string,
        price: fd.get("price") ? Number(fd.get("price")) : null,
        product_category_id: fd.get("categoryId") === "none" ? null : fd.get("categoryId") as string,
      }
    });
  };

  return (
    <section className="mt-4 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Marketplace
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os produtos e anúncios do site.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar produtos..." 
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <Select value={status} onValueChange={(v: any) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty>Nenhum produto encontrado com os filtros atuais.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url_1 && (
                        <img src={p.image_url_1} className="h-10 w-10 rounded-lg object-cover" alt="" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground line-clamp-1">{p.name}</p>
                        {p.is_promoted && (
                          <Badge variant="secondary" className="h-4 text-[9px] bg-primary/10 text-primary uppercase">Destaque</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Store className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{p.company?.name || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {p.price ? `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.product_category?.name ? (
                      <Badge variant="outline" className="font-normal">{p.product_category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Sem cat. fixa</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_active ? "default" : "secondary"} className={p.is_active ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20" : ""}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setEditingProduct(p)} title="Editar produto">
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <ConfirmDestructive
                        trigger={
                          <Button size="icon" variant="ghost" className="text-amber-600 hover:bg-amber-50" title={p.is_active ? "Pausar anúncio" : "Ativar anúncio"}>
                            {p.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        }
                        title={p.is_active ? "Pausar este anúncio?" : "Reativar este anúncio?"}
                        description={`O produto "${p.name}" ficará ${p.is_active ? "oculto" : "visível"} no marketplace.`}
                        onConfirm={() => updateProduct.mutate({ id: p.id, updates: { is_active: !p.is_active } })}
                      />

                      <ConfirmDestructive
                        trigger={
                          <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" title="Desativar TODOS da empresa">
                            <Store className="h-4 w-4" />
                          </Button>
                        }
                        title="Gerenciar todos os produtos desta empresa?"
                        description={`Deseja desativar TODOS os produtos cadastrados por "${p.company?.name}"?`}
                        confirmText="Desativar Todos"
                        onConfirm={() => toggleCompany.mutate({ companyId: p.company_id, isActive: false })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          firstItem={(page - 1) * pageSize + 1}
          lastItem={Math.min(page * pageSize, total)}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          label="produtos"
        />
      )}

      <Dialog open={!!editingProduct} onOpenChange={(o) => !o && setEditingProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Produto (Admin)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input id="name" name="name" defaultValue={editingProduct?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria Fixa</Label>
              <Select name="categoryId" defaultValue={editingProduct?.product_category_id || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={editingProduct?.description || ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>Cancelar</Button>
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
