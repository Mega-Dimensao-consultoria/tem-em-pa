
-- Admin function to merge duplicate companies into one target
CREATE OR REPLACE FUNCTION public.admin_merge_companies(_source_id uuid, _target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _source_id = _target_id THEN
    RAISE EXCEPTION 'source and target must be different';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _source_id) THEN
    RAISE EXCEPTION 'source not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _target_id) THEN
    RAISE EXCEPTION 'target not found';
  END IF;

  -- Reviews: dedupe (unique on user_id+company_id if exists — keep newest)
  DELETE FROM public.reviews r
   WHERE r.company_id = _source_id
     AND EXISTS (
       SELECT 1 FROM public.reviews r2
        WHERE r2.company_id = _target_id AND r2.user_id = r.user_id
     );
  UPDATE public.reviews SET company_id = _target_id WHERE company_id = _source_id;

  -- Favorites: dedupe by user_id
  DELETE FROM public.favorites f
   WHERE f.company_id = _source_id
     AND EXISTS (SELECT 1 FROM public.favorites f2 WHERE f2.company_id = _target_id AND f2.user_id = f.user_id);
  UPDATE public.favorites SET company_id = _target_id WHERE company_id = _source_id;

  -- Owner alert prefs: dedupe by user_id
  DELETE FROM public.owner_alert_prefs p
   WHERE p.company_id = _source_id
     AND EXISTS (SELECT 1 FROM public.owner_alert_prefs p2 WHERE p2.company_id = _target_id AND p2.user_id = p.user_id);
  UPDATE public.owner_alert_prefs SET company_id = _target_id WHERE company_id = _source_id;

  -- Products, events, claims, removals, company_events: reassign
  UPDATE public.products SET company_id = _target_id WHERE company_id = _source_id;
  UPDATE public.city_events SET company_id = _target_id WHERE company_id = _source_id;
  UPDATE public.company_events SET company_id = _target_id WHERE company_id = _source_id;
  UPDATE public.company_claims SET company_id = _target_id WHERE company_id = _source_id;
  UPDATE public.company_removal_requests SET company_id = _target_id WHERE company_id = _source_id;

  -- Finally, delete the source company
  DELETE FROM public.companies WHERE id = _source_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_merge_companies(uuid, uuid) TO authenticated;
