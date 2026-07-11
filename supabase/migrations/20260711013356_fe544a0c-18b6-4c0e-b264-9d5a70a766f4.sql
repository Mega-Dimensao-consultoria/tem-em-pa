UPDATE public.site_pages
SET
  title = regexp_replace(title, 'Tem na Cidade', 'Tem na minha cidade', 'g'),
  content_html = regexp_replace(content_html, 'Tem na Cidade', 'Tem na minha cidade', 'g')
WHERE content_html ~ 'Tem na Cidade' OR title ~ 'Tem na Cidade';