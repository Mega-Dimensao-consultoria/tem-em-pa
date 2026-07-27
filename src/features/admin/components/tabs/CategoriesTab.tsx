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
import { AdminPagination, usePagination } from "../AdminPagination";

export function CategoriesTab() {
  const { data = [], isLoading } = useAdminCategories();
  const [editing, setEditing] = useState<EditingCategory | null>(null);
  const pg = usePagination(data);

  return (
    <section className="mt-4 space-y-4" aria-labelledby="categories-heading">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="categories-heading" className="text-lg font-semibold">
            Categorias
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.length} categoria{data.length === 1 ? "" : "s"} cadastrada
            {data.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          onClick={() =>
            setEditing({
              name: "",
              slug: "",
              icon: "",
              sort_order: (data[data.length - 1]?.sort_order ?? 0) + 10,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Nova categoria
        </Button>
      </header>

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
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma categoria cadastrada ainda.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Lista de categorias com ícone, nome, ordem e ações disponíveis.
            </caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Ícone
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nome
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Ordem
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {pg.paged.map((c) => (
                <CategoryRow key={c.id} category={c} onEdit={setEditing} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.length > 0 ? (
        <AdminPagination
          page={pg.page}
          totalPages={pg.totalPages}
          total={pg.total}
          pageSize={pg.pageSize}
          firstItem={pg.firstItem}
          lastItem={pg.lastItem}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          label="categorias"
        />
      ) : null}
    </section>
  );
}
