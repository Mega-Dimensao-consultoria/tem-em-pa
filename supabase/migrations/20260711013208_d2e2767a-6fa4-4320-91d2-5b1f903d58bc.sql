UPDATE public.site_pages
SET
  title = replace(replace(title, 'Tem na cidade', 'Tem na minha cidade'), 'temnacidade', 'temnaminhacidade'),
  content_html = replace(
    replace(
      replace(content_html, 'Tem na cidade', 'Tem na minha cidade'),
      'temnacidade', 'temnaminhacidade'
    ),
    'contato@tememp.a', 'contato@temnaminhacidade.com.br'
  )
WHERE slug IN ('sobre','privacidade','termos');