-- ============================================================================
-- Company promotions (destaques pagos e concedidos pela moderação)
-- ============================================================================

CREATE TYPE public.promotion_source AS ENUM ('paid', 'admin');
CREATE TYPE public.promotion_status AS ENUM ('pending', 'active', 'expired', 'canceled');

CREATE TABLE public.company_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  source public.promotion_source NOT NULL,
  status public.promotion_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  stripe_environment TEXT,
  plan_code TEXT,
  amount_cents INTEGER,
  days_purchased INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT company_promotions_valid_range CHECK (ends_at > starts_at)
);

GRANT SELECT ON public.company_promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_promotions TO authenticated;
GRANT ALL ON public.company_promotions TO service_role;

CREATE INDEX idx_company_promotions_company ON public.company_promotions(company_id);
CREATE INDEX idx_company_promotions_active ON public.company_promotions(status, starts_at, ends_at);

ALTER TABLE public.company_promotions ENABLE ROW LEVEL SECURITY;

-- Público lê apenas promoções ATIVAS e vigentes (para exibir destaques).
CREATE POLICY "Anyone can read active promotions"
  ON public.company_promotions FOR SELECT
  USING (status = 'active' AND starts_at <= now() AND ends_at > now());

-- Dono da empresa vê o próprio histórico (para tela de destaques).
CREATE POLICY "Owner can read own promotions"
  ON public.company_promotions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid()));

-- Admin vê tudo.
CREATE POLICY "Admins can read all promotions"
  ON public.company_promotions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem inserir/atualizar/apagar direto (source='admin').
-- Promoções pagas entram via edge/webhook rodando com service_role.
CREATE POLICY "Admins can manage promotions"
  ON public.company_promotions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER trg_company_promotions_updated_at
  BEFORE UPDATE ON public.company_promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Helper: elegibilidade para comprar destaque
-- ============================================================================
CREATE OR REPLACE FUNCTION public.company_promotion_eligibility(_company_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  has_logo BOOLEAN,
  has_cover BOOLEAN,
  has_description BOOLEAN,
  has_contact BOOLEAN,
  has_address BOOLEAN,
  has_hours BOOLEAN,
  has_active_product BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
  prod_count INT;
BEGIN
  SELECT logo_url, cover_url, description, phone, whatsapp, neighborhood_id, hours
    INTO c FROM public.companies WHERE id = _company_id;
  IF c IS NULL THEN
    RETURN;
  END IF;
  SELECT COUNT(*) INTO prod_count FROM public.products
    WHERE company_id = _company_id AND is_active = true;

  has_logo := c.logo_url IS NOT NULL AND length(trim(c.logo_url)) > 0;
  has_cover := c.cover_url IS NOT NULL AND length(trim(c.cover_url)) > 0;
  has_description := c.description IS NOT NULL AND length(trim(c.description)) >= 30;
  has_contact := (c.phone IS NOT NULL AND length(trim(c.phone)) > 0)
              OR (c.whatsapp IS NOT NULL AND length(trim(c.whatsapp)) > 0);
  has_address := c.neighborhood_id IS NOT NULL;
  has_hours := c.hours IS NOT NULL AND jsonb_typeof(c.hours) = 'object' AND (c.hours <> '{}'::jsonb);
  has_active_product := prod_count > 0;
  eligible := has_logo AND has_cover AND has_description AND has_contact
              AND has_address AND has_hours AND has_active_product;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_promotion_eligibility(UUID) TO authenticated, anon;

-- ============================================================================
-- Listar promoções ativas + empresa (para home / cidade), com sorteio ponderado
-- por dias restantes. Weighted random sem reposição (Efraimidis-Spirakis):
--   ORDER BY -ln(random()) / weight
-- ============================================================================
CREATE OR REPLACE FUNCTION public.list_promoted_companies(
  _city_id UUID DEFAULT NULL,
  _limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  is_featured BOOLEAN,
  hours JSONB,
  neighborhood_id UUID,
  city_id UUID,
  category_id UUID,
  neighborhood_name TEXT,
  neighborhood_slug TEXT,
  city_name TEXT,
  city_slug TEXT,
  category_name TEXT,
  promotion_ends_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active AS (
    SELECT p.company_id,
           MAX(p.ends_at) AS ends_at,
           GREATEST(EXTRACT(EPOCH FROM (MAX(p.ends_at) - now())) / 86400.0, 0.25) AS remaining_days
    FROM public.company_promotions p
    WHERE p.status = 'active'
      AND p.starts_at <= now()
      AND p.ends_at > now()
    GROUP BY p.company_id
  )
  SELECT c.id, c.name, c.slug, c.description, c.logo_url, c.cover_url,
         c.is_featured, c.hours, c.neighborhood_id, c.city_id, c.category_id,
         n.name, n.slug, ci.name, ci.slug, cat.name,
         a.ends_at
  FROM active a
  JOIN public.companies c ON c.id = a.company_id
  LEFT JOIN public.neighborhoods n ON n.id = c.neighborhood_id
  LEFT JOIN public.cities ci ON ci.id = c.city_id
  LEFT JOIN public.categories cat ON cat.id = c.category_id
  WHERE c.status = 'approved'
    AND (_city_id IS NULL OR c.city_id = _city_id)
  ORDER BY (-ln(GREATEST(random(), 1e-9)) / a.remaining_days) ASC
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.list_promoted_companies(UUID, INT) TO anon, authenticated;

-- ============================================================================
-- RPC para admin conceder destaque manual (grátis, source='admin')
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_grant_promotion(
  _company_id UUID,
  _starts_at TIMESTAMPTZ,
  _ends_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _ends_at <= _starts_at THEN
    RAISE EXCEPTION 'invalid range';
  END IF;
  INSERT INTO public.company_promotions
    (company_id, starts_at, ends_at, source, status, created_by)
  VALUES
    (_company_id, _starts_at, _ends_at, 'admin', 'active', auth.uid())
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_promotion(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- RPC para admin cancelar destaque
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_cancel_promotion(_promotion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.company_promotions
     SET status = 'canceled'
   WHERE id = _promotion_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cancel_promotion(UUID) TO authenticated;

-- ============================================================================
-- Manutenção: expira promoções vencidas (chamada por cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.expire_company_promotions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected INT;
BEGIN
  UPDATE public.company_promotions
     SET status = 'expired'
   WHERE status = 'active'
     AND ends_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_company_promotions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_company_promotions() TO service_role;

-- Cron diário (04:00 UTC) para expirar
SELECT cron.schedule(
  'expire-company-promotions',
  '0 4 * * *',
  $$ SELECT public.expire_company_promotions(); $$
);
