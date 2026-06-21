import { NoProducts } from "@/components/feedback/EmptyState";
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  image_url_1: string | null;
};

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CompanyProductsBlock({ products }: { products: Product[] }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Produtos & Serviços</h2>
      {products.length === 0 ? (
        <NoProducts />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              {p.image_url_1 ? (
                <img
                  src={p.image_url_1}
                  alt={p.name}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-3">
                <h3 className="font-semibold">{p.name}</h3>
                {p.price != null ? (
                  <p className="text-sm font-bold text-primary">
                    {fmt.format(Number(p.price))}
                  </p>
                ) : null}
                {p.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
