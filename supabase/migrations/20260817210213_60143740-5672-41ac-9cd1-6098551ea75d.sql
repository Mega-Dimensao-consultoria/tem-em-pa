
-- Tabela para categorias fixas de produtos
CREATE TABLE IF NOT EXISTS public.product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

-- RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public read product_categories') THEN
        CREATE POLICY "Public read product_categories" ON public.product_categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin manage product_categories') THEN
        CREATE POLICY "Admin manage product_categories" ON public.product_categories 
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Inserindo categorias iniciais se vazia
INSERT INTO public.product_categories (name, slug, sort_order)
SELECT name, slug, sort_order FROM (VALUES
    ('Eletrônicos', 'eletronicos', 10),
    ('Móveis', 'moveis', 20),
    ('Vestuário', 'vestuario', 30),
    ('Alimentação', 'alimentacao', 40),
    ('Serviços', 'servicos', 50),
    ('Eletrodomésticos', 'eletrodomesticos', 60),
    ('Outros', 'outros', 100)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.product_categories);

-- Adicionar FK na tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_category_id uuid REFERENCES public.product_categories(id);

-- Atualizar trigger de contagem para admin_stats_cache para incluir produtos
CREATE OR REPLACE FUNCTION public.trg_update_products_stats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.admin_stats_cache SET value = value + 1 WHERE key = 'products_total';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.admin_stats_cache SET value = value - 1 WHERE key = 'products_total';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a tabela products tem o trigger de estatísticas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stats_products') THEN
    CREATE TRIGGER trg_stats_products
    AFTER INSERT OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.trg_update_products_stats();
  END IF;
END $$;

-- Inserir entrada para products no cache se não existir
INSERT INTO public.admin_stats_cache (key, value)
SELECT 'products_total', count(*) FROM public.products
WHERE NOT EXISTS (SELECT 1 FROM public.admin_stats_cache WHERE key = 'products_total');
