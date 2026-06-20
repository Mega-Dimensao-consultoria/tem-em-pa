import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Star, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { useAuth } from "@/features/auth/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel/avaliacoes")({
  head: () => ({ meta: [{ title: "Minhas avaliações — Tem em P.A" }] }),
  component: MinhasAvaliacoes,
});

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
  company: { id: string; name: string; logo_url: string | null } | null;
};

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  approved: { text: "Publicada", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  pending_moderation: { text: "Em moderação", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  rejected: { text: "Removida", tone: "bg-destructive/15 text-destructive" },
};

function MinhasAvaliacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["my-reviews", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, rating, comment, status, created_at, owner_reply, owner_reply_at, company:company_id(id, name, logo_url)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação excluída.");
      qc.invalidateQueries({ queryKey: ["my-reviews", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/painel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Minhas avaliações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja, edite ou remova as avaliações que você deixou para empresas da cidade.
        </p>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Você ainda não avaliou nenhuma empresa. Visite uma página de empresa para deixar
                sua opinião.
              </p>
              <Button asChild className="mt-4">
                <Link to="/buscar">Procurar empresas</Link>
              </Button>
            </div>
          ) : (
            data.map((r) => (
              <ReviewCard
                key={r.id}
                row={r}
                onDelete={() => remove.mutate(r.id)}
                onSaved={() => qc.invalidateQueries({ queryKey: ["my-reviews", user?.id] })}
              />
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}

function ReviewCard({
  row,
  onDelete,
  onSaved,
}: {
  row: Row;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(row.rating);
  const [comment, setComment] = useState(row.comment ?? "");
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const status = STATUS_LABEL[row.status] ?? { text: row.status, tone: "bg-muted text-foreground" };

  async function save() {
    if (rating < 1 || rating > 5) {
      toast.error("Selecione de 1 a 5 estrelas");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("reviews")
      .update({ rating, comment: comment.trim() || null })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Avaliação atualizada. Pode passar por moderação novamente.");
    setEditing(false);
    onSaved();
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
              <span className="font-semibold text-muted-foreground">Empresa removida</span>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>
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
                      (hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground"
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
                    n <= row.rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            {row.comment ? (
              <p className="mt-2 text-sm">{row.comment}</p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">Sem comentário</p>
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
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setRating(row.rating);
                setComment(row.comment ?? "");
              }}
              disabled={saving}
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
              onConfirm={onDelete}
            />
          </>
        )}
      </footer>
    </article>
  );
}
