CREATE OR REPLACE FUNCTION public.check_company_promoted_products_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE VIEW public.reviews_public AS
SELECT
  r.id,
  r.company_id,
  r.rating,
  r.comment,
  r.status,
  r.is_anonymous,
  r.owner_reply,
  r.owner_reply_at,
  r.created_at,
  CASE WHEN r.is_anonymous THEN NULL::uuid ELSE r.user_id END AS user_id,
  r.photos
FROM public.reviews r
WHERE r.status = 'approved'::review_status;

ALTER VIEW public.reviews_public SET (security_invoker = off);
GRANT SELECT ON public.reviews_public TO anon, authenticated;

DROP POLICY IF EXISTS "Approved reviews readable via view" ON public.reviews;

CREATE OR REPLACE VIEW public.company_promotions_public AS
SELECT
  p.id,
  p.company_id,
  p.starts_at,
  p.ends_at,
  p.status
FROM public.company_promotions p
WHERE p.status = 'active'::promotion_status
  AND p.starts_at <= now()
  AND p.ends_at > now();

ALTER VIEW public.company_promotions_public SET (security_invoker = off);
GRANT SELECT ON public.company_promotions_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read active promotions" ON public.company_promotions;