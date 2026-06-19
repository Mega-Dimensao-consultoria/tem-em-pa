import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "company-logos";
const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function pathFromUrl(url: string): string | null {
  const idx = url.indexOf(`/${BUCKET}/`);
  if (idx === -1) return null;
  return url.slice(idx + BUCKET.length + 2);
}

function validate(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Use JPG, PNG ou WebP.";
  if (file.size > MAX_MB * 1024 * 1024) return `Imagem maior que ${MAX_MB}MB.`;
  return null;
}

interface SingleProps {
  companyId: string;
  kind: "logo" | "cover";
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  aspect?: "square" | "wide";
}

export function SingleImageUpload({ companyId, kind, value, onChange, label, aspect = "square" }: SingleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${companyId}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true, contentType: file.type, cacheControl: "3600",
      });
      if (error) throw error;
      // remove previous
      if (value) {
        const oldPath = pathFromUrl(value);
        if (oldPath && oldPath !== path) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      onChange(publicUrl(path));
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally { setBusy(false); }
  }

  async function handleRemove() {
    if (!value) return;
    const path = pathFromUrl(value);
    setBusy(true);
    try {
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      onChange(null);
    } finally { setBusy(false); }
  }

  const aspectClass = aspect === "wide" ? "aspect-[3/1]" : "aspect-square max-w-[140px]";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className={`${aspectClass} relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/30`}>
        {value ? (
          <>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <button
              type="button" onClick={handleRemove} disabled={busy}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background"
              aria-label="Remover imagem"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          </>
        ) : (
          <button
            type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:bg-muted/50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span>Enviar imagem</span>
            <span className="text-[10px]">JPG/PNG/WebP · até {MAX_MB}MB</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept={ALLOWED.join(",")} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

interface GalleryProps {
  companyId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function GalleryUpload({ companyId, value, onChange, max = 8 }: GalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList) {
    const remaining = max - value.length;
    if (remaining <= 0) { toast.error(`Máximo ${max} fotos`); return; }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    const newUrls: string[] = [];
    try {
      for (const file of list) {
        const err = validate(file);
        if (err) { toast.error(`${file.name}: ${err}`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${companyId}/gallery/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type, cacheControl: "3600",
        });
        if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
        newUrls.push(publicUrl(path));
      }
      if (newUrls.length) {
        onChange([...value, ...newUrls]);
        toast.success(`${newUrls.length} foto(s) adicionada(s)`);
      }
    } finally { setBusy(false); }
  }

  async function removeAt(idx: number) {
    const url = value[idx];
    const path = pathFromUrl(url);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Galeria de fotos ({value.length}/{max})</label>
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy || value.length >= max}
        >
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
          Adicionar
        </Button>
      </div>
      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
          Nenhuma foto ainda. JPG/PNG/WebP · até {MAX_MB}MB cada.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, idx) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button" onClick={() => removeAt(idx)}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100"
                aria-label="Remover foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef} type="file" accept={ALLOWED.join(",")} multiple className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
