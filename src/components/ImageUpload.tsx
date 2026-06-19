import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImagePlus, FileText } from "lucide-react";
import { toast } from "sonner";

const MAX_MB = 5;
const PRIVATE_BUCKETS = new Set(["claim-documents"]);

function publicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function pathFromValue(bucket: string, value: string): string | null {
  if (!value.startsWith("http")) return value; // already a path (private)
  const idx = value.indexOf(`/${bucket}/`);
  if (idx === -1) return null;
  return value.slice(idx + bucket.length + 2);
}

function validate(file: File, accept: string): string | null {
  if (file.size > MAX_MB * 1024 * 1024) return `Arquivo maior que ${MAX_MB}MB.`;
  if (accept && !accept.includes("*")) {
    // basic mime/ext check
    const exts = accept.split(",").map((s) => s.trim().toLowerCase());
    const ok = exts.some((e) => (e.startsWith(".") ? file.name.toLowerCase().endsWith(e) : file.type.startsWith(e.replace("*", ""))));
    if (!ok) return "Tipo de arquivo não permitido.";
  }
  return null;
}

interface ImageUploadProps {
  bucket: string;
  userId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
  accept?: string;
}

export function ImageUpload({ bucket, userId, value, onChange, label, accept = "image/*" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isPrivate = PRIVATE_BUCKETS.has(bucket);
  const isPdf = value && (value.toLowerCase().endsWith(".pdf") || (isPrivate && !value.match(/\.(jpe?g|png|webp|gif)$/i)));

  async function handleFile(file: File) {
    const err = validate(file, accept);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type, cacheControl: "3600", upsert: false,
      });
      if (error) throw error;
      if (value) {
        const oldPath = pathFromValue(bucket, value);
        if (oldPath) await supabase.storage.from(bucket).remove([oldPath]);
      }
      onChange(isPrivate ? path : publicUrl(bucket, path));
      toast.success("Enviado");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally { setBusy(false); }
  }

  async function handleRemove() {
    if (!value) return;
    setBusy(true);
    try {
      const path = pathFromValue(bucket, value);
      if (path) await supabase.storage.from(bucket).remove([path]);
      onChange(null);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-square max-w-[180px] overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">
        {value ? (
          <>
            {isPdf ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted/50 p-3 text-center">
                <FileText className="h-8 w-8 text-primary" />
                <span className="text-[10px] text-muted-foreground">Documento anexado</span>
              </div>
            ) : (
              <img src={isPrivate ? "" : value} alt={label} className="h-full w-full object-cover" />
            )}
            <button
              type="button" onClick={handleRemove} disabled={busy}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow hover:bg-background"
              aria-label="Remover"
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
            <span className="px-2 text-center">{label}</span>
            <span className="text-[10px]">até {MAX_MB}MB</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

interface GalleryUploadProps {
  userId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function GalleryUpload({ userId, value, onChange, max = 8 }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const bucket = "company-logos";

  async function handleFiles(files: FileList) {
    const remaining = max - value.length;
    if (remaining <= 0) { toast.error(`Máximo ${max} fotos`); return; }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    const newUrls: string[] = [];
    try {
      for (const file of list) {
        const err = validate(file, "image/*");
        if (err) { toast.error(`${file.name}: ${err}`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/gallery-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          contentType: file.type, cacheControl: "3600",
        });
        if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
        newUrls.push(publicUrl(bucket, path));
      }
      if (newUrls.length) {
        onChange([...value, ...newUrls]);
        toast.success(`${newUrls.length} foto(s) adicionada(s)`);
      }
    } finally { setBusy(false); }
  }

  async function removeAt(idx: number) {
    const url = value[idx];
    const path = pathFromValue(bucket, url);
    if (path) await supabase.storage.from(bucket).remove([path]);
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Galeria de fotos ({value.length}/{max})</span>
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
          Nenhuma foto ainda. JPG/PNG/WebP, até {MAX_MB}MB cada.
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
        ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
