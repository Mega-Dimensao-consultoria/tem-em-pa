import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Tag, ShoppingBag, Store, MessageSquare, ChevronLeft, ChevronRight, X, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/use-auth";

export const Route = createFileRoute("/vendas")({
  component: MarketplacePage,
});

type MarketplaceProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_promoted: boolean | null;
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
  company: {
    id: string;
    name: string;
    whatsapp: string | null;
    city: {
      name: string;
      state: string;
    };
  };
};

function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: products, isLoading } = useQuery({
    queryKey: ["marketplace-products", search],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          company:companies(
            id,
            name,
            whatsapp,
            city:cities(name, state)
          )
        `)
        .eq("is_active", true)
        .eq("companies.status", "approved")
        .not("image_url_1", "is", null)
        .order("is_promoted", { ascending: false })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data as unknown as MarketplaceProduct[]) || [];
    },
  });

  const openProduct = (p: MarketplaceProduct) => {
    setSelectedProduct(p);
    setActiveImageIndex(0);
  };

  const productImages = selectedProduct 
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        .map(i => (selectedProduct as any)[`image_url_${i}`])
        .filter(Boolean)
    : [];

  const handleWhatsApp = () => {
    if (!selectedProduct?.company.whatsapp) return;
    const msg = `Olá! Vi o produto "${selectedProduct.name}" no marketplace do Tem na Minha Cidade e gostaria de mais informações.`;
    window.open(`https://wa.me/55${selectedProduct.company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <PageShell>
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              O que estão vendendo na minha cidade?
            </h1>
            <p className="text-lg text-muted-foreground">
              Descubra produtos e oportunidades incríveis oferecidos por empresas e empreendedores da sua região.
            </p>
            
            <div className="relative mt-8 max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="O que você está procurando hoje?"
                className="h-14 pl-12 pr-4 rounded-full border-primary/20 bg-background shadow-lg focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-2xl" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">Nenhum produto encontrado</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Não encontramos nenhum produto com esse nome no momento. Experimente buscar termos mais genéricos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((p) => (
              <Card 
                key={p.id} 
                className={cn(
                  "group overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer rounded-2xl",
                  p.is_promoted && "ring-1 ring-primary/20 bg-primary/[0.01]"
                )}
                onClick={() => openProduct(p)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={p.image_url_1!}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {p.is_promoted && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-white border-none shadow-lg">
                        Destaque
                      </Badge>
                    </div>
                  )}
                  {p.price && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-background/90 backdrop-blur-md text-primary font-bold px-3 py-1 text-base shadow-sm">
                        R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{p.company.city.name} - {p.company.city.state}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Store className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium truncate">{p.company.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl gap-0">
          <div className="grid md:grid-cols-2 h-[80vh] md:h-auto max-h-[90vh]">
            <div className="relative bg-muted overflow-hidden flex flex-col">
              <div className="flex-1 relative">
                <img
                  src={productImages[activeImageIndex]}
                  alt=""
                  className="h-full w-full object-contain"
                />
                
                {productImages.length > 1 && (
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 px-4">
                    {productImages.map((_, i) => (
                      <button
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          activeImageIndex === i ? "w-6 bg-primary" : "w-1.5 bg-primary/30"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(i);
                        }}
                      />
                    ))}
                  </div>
                )}

                {productImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-md rounded-full hover:bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                      }}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 backdrop-blur-md rounded-full hover:bg-background/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                      }}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
              
              <div className="p-4 bg-background border-t">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {productImages.map((img, i) => (
                    <button
                      key={i}
                      className={cn(
                        "h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                        activeImageIndex === i ? "border-primary" : "border-transparent"
                      )}
                      onClick={() => setActiveImageIndex(i)}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-1">
                  {selectedProduct?.category && (
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                      {selectedProduct.category}
                    </Badge>
                  )}
                  <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight">
                    {selectedProduct?.name}
                  </h2>
                </div>

                {selectedProduct?.price && (
                  <div className="text-3xl font-bold text-primary">
                    R$ {Number(selectedProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Descrição do Produto
                </h4>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {selectedProduct?.description || "Nenhuma descrição fornecida pelo vendedor."}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2 text-primary">
                    <Store className="h-4 w-4" />
                    Vendido por
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin className="h-3 w-3" />
                    {selectedProduct?.company.city.name} - {selectedProduct?.company.city.state}
                  </div>
                </div>
                
                <div className="bg-muted/40 rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{selectedProduct?.company.name}</p>
                    <p className="text-xs text-muted-foreground">Vendedor local verificado</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/20"
                  size="lg"
                  disabled={!selectedProduct?.company.whatsapp}
                  onClick={handleWhatsApp}
                >
                  <MessageSquare className="h-6 w-6" />
                  Falar com o vendedor
                </Button>
                {!selectedProduct?.company.whatsapp && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Vendedor não informou WhatsApp de contato.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}