-- company_promotions: hide Stripe/payment identifiers from public readers.
REVOKE SELECT ON public.company_promotions FROM anon;
GRANT SELECT (
  id, company_id, starts_at, ends_at, status, source, created_at, updated_at
) ON public.company_promotions TO anon;

-- Authenticated readers keep full access; policies (owner/admin) still gate rows.
-- No change to authenticated grants.

-- reviews: reassert user_id column revoke so anonymous reviews stay anonymous
-- even if a future migration re-grants the whole table.
REVOKE SELECT (user_id) ON public.reviews FROM anon;
REVOKE SELECT (user_id) ON public.reviews FROM authenticated;