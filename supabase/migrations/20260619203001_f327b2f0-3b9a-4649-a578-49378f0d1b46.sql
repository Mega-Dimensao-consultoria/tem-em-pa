REVOKE SELECT ON public.companies FROM anon;

GRANT SELECT (
  id, name, slug, category_id, description,
  cep, address, number, complement, neighborhood, city, state, lat, lng,
  website, logo_url, cover_url, status, owner_id, is_featured,
  created_at, updated_at, instagram_url, facebook_url, hours, gallery_urls
) ON public.companies TO anon;