-- city_events
DROP TRIGGER IF EXISTS city_events_sync_city ON public.city_events;
DROP TRIGGER IF EXISTS trg_city_events_owner_update_scope ON public.city_events;
DROP TRIGGER IF EXISTS trg_city_events_enforce_ownership ON public.city_events;
DROP TRIGGER IF EXISTS trg_city_events_ownership ON public.city_events;
DROP TRIGGER IF EXISTS trg_city_events_updated_at ON public.city_events;

-- companies
DROP TRIGGER IF EXISTS companies_search_tsv_trigger ON public.companies;
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;

-- company_removal_requests
DROP TRIGGER IF EXISTS trg_removal_decision ON public.company_removal_requests;

-- notifications
DROP TRIGGER IF EXISTS dispatch_push_after_notification ON public.notifications;

-- products
DROP TRIGGER IF EXISTS trg_products_limit ON public.products;
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;

-- profiles
DROP TRIGGER IF EXISTS profiles_handle_validate ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;

-- reviews
DROP TRIGGER IF EXISTS trg_reviews_enforce_owner_reply_insert ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_enforce_owner_reply_only ON public.reviews;
DROP TRIGGER IF EXISTS reviews_photos_limit ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_photos_limit ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_moderate ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;

-- site_pages
DROP TRIGGER IF EXISTS trg_site_pages_snapshot ON public.site_pages;