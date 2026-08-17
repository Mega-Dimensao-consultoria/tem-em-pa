import { useState } from "react";
import { z } from "zod";
import { Loader2, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProductCategories } from "../hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
  description: z.string().trim().max(1000, "Descrição muito longa").optional().or(z.literal("")),
  category: z.string().trim().max(50, "Categoria muito longa").optional().or(z.literal("")),
  price: z
    .coerce.number()
    .min(0)
    .max(999999)
    .optional()
    .or(z.literal("" as unknown as number)),
  is_promoted: z.boolean().default(false),
});

type ProductFormData = {
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  product_category_id: string | null;
  is_promoted: boolean;
  image_url_1: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  image_url_5: string | null;
  image_url_6: string | null;
  image_url_7: string | null;
  image_url_8: string | null;
  image_url_9: string | null;
  image_url_10: string | null;
};

export function ProductForm({
  userId,
  submitting,
  onSubmit,
}: {
  userId: string | undefined;
  submitting: boolean;
  onSubmit: (input: ProductFormData) => Promise<void> | void;
}) {
  const [images, setImages] = useState<(string | null)[]>(Array(10).fill(null));
  const [isPromoted, setIsPromoted] = useState(false);
  const [productCategoryId, setProductCategoryId] = useState<string>("none");

  const { data: categories = [] } = useProductCategories();

  const updateImage = (index: number, val: string | null) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const priceRaw = String(fd.get("price") ?? "").replace(",", ".");
    
    const parsed = schema.safeParse({
      name: fd.get("name"),
      description: fd.get("description") ?? "",
      category: fd.get("category") ?? "",
      price: priceRaw === "" ? undefined : Number(priceRaw),
      is_promoted: isPromoted,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (!images[0]) {
      toast.error("A primeira imagem é obrigatória para exibir no marketplace.");
      return;
    }

    await onSubmit({
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      product_category_id: productCategoryId === "none" ? null : productCategoryId,
      price: typeof parsed.data.price === "number" ? parsed.data.price : null,
      is_promoted: parsed.data.is_promoted,
      image_url_1: images[0],
      image_url_2: images[1],
      image_url_3: images[2],
      image_url_4: images[3],
      image_url_5: images[4],
      image_url_6: images[5],
      image_url_7: images[6],
      image_url_8: images[7],
      image_url_9: images[8],
      image_url_10: images[9],
    });

    setImages(Array(10).fill(null));
    setIsPromoted(false);
    setProductCategoryId("none");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form
      onSubmit={handle}
      className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Adicionar produto</h2>
        <div className="flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 border border-primary/10">
          <Star className={cn("h-4 w-4 transition-colors", isPromoted ? "fill-primary text-primary" : "text-muted-foreground")} />
          <Label htmlFor="promo" className="text-xs font-medium cursor-pointer">Promover no Marketplace</Label>
          <Switch 
            id="promo" 
            checked={isPromoted} 
            onCheckedChange={setIsPromoted}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pn">Nome do Produto *</Label>
          <Input id="pn" name="name" required placeholder="Ex: iPhone 15 Pro Max" maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pp">Preço (R$)</Label>
          <Input id="pp" name="price" inputMode="decimal" placeholder="0,00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pc">Categoria (Opção de texto livre)</Label>
          <Input id="pc" name="category" placeholder="Ex: iPhone Semi-novo, Oferta única..." maxLength={50} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pcf">Categoria do Marketplace *</Label>
          <Select value={productCategoryId} onValueChange={setProductCategoryId}>
            <SelectTrigger id="pcf" className="bg-background">
              <SelectValue placeholder="Selecione uma categoria fixa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Selecione uma categoria...</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pd">Descrição detalhada</Label>
        <Textarea id="pd" name="description" rows={4} placeholder="Conte mais sobre o estado do produto, características..." maxLength={1000} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Galeria de fotos (até 10)</Label>
          <span className="text-xs text-muted-foreground">A primeira foto será a capa</span>
        </div>
        
        {userId ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <ImageUpload
                  bucket="product-images"
                  userId={userId}
                  value={img}
                  onChange={(val) => updateImage(i, val)}
                  label={i === 0 ? "Foto Capa" : `Foto ${i + 1}`}
                />
                {i === 0 && !img && (
                  <div className="absolute inset-0 pointer-events-none border-2 border-primary/20 rounded-xl flex items-center justify-center">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Obrigatória</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-muted/20">
            Entre para enviar fotos
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={submitting} className="min-w-[150px]">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Produto
            </>
          )}
        </Button>
      </div>
    </form>
  );
}