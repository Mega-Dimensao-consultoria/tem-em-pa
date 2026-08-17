-- Adicionando colunas de imagens extras, flag de promoção e categoria
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url_3 text,
ADD COLUMN IF NOT EXISTS image_url_4 text,
ADD COLUMN IF NOT EXISTS image_url_5 text,
ADD COLUMN IF NOT EXISTS image_url_6 text,
ADD COLUMN IF NOT EXISTS image_url_7 text,
ADD COLUMN IF NOT EXISTS image_url_8 text,
ADD COLUMN IF NOT EXISTS image_url_9 text,
ADD COLUMN IF NOT EXISTS image_url_10 text,
ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS category text;

-- Grants para authenticated poderem gerenciar seus produtos
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.products TO anon;

-- Função para validar limite de 10 produtos promovidos por empresa
CREATE OR REPLACE FUNCTION public.check_company_promoted_products_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_promoted = true THEN
    IF (
      SELECT count(*) 
      FROM public.products 
      WHERE company_id = NEW.company_id 
      AND is_promoted = true 
      AND id != NEW.id
    ) >= 10 THEN
      RAISE EXCEPTION 'Uma empresa pode promover no máximo 10 produtos.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar o limite
DROP TRIGGER IF EXISTS trg_check_company_promoted_products_limit ON public.products;
CREATE TRIGGER trg_check_company_promoted_products_limit
BEFORE INSERT OR UPDATE OF is_promoted ON public.products
FOR EACH ROW EXECUTE FUNCTION public.check_company_promoted_products_limit();

-- Atualizar RLS para SELECT público apenas para produtos válidos na vitrine
DROP POLICY IF EXISTS "Public can view active products with image" ON public.products;
CREATE POLICY "Public can view active products with image"
ON public.products FOR SELECT
TO anon, authenticated
USING (
  is_active = true AND 
  image_url_1 IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = products.company_id 
    AND companies.status = 'approved'
  )
);

-- Garantir políticas de escrita para o dono
DROP POLICY IF EXISTS "Owners can manage their products" ON public.products;
CREATE POLICY "Owners can manage their products"
ON public.products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = products.company_id 
    AND companies.owner_id = auth.uid()
  )
);
