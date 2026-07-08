
-- 1) site_pages: coluna is_published + política pública restrita
ALTER TABLE public.site_pages ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "site_pages public read" ON public.site_pages;

CREATE POLICY "site_pages public read published"
  ON public.site_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "site_pages admin read all"
  ON public.site_pages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Revoga EXECUTE público em funções internas (triggers/dispatchers/validadores)
DO $$
DECLARE fn text;
DECLARE internal_fns text[] := ARRAY[
  'notify_owner_on_removal_request()',
  'enforce_owner_reply_only()',
  'city_events_set_city_id()',
  'enforce_owner_reply_insert()',
  'enforce_company_owner_update_scope()',
  'email_queue_wake()',
  'handle_new_user()',
  'moderate_review()',
  'set_updated_at()',
  'enforce_product_limit()',
  'notify_on_company_status()',
  'notify_user_on_owner_reply()',
  'notify_on_claim_status()',
  'create_notification(uuid,text,text,text,text,jsonb)',
  'read_email_batch(text,integer,integer)',
  'delete_email(text,bigint)',
  'enqueue_email(text,jsonb)',
  'dispatch_push_for_notification()',
  'move_to_dlq(text,text,bigint,jsonb)',
  'validate_profile_handle()',
  'enforce_review_photos_limit()',
  'notify_on_company_delete()',
  'dispatch_email_for_notification()',
  'snapshot_site_page_version()',
  'email_queue_dispatch()',
  'notify_owner_on_review()',
  'notify_owner_on_claim_received()',
  'enforce_city_event_ownership()',
  'handle_removal_request_decision()',
  'companies_search_tsv_refresh()'
];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'skip revoke on %: %', fn, SQLERRM;
    END;
  END LOOP;
END $$;
