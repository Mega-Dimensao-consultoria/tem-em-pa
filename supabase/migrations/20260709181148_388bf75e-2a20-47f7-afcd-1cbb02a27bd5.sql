-- Prevent leaking reviews.user_id to public/authenticated readers via the
-- broad "Approved reviews readable via view" policy. Column-level revoke
-- keeps RLS row predicates working (they use row data, not caller grants),
-- while blocking user_id from ever appearing in a client SELECT list.
-- Authenticated flows that legitimately need user_id go through
-- SECURITY DEFINER RPCs (get_my_reviews, get_company_reviews_for_owner)
-- which bypass column grants.
REVOKE SELECT (user_id) ON public.reviews FROM anon;
REVOKE SELECT (user_id) ON public.reviews FROM authenticated;

-- Re-grant SELECT on every other column so existing client queries keep working.
GRANT SELECT (
  id, company_id, rating, comment, status, is_anonymous,
  created_at, updated_at, owner_reply, owner_reply_at, photos
) ON public.reviews TO anon, authenticated;