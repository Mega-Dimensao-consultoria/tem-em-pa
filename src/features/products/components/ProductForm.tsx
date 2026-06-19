import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/upload/ImageUpload";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z
    .coerce.number()
    .min(0)
    .max(999999)
    .optional()
    .or(z.literal("" as unknown as number)),
});

export function ProductForm({
  userId,
  submitting,
  onSubmit,
}: {
  userId: string | undefined;
  submitting: boolean;
  onSubmit: (input: {
    name: string;
    description: string | null;
    price: number | null;
    image_url_1: string | null;
  }) => Promise<void> | void;
}) {
  const [image1, setImage1] = useState<string | null>(null);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const priceRaw = String(fd.get("price") ?? "").replace(",", ".");
    const parsed = schema.safeParse({
      name: fd.get("name"),
      description: fd.get("description") ?? "",
      price: priceRaw === "" ? undefined : Number(priceRaw),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    await onSubmit({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: typeof parsed.data.price === "number" ? parsed.data.price : null,
      image_url_1: image1,
    });
    setImage1(null);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form
      onSubmit={handle}
      className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <h2 className="font-display text-lg font-semibold">Adicionar produto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pn">Nome *</Label>
          <Input id="pn" name="name" required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pp">Preço (R$)</Label>
          <Input id="pp" name="price" inputMode="decimal" placeholder="0,00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pd">Descrição</Label>
        <Textarea id="pd" name="description" rows={3} maxLength={500} />
      </div>
      {userId ? (
        <div className="space-y-1.5">
          <Label>Imagem</Label>
          <ImageUpload
            bucket="product-images"
            userId={userId}
            value={image1}
            onChange={setImage1}
            label="Enviar imagem"
          />
        </div>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando…
          </>
        ) : (
          "Adicionar"
        )}
      </Button>
    </form>
  );
}
