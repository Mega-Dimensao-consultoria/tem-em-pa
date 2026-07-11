import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SeoFieldsSection } from "./SeoFieldsSection";
import { SeoPreview } from "./SeoPreview";
import type { SeoOverride } from "@/lib/seo/types";

type Table =
  | "companies"
  | "cities"
  | "categories"
  | "city_events"
  | "blog_categories";

type Props = {
  table: Table;
  id: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  initial: SeoOverride;
  /** URL de preview (opcional). */
  previewUrl?: string;
  /** Após salvar, invalidar essas query keys. */
  invalidateKeys?: readonly (readonly unknown[])[];
};

/**
 * Diálogo genérico para editar as colunas de override de SEO em qualquer
 * tabela que tenha as colunas seo_title/seo_description/og_image_url/
 * canonical_url/noindex.
 */
export function SeoOverrideDialog({
  table,
  id,
  open,
  onOpenChange,
  title,
  initial,
  previewUrl,
  invalidateKeys,
}: Props) {
  const [value, setValue] = useState<SeoOverride>(initial);
  useEffect(() => setValue(initial), [initial, id, open]);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const patch = {
        seo_title: value.seo_title || null,
        seo_description: value.seo_description || null,
        og_image_url: value.og_image_url || null,
        canonical_url: value.canonical_url || null,
        noindex: !!value.noindex,
      };
      const { error } = await supabase
        .from(table)
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SEO salvo");
      (invalidateKeys ?? []).forEach((k) => qc.invalidateQueries({ queryKey: k as unknown[] }));
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar SEO {title ? `— ${title}` : ""}</DialogTitle>
          <DialogDescription>
            Sobrescreve os padrões do site e os templates para este item.
            Deixe vazio para usar o padrão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <SeoFieldsSection
            value={value}
            onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
          />
          <div>
            <SeoPreview
              title={value.seo_title || title || ""}
              description={value.seo_description || ""}
              url={previewUrl || ""}
              image={value.og_image_url}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar SEO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
