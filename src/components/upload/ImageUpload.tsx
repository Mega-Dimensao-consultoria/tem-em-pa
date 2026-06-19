import { useRef, useState } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  MAX_MB,
  PRIVATE_BUCKETS,
  publicUrl,
  removeFromBucket,
  uploadToBucket,
  validateFile,
} from "@/lib/storage/uploadFile";

interface ImageUploadProps {
  bucket: string;
  userId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
  accept?: string;
}

export function ImageUpload({
  bucket,
  userId,
  value,
  onChange,
  label,
  accept = "image/*",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isPrivate = PRIVATE_BUCKETS.has(bucket);
  const isPdf =
    value &&
    (value.toLowerCase().endsWith(".pdf") ||
      (isPrivate && !value.match(/\.(jpe?g|png|webp|gif)$/i)));

  async function handleFile(file: File) {
    const err = validateFile(file, accept);
    if (err) {
      toast.error(err);
      return;
    }
    setBusy(true);
    try {
      const path = await uploadToBucket({ bucket, userId, file });
      if (value) await removeFromBucket(bucket, value);
      onChange(isPrivate ? path : publicUrl(bucket, path));
      toast.success("Enviado");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!value) return;
    setBusy(true);
    try {
      await removeFromBucket(bucket, value);
      onChange(null);
    } finally {
      setBusy(false);
    }
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
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow hover:bg-background"
              aria-label="Remover"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:bg-muted/50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="px-2 text-center">{label}</span>
            <span className="text-[10px]">até {MAX_MB}MB</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
