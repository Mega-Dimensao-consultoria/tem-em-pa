
GRANT SELECT (id, name, slug, category_id, description, cep, address, number, complement, neighborhood, city, state, lat, lng, phone, whatsapp, email, website, logo_url, cover_url, status, is_featured, created_at, updated_at, instagram_url, facebook_url, hours, gallery_urls) ON public.companies TO anon;

GRANT SELECT (id, company_id, rating, comment, is_anonymous, status, created_at, updated_at, owner_reply, owner_reply_at) ON public.reviews TO anon;
