import { useState } from "react";
import { z } from "zod";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export function ReviewForm({ companyId, userId, onSubmitted }: { companyId: string; userId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ rating, comment });
    if (!parsed.success) { toast.error("Selecione de 1 a 5 estrelas"); return; }
    setLoading(true);
    const { error } = await supabase.from("reviews").insert({
      company_id: companyId,
      user_id: userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("Você já avaliou esta empresa.");
      else toastError(error);
      return;
    }
    toast.success("Avaliação enviada! Pode passar por moderação.");
    setRating(0); setComment("");
    onSubmitted();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="mb-2 text-sm font-semibold">Sua avaliação</p>
      <div className="mb-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} estrelas`}>
            <Star className={`h-7 w-7 transition ${(hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000} placeholder="Conte como foi sua experiência (opcional)" />
      <Button type="submit" className="mt-3" disabled={loading || rating === 0}>{loading ? "Enviando…" : "Enviar avaliação"}</Button>
    </form>
  );
}
