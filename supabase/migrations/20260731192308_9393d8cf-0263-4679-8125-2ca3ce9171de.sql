CREATE TABLE public.faq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('moradores','empresas')),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faq_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_items TO authenticated;
GRANT ALL ON public.faq_items TO service_role;

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_items public read active"
  ON public.faq_items FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "faq_items admin manage"
  ON public.faq_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER faq_items_set_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.faq_items (category, question, answer, sort_order) VALUES
('moradores','O que é o Tem na Minha Cidade?','Somos o seu catálogo digital multi-cidade. Nosso objetivo é reunir, em um só lugar, os melhores comércios, empresas e profissionais liberais da sua região. De um restaurante a um eletricista de confiança, você encontra tudo aqui com um clique.',1),
('moradores','Eu pago alguma coisa para usar a plataforma?','Não! A busca por profissionais, empresas e eventos no portal é 100% gratuita para moradores e visitantes.',2),
('moradores','As empresas cadastradas são de confiança?','Sim. Um dos nossos pilares é a Confiança. Além de trabalharmos com empresas verificadas, disponibilizamos avaliações de clientes reais para que você faça sempre a melhor escolha.',3),
('empresas','Tenho um negócio, como faço para aparecer no portal?','É muito simples! Basta clicar no botão ''Cadastrar minha empresa'' no topo do site, criar sua conta e preencher as informações. Em poucos passos, você já estará visível para milhares de pessoas.',1),
('empresas','Qual é o valor para cadastrar minha empresa?','O cadastro básico da sua empresa no portal é totalmente gratuito em qualquer cidade do Brasil. Nossa missão é dar visibilidade ao trabalho de quem produz na cidade, sem barreiras.',2),
('empresas','Como os clientes vão me encontrar?','Nossa plataforma possui um sistema de busca simples e inteligente. Os clientes podem pesquisar por cidade, bairro, categoria do serviço ou pelo próprio nome da sua empresa.',3);