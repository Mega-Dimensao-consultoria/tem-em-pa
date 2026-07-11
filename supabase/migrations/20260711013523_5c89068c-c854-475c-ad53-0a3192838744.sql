UPDATE public.site_pages_versions
SET
  title = regexp_replace(regexp_replace(title, 'Tem na [Cc]idade', 'Tem na minha cidade', 'g'), 'temnacidade', 'temnaminhacidade', 'g'),
  content_html = regexp_replace(
    regexp_replace(
      regexp_replace(content_html, 'Tem na [Cc]idade', 'Tem na minha cidade', 'g'),
      'temnacidade', 'temnaminhacidade', 'g'
    ),
    'contato@tememp\.a', 'contato@temnaminhacidade.com.br', 'g'
  )
WHERE title ~ 'Tem na [Cc]idade|temnacidade' OR content_html ~ 'Tem na [Cc]idade|temnacidade|tememp\.a';