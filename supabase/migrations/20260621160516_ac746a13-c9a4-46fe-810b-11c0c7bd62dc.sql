-- Esconder reviews.user_id de leitores anônimos.
-- A política SELECT continua liberando rows aprovadas para todos, mas a coluna
-- user_id deixa de ser legível por anon (RLS filtra linhas; privilégio de coluna filtra colunas).
REVOKE SELECT (user_id) ON public.reviews FROM anon;
REVOKE SELECT (user_id) ON public.reviews FROM PUBLIC;

-- Garante que usuários autenticados e service_role continuem com acesso total.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Anon ainda pode ler colunas públicas (rating, comment, etc.) — necessário para
-- a página pública de empresa exibir avaliações aprovadas.
GRANT SELECT (
  id, company_id, rating, comment, status, is_anonymous,
  owner_reply, owner_reply_at, created_at, updated_at
) ON public.reviews TO anon;