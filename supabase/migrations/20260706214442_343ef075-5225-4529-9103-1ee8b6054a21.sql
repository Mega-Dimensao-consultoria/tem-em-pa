
-- ============================================================================
-- 1) site_pages: institutional page content, admin-editable
-- ============================================================================
CREATE TABLE public.site_pages (
  slug        text PRIMARY KEY,
  title       text NOT NULL,
  content_md  text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.site_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_pages public read"
  ON public.site_pages FOR SELECT
  USING (true);

CREATE POLICY "site_pages admin write"
  ON public.site_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_pages_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default content for the four institutional pages
INSERT INTO public.site_pages (slug, title, content_md) VALUES
('sobre', 'Sobre o Tem em Pouso Alegre',
$md$
## O que é o Tem em Pouso Alegre

O **Tem em Pouso Alegre** é um catálogo digital dedicado à cidade de Pouso Alegre/MG. Nossa proposta é reunir, em um só lugar, **empresas, comércios e profissionais liberais** da cidade, tornando fácil para moradores e visitantes encontrar o que precisam — de um restaurante próximo a um dentista, advogado, personal trainer ou eletricista de confiança.

## Como funciona

- **Empresas e profissionais** podem se cadastrar gratuitamente, criando um perfil com fotos, descrição, contato, horário de funcionamento e localização.
- **Usuários** buscam por nome, categoria ou bairro, veem avaliações reais de outros moradores e entram em contato direto pelo WhatsApp, telefone ou e-mail.
- **A comunidade** ajuda a manter as informações atualizadas por meio de avaliações honestas e denúncias de conteúdo impróprio.

## Nossa missão

Fortalecer a economia local, dar visibilidade ao trabalho de quem produz em Pouso Alegre e simplificar o dia a dia de quem mora, trabalha ou visita a cidade.

## Nossos valores

- **Transparência** nas informações e nas avaliações.
- **Respeito** ao consumidor e a quem empreende.
- **Simplicidade** — a plataforma tem que ser fácil de usar para todos.
- **Comunidade** — o Tem em Pouso Alegre é feito por e para quem vive a cidade.
$md$),

('contato', 'Fale com a gente',
$md$
Tem alguma dúvida, sugestão ou quer reportar um problema? Entre em contato.

## Canais de atendimento

- **E-mail:** contato@tememp.a
- **Horário:** segunda a sexta, das 9h às 18h

## Para empresas e profissionais

Se você quer cadastrar sua empresa ou serviço no catálogo, acesse a página **Cadastrar empresa** no menu principal — é gratuito. Se precisar de ajuda, escreva para o e-mail acima.

## Para usuários

Encontrou uma informação incorreta ou quer denunciar uma avaliação ofensiva? Use os botões de "Reportar" disponíveis nas páginas de empresas e avaliações, ou fale conosco pelo e-mail.
$md$),

('termos', 'Termos de Uso',
$md$
Última atualização: hoje.

## 1. Aceitação dos termos

Ao acessar ou utilizar o **Tem em Pouso Alegre** ("Plataforma"), você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.

## 2. Descrição do serviço

O Tem em Pouso Alegre é um catálogo digital que conecta moradores e visitantes de Pouso Alegre/MG a empresas, comércios, serviços e profissionais liberais locais. Permitimos que empresas e profissionais divulguem informações e que usuários pesquisem, avaliem e favoritem estabelecimentos.

## 3. Cadastro e conta

- Você deve fornecer informações verdadeiras, completas e atualizadas.
- Você é responsável pela guarda da sua senha e por toda atividade em sua conta.
- O uso de autenticação em duas etapas (2FA) é fortemente recomendado.
- Reservamo-nos o direito de suspender contas que violem estes termos.

## 4. Cadastro de empresas e profissionais

- Somente o titular ou representante autorizado pode cadastrar/reivindicar uma empresa ou serviço profissional.
- É proibido cadastrar empresas fictícias, duplicadas ou de terceiros sem autorização.
- As informações passam por moderação antes da publicação.
- Podemos remover cadastros que descumpram estes termos ou a legislação.

## 5. Avaliações e conteúdo do usuário

- As avaliações devem refletir experiências reais e ser respeitosas.
- É proibido publicar conteúdo ofensivo, discriminatório, difamatório, com dados pessoais de terceiros, spam ou publicidade não autorizada.
- Avaliações passam por moderação automática e podem ser revisadas por nossa equipe.
- Você mantém a titularidade do conteúdo publicado, mas concede ao Tem em Pouso Alegre licença gratuita e não exclusiva para exibi-lo na plataforma.

## 6. Conduta proibida

Você concorda em não:
- Usar a plataforma para fins ilegais ou fraudulentos;
- Tentar acessar áreas restritas ou dados de outros usuários;
- Utilizar robôs, scrapers ou coletar dados em massa;
- Interferir na segurança ou desempenho do serviço.

## 7. Propriedade intelectual

A marca, o layout, o código e demais elementos da plataforma pertencem ao Tem em Pouso Alegre. É vedada a reprodução total ou parcial sem autorização prévia.

## 8. Limitação de responsabilidade

O Tem em Pouso Alegre atua como intermediário na divulgação de informações. Não nos responsabilizamos por transações, produtos ou serviços prestados pelas empresas e profissionais listados. Recomendamos sempre validar as informações diretamente com o estabelecimento.

## 9. Suspensão e encerramento

Podemos suspender ou encerrar contas que violem estes Termos, sem prejuízo das medidas legais cabíveis. Você pode encerrar sua conta a qualquer momento nas Configurações.

## 10. Alterações

Estes Termos podem ser atualizados a qualquer momento. Alterações relevantes serão comunicadas na plataforma.

## 11. Legislação e foro

Aplica-se a legislação brasileira. Fica eleito o foro da Comarca de Pouso Alegre/MG para dirimir eventuais controvérsias.

## 12. Contato

Dúvidas sobre estes Termos: contato@tememp.a
$md$),

('privacidade', 'Política de Privacidade',
$md$
Última atualização: hoje.

Esta Política descreve como o **Tem em Pouso Alegre** trata os dados pessoais dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).

## 1. Dados que coletamos

- **Cadastro:** nome, e-mail, foto de perfil, telefone (opcional).
- **Empresas e profissionais:** razão social ou nome, endereço, contatos, horário, fotos, categoria e serviços cadastrados pelo próprio responsável.
- **Interações:** avaliações, comentários, favoritos, mensagens de contato.
- **Técnicos:** logs de acesso, IP, navegador, sistema operacional, cookies essenciais e de sessão.
- **Notificações push:** tokens de dispositivo, quando você autoriza o navegador.

## 2. Base legal e finalidades

- **Execução de contrato:** criar e manter sua conta, exibir empresas e profissionais, viabilizar avaliações e favoritos.
- **Legítimo interesse:** segurança, prevenção a fraudes, moderação, melhoria do produto.
- **Consentimento:** envio de notificações push e comunicações opcionais.
- **Obrigação legal:** atendimento a autoridades quando obrigatório.

## 3. Avaliações anônimas

Você pode marcar uma avaliação como anônima. Nesse caso, o nome do autor não é exibido publicamente e o identificador do autor é ocultado inclusive no banco de dados. Nossa equipe de moderação pode, em casos de denúncia ou violação, identificar o autor internamente para investigação.

## 4. Compartilhamento

Não vendemos dados pessoais. Compartilhamos apenas com:
- Provedores de infraestrutura (banco de dados, e-mail transacional, mapas, hospedagem);
- Autoridades, quando obrigados por lei ou ordem judicial;
- Empresas e profissionais, quando você envia mensagem de contato ou avaliação (respeitada a opção de anonimato).

## 5. Cookies

Utilizamos cookies essenciais para autenticação e preferências (por exemplo, tema claro/escuro). Não utilizamos cookies de publicidade de terceiros.

## 6. Armazenamento e segurança

- Dados armazenados em infraestrutura com criptografia em trânsito (HTTPS) e em repouso.
- Controle de acesso baseado em papéis (usuário, dono, admin) e políticas de segurança em nível de linha.
- Suporte a autenticação em duas etapas (2FA) por aplicativo autenticador.

## 7. Retenção

Mantemos os dados enquanto sua conta estiver ativa. Após exclusão, dados pessoais são removidos ou anonimizados em até 30 dias, ressalvadas obrigações legais.

## 8. Direitos do titular

Você pode, a qualquer momento:
- Acessar, corrigir ou atualizar seus dados nas Configurações;
- Solicitar exportação ou exclusão da conta;
- Revogar consentimento de notificações push;
- Enviar solicitações LGPD para contato@tememp.a.

## 9. Menores

O serviço não é destinado a menores de 13 anos. Se identificarmos cadastros nessa faixa, a conta será removida.

## 10. Alterações desta política

Podemos atualizar esta Política. Alterações relevantes serão comunicadas na plataforma.
$md$);

-- ============================================================================
-- 2) city_events: events posted by companies for the city
-- ============================================================================
CREATE TABLE public.city_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz,
  location     text,
  image_url    text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX city_events_active_starts_idx
  ON public.city_events (is_active, starts_at DESC);
CREATE INDEX city_events_company_idx
  ON public.city_events (company_id);

GRANT SELECT ON public.city_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.city_events TO authenticated;
GRANT ALL ON public.city_events TO service_role;

ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;

-- Public read: only active events from approved companies
CREATE POLICY "city_events public read"
  ON public.city_events FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = city_events.company_id AND c.status = 'approved'
    )
  );

-- Owner: full CRUD on their own company events
CREATE POLICY "city_events owner all"
  ON public.city_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = city_events.company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = city_events.company_id AND c.owner_id = auth.uid()
    )
  );

-- Admin: full CRUD
CREATE POLICY "city_events admin all"
  ON public.city_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_city_events_updated_at
  BEFORE UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
