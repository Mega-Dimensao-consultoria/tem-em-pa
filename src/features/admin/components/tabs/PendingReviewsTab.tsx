import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { usePendingReviews, useDecideReview } from "@/features/admin/functions/reviews";
import { Empty, Loading } from "../admin-ui";
import { CityFilterSelect } from "./CityFilterSelect";
import { AdminPagination, usePagination } from "../AdminPagination";

export function PendingReviewsTab() {
  const { data = [], isLoading } = usePendingReviews();
  const decide = useDecideReview();
  const [cityId, setCityId] = useState("all");

  const filtered = useMemo(
    () => (cityId === "all" ? data : data.filter((r) => r.companies?.city_id === cityId)),
    [data, cityId],
  );
  const pg = usePagination(filtered);

  if (isLoading) return <Loading />;

  return (
    <section className="mt-4 space-y-3" aria-labelledby="pending-reviews-heading">
      <h2 id="pending-reviews-heading" className="sr-only">Comentários em moderação</h2>
      <div className="flex items-center justify-end">
        <CityFilterSelect value={cityId} onChange={setCityId} />
      </div>
      {filtered.length === 0 ? (
        <Empty>Nenhum comentário em moderação{cityId !== "all" ? " para esta cidade" : ""}.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <caption className="sr-only">Comentários aguardando moderação.</caption>
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Empresa</th>
                  <th scope="col" className="px-4 py-3 font-medium">Nota</th>
                  <th scope="col" className="px-4 py-3 font-medium">Comentário</th>
                  <th scope="col" className="px-4 py-3 font-medium">Enviado em</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pg.paged.map((r) => (
                  <tr key={r.id} className="border-t border-border transition hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.companies?.name ?? "Empresa"}</p>
                      {r.companies?.cities?.slug ? (
                        <p className="text-xs text-muted-foreground">{r.companies.cities.slug}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.rating}★</td>
                    <td className="max-w-lg px-4 py-3">
                      <p className="line-clamp-3 text-sm">{r.comment ?? "(sem texto)"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ConfirmDestructive
                          trigger={
                            <Button size="sm" variant="outline">
                              <X className="mr-1 h-4 w-4" /> Rejeitar
                            </Button>
                          }
                          title="Rejeitar comentário?"
                          description="O comentário não aparecerá publicamente."
                          onConfirm={() => decide.mutate({ id: r.id, status: "rejected" })}
                        />
                        <Button size="sm" onClick={() => decide.mutate({ id: r.id, status: "approved" })}>
                          <Check className="mr-1 h-4 w-4" /> Aprovar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={pg.page}
            totalPages={pg.totalPages}
            total={pg.total}
            pageSize={pg.pageSize}
            firstItem={pg.firstItem}
            lastItem={pg.lastItem}
            onPageChange={pg.setPage}
            onPageSizeChange={pg.setPageSize}
            label="comentários"
          />
        </>
      )}
    </section>
  );
}
