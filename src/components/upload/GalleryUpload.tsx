import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MAX_MB,
  publicUrl,
  removeFromBucket,
  uploadToBucket,
  validateFile,
} from "@/lib/storage/uploadFile";

interface GalleryUploadProps {
  userId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

const BUCKET = "company-logos";

export function GalleryUpload({ userId, value, onChange, max = 8 }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList) {
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${max} fotos`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    const newUrls: string[] = [];
    try {
      for (const file of list) {
        const err = validateFile(file, "image/*");
        if (err) {
          toast.error(`${file.name}: ${err}`);
          continue;
        }
        try {
          const path = await uploadToBucket({
            bucket: BUCKET,
            userId,
            file,
            prefix: "gallery-",
            upsert: false,
          });
          newUrls.push(publicUrl(BUCKET, path));
        } catch (e) {
          toast.error(`${file.name}: ${(e as Error).message}`);
        }
      }
      if (newUrls.length) {
        onChange([...value, ...newUrls]);
        toast.success(`${newUrls.length} foto(s) adicionada(s)`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeAt(idx: number) {
    await removeFromBucket(BUCKET, value[idx]);
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Galeria de fotos ({value.length}/{max})
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy || value.length >= max}
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
          )}
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
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
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
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
