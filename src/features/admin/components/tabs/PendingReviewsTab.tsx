import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { usePendingReviews, useDecideReview } from "@/features/admin/functions/reviews";
import { Empty, Loading } from "../admin-ui";
import { CityFilterSelect } from "./CityFilterSelect";

export function PendingReviewsTab() {
  const { data = [], isLoading } = usePendingReviews();
  const decide = useDecideReview();
  const [cityId, setCityId] = useState("all");

  const filtered = useMemo(
    () => (cityId === "all" ? data : data.filter((r) => r.companies?.city_id === cityId)),
    [data, cityId],
  );

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="mt-4 flex items-center justify-end">
        <CityFilterSelect value={cityId} onChange={setCityId} />
      </div>
      {filtered.length === 0 ? (
        <Empty>Nenhum comentário em moderação{cityId !== "all" ? " para esta cidade" : ""}.</Empty>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {r.companies?.name ?? "Empresa"}
                    {r.companies?.cities?.slug ? ` · ${r.companies.cities.slug}` : ""} · Nota {r.rating} ·{" "}
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 text-sm">{r.comment ?? "(sem texto)"}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ConfirmDestructive
                    trigger={
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    }
                    title="Rejeitar comentário?"
                    description="O comentário não aparecerá publicamente."
                    onConfirm={() => decide.mutate({ id: r.id, status: "rejected" })}
                  />
                  <Button size="sm" onClick={() => decide.mutate({ id: r.id, status: "approved" })}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
