import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Save, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import type { MyReviewRow } from "../hooks/useMyReviews";
import { useDeleteMyReview, useUpdateMyReview } from "../hooks/useMyReviews";

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  approved: {
    text: "Publicada",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  pending_moderation: {
    text: "Em moderação",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  rejected: { text: "Removida", tone: "bg-destructive/15 text-destructive" },
};

type Props = { row: MyReviewRow };

/** A single user-owned review with inline edit + delete controls. */
export function MyReviewCard({ row }: Props) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(row.rating);
  const [comment, setComment] = useState(row.comment ?? "");
  const [hover, setHover] = useState(0);
  const update = useUpdateMyReview();
  const remove = useDeleteMyReview();
  const status =
    STATUS_LABEL[row.status] ?? {
      text: row.status,
      tone: "bg-muted text-foreground",
    };

  function cancel() {
    setEditing(false);
    setRating(row.rating);
    setComment(row.comment ?? "");
  }

  async function save() {
    if (rating < 1 || rating > 5) {
      toast.error("Selecione de 1 a 5 estrelas");
      return;
    }
    await update.mutateAsync({
      id: row.id,
      rating,
      comment: comment.trim() || null,
    });
    setEditing(false);
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {row.company?.logo_url ? (
            <img
              src={row.company.logo_url}
              alt={row.company.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted" />
          )}
          <div>
            {row.company ? (
              <Link
                to="/empresa/$id"
                params={{ id: row.company.id }}
                className="font-semibold hover:underline"
              >
                {row.company.name}
              </Link>
            ) : (
              <span className="font-semibold text-muted-foreground">
                Empresa removida
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.tone}`}
        >
          {status.text}
        </span>
      </header>

      <div className="mt-4">
        {editing ? (
          <>
            <div className="mb-2 flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrelas`}
                >
                  <Star
                    className={`h-6 w-6 transition ${
                      (hover || rating) >= n
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Conte como foi sua experiência (opcional)"
            />
          </>
        ) : (
          <>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${
                    n <= row.rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            {row.comment ? (
              <p className="mt-2 text-sm">{row.comment}</p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">
                Sem comentário
              </p>
            )}
          </>
        )}
      </div>

      {row.owner_reply ? (
        <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resposta do dono
          </p>
          <p className="mt-1">{row.owner_reply}</p>
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={save} disabled={update.isPending}>
              <Save className="h-4 w-4" />{" "}
              {update.isPending ? "Salvando…" : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancel}
              disabled={update.isPending}
            >
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <ConfirmDestructive
              trigger={
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              }
              title="Excluir avaliação?"
              description="Esta ação é definitiva. Sua avaliação será removida da página da empresa."
              confirmText="Excluir"
              onConfirm={() => remove.mutate(row.id)}
            />
          </>
        )}
      </footer>
    </article>
  );
}
