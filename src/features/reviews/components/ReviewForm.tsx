import { toastError } from "@/lib/safe";
import { useRef, useState } from "react";
import { z } from "zod";
import { Star, ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

const MAX_PHOTOS = 3;
const MAX_MB = 5;

export function ReviewForm({ companyId, userId, onSubmitted }: { companyId: string; userId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        if (!file.type.startsWith("image/")) { toast.error("Envie apenas imagens"); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Imagem acima de ${MAX_MB}MB`); continue; }
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
        const { error } = await supabase.storage
          .from("review-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (error) { toastError(error); continue; }
        uploaded.push(supabase.storage.from("review-photos").getPublicUrl(path).data.publicUrl);
      }
      setPhotos((p) => [...p, ...uploaded].slice(0, MAX_PHOTOS));
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setPhotos((p) => p.filter((u) => u !== url));
  }

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
      photos,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("Você já avaliou esta empresa.");
      else toastError(error);
      return;
    }
    toast.success("Avaliação enviada! Pode passar por moderação.");
    setRating(0); setComment(""); setPhotos([]);
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

      {photos.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fotos da avaliação">
          {photos.map((u) => (
            <li key={u} className="relative">
              <img src={u} alt="Foto anexada" className="h-16 w-16 rounded-lg border border-border object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(u)}
                aria-label="Remover foto"
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || photos.length >= MAX_PHOTOS}
          >
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
            Fotos ({photos.length}/{MAX_PHOTOS})
          </Button>
        </div>
        <Button type="submit" disabled={loading || rating === 0}>{loading ? "Enviando…" : "Enviar avaliação"}</Button>
      </div>
    </form>
  );
}
