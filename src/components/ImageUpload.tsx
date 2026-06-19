import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  bucket: "company-logos" | "product-images" | "claim-documents";
  userId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  accept?: string;
  className?: string;
};

export function ImageUpload({ bucket, userId, value, onChange, label = "Enviar imagem", accept = "image/*", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isPublic = bucket !== "claim-documents";

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Arquivo acima de 4MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const url = isPublic
        ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
        : path;
      onChange(url);
      toast.success("Arquivo enviado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handle} />
      {value && isPublic ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-24 w-24 rounded-lg border border-border object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
            aria-label="Remover"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
          <span className="truncate">{value.split("/").pop()}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Remover"><X className="h-3 w-3" /></button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {label}
        </Button>
      )}
    </div>
  );
}
