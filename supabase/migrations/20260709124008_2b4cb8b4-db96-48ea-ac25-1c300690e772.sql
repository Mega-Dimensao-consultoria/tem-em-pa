
-- 1) Companies: bloquear owner de mexer em status/is_featured/is_verified/slug/city_id/category_id/owner_id
DROP TRIGGER IF EXISTS trg_enforce_company_owner_update_scope ON public.companies;
CREATE TRIGGER trg_enforce_company_owner_update_scope
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.enforce_company_owner_update_scope();

-- 2) Reviews: bloquear autor de alterar status/owner_reply e owner de alterar campos que não sejam a resposta
DROP TRIGGER IF EXISTS trg_enforce_owner_reply_only ON public.reviews;
CREATE TRIGGER trg_enforce_owner_reply_only
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_reply_only();

DROP TRIGGER IF EXISTS trg_enforce_owner_reply_insert ON public.reviews;
CREATE TRIGGER trg_enforce_owner_reply_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_reply_insert();

-- 3) Moderação automática por banned_words no INSERT
DROP TRIGGER IF EXISTS trg_moderate_review ON public.reviews;
CREATE TRIGGER trg_moderate_review
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.moderate_review();

-- 4) City events: owner não pode alternar is_active
DROP TRIGGER IF EXISTS trg_enforce_city_event_owner_update_scope ON public.city_events;
CREATE TRIGGER trg_enforce_city_event_owner_update_scope
  BEFORE UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_city_event_owner_update_scope();

DROP TRIGGER IF EXISTS trg_enforce_city_event_ownership ON public.city_events;
CREATE TRIGGER trg_enforce_city_event_ownership
  BEFORE INSERT OR UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_city_event_ownership();

DROP TRIGGER IF EXISTS trg_city_events_set_city_id ON public.city_events;
CREATE TRIGGER trg_city_events_set_city_id
  BEFORE INSERT OR UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.city_events_set_city_id();

-- 5) Demais gatilhos que já tinham funções mas estavam sem trigger anexado
DROP TRIGGER IF EXISTS trg_notify_on_company_status ON public.companies;
CREATE TRIGGER trg_notify_on_company_status
  AFTER UPDATE OF status ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_company_status();

DROP TRIGGER IF EXISTS trg_notify_on_company_delete ON public.companies;
CREATE TRIGGER trg_notify_on_company_delete
  AFTER DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_company_delete();

DROP TRIGGER IF EXISTS trg_companies_search_tsv_refresh ON public.companies;
CREATE TRIGGER trg_companies_search_tsv_refresh
  BEFORE INSERT OR UPDATE OF name, description, category_id, city_id, neighborhood_id ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_search_tsv_refresh();

DROP TRIGGER IF EXISTS trg_notify_user_on_owner_reply ON public.reviews;
CREATE TRIGGER trg_notify_user_on_owner_reply
  AFTER UPDATE OF owner_reply ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_owner_reply();

DROP TRIGGER IF EXISTS trg_notify_owner_on_review ON public.reviews;
CREATE TRIGGER trg_notify_owner_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_review();

DROP TRIGGER IF EXISTS trg_enforce_review_photos_limit ON public.reviews;
CREATE TRIGGER trg_enforce_review_photos_limit
  BEFORE INSERT OR UPDATE OF photos ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_photos_limit();

DROP TRIGGER IF EXISTS trg_notify_on_claim_status ON public.company_claims;
CREATE TRIGGER trg_notify_on_claim_status
  AFTER UPDATE OF status ON public.company_claims
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_claim_status();

DROP TRIGGER IF EXISTS trg_notify_owner_on_claim_received ON public.company_claims;
CREATE TRIGGER trg_notify_owner_on_claim_received
  AFTER INSERT ON public.company_claims
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_claim_received();

DROP TRIGGER IF EXISTS trg_notify_owner_on_removal_request ON public.company_removal_requests;
CREATE TRIGGER trg_notify_owner_on_removal_request
  AFTER INSERT ON public.company_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_removal_request();

DROP TRIGGER IF EXISTS trg_handle_removal_request_decision ON public.company_removal_requests;
CREATE TRIGGER trg_handle_removal_request_decision
  AFTER UPDATE OF status ON public.company_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_removal_request_decision();

DROP TRIGGER IF EXISTS trg_dispatch_push_for_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_push_for_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_for_notification();

DROP TRIGGER IF EXISTS trg_dispatch_email_for_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_email_for_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_email_for_notification();

DROP TRIGGER IF EXISTS trg_enforce_product_limit ON public.products;
CREATE TRIGGER trg_enforce_product_limit
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_limit();

DROP TRIGGER IF EXISTS trg_validate_profile_handle ON public.profiles;
CREATE TRIGGER trg_validate_profile_handle
  BEFORE INSERT OR UPDATE OF handle ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_handle();

DROP TRIGGER IF EXISTS trg_snapshot_site_page_version ON public.site_pages;
CREATE TRIGGER trg_snapshot_site_page_version
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_site_page_version();

-- updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_companies ON public.companies;
CREATE TRIGGER trg_set_updated_at_companies BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_reviews ON public.reviews;
CREATE TRIGGER trg_set_updated_at_reviews BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_products ON public.products;
CREATE TRIGGER trg_set_updated_at_products BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at_city_events ON public.city_events;
CREATE TRIGGER trg_set_updated_at_city_events BEFORE UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
