import { useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Faz upload e devolve a URL pública. */
  upload: (file: File) => Promise<string>;
  /** Remove do armazenamento o arquivo apontado pela URL/caminho. */
  remove?: (url: string) => Promise<void>;
  label?: string;
  accept?: string;
  /** Tamanho máximo em MB (padrão 5). */
  maxMb?: number;
  /** Dimensões do preview. */
  previewClassName?: string;
};

/**
 * Seletor de arquivo para anexos gerenciados pelo próprio armazenamento do site.
 * Não expõe input de URL — o admin sempre envia o arquivo. Ao substituir,
 * o arquivo anterior é apagado para reduzir consumo do storage.
 */
export function AttachmentPicker({
  value,
  onChange,
  upload,
  remove,
  label = "Enviar imagem",
  accept = "image/*",
  maxMb = 5,
  previewClassName = "h-24 w-40",
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Arquivo maior que ${maxMb}MB`);
      return;
    }
    setBusy(true);
    try {
      const url = await upload(file);
      const prev = value;
      onChange(url);
      if (prev && remove) {
        try {
          await remove(prev);
        } catch {
          /* melhor não travar UX se apenas o cleanup falhar */
        }
      }
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message || "Falha no envio");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!value) return;
    setBusy(true);
    try {
      if (remove) await remove(value);
      onChange(null);
    } catch (e) {
      toast.error((e as Error).message || "Falha ao remover");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Prévia"
            className={`${previewClassName} rounded-md border border-border object-cover`}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow ring-1 ring-border"
            aria-label="Remover imagem"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </button>
        </div>
      ) : (
        <div
          className={`${previewClassName} flex items-center justify-center rounded-md border border-dashed border-border text-muted-foreground`}
        >
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {value ? "Trocar imagem" : label}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Envie um arquivo do seu computador (até {maxMb}MB). Ao trocar, o anterior é apagado.
        </p>
      </div>
    </div>
  );
}
