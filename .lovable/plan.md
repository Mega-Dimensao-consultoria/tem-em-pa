
# Plano: Fundação do "Tem em P.A"

Entrega da **fundação completa**: design system, banco de dados, autenticação, home navegável e esqueleto de rotas. As funcionalidades de cada painel (claim, moderação, votos, produtos, geolocalização) serão preenchidas nas próximas iterações sobre essa base.

## 1. Setup de infraestrutura

- **Lovable Cloud** (Supabase gerenciado): habilitado para banco, auth e storage.
- **Conector Google Maps Platform**: linkado para uso futuro (embed + rotas + cálculo de distância).
- **Auth providers**: Google (broker Lovable), Apple e Email/Senha. Cloudflare Turnstile ativado para signup/login.
- **Storage buckets**:
  - `company-logos` (público)
  - `product-images` (público)
  - `claim-documents` (privado — CNPJ/Contrato Social)

## 2. Design system (Tailwind v4)

Tokens em `src/styles.css` (oklch), tema claro com sotaque institucional de Pouso Alegre:

- **Primary** vermelho vibrante (institucional PA)
- **Secondary** azul profundo
- **Background** branco / cinza muito claro
- **Foreground** cinza grafite
- Tipografia: display **Sora** + corpo **Inter** (via `<link>` no `__root.tsx`)
- Mobile-first, cantos arredondados generosos, sombras suaves, foco em respiração e hierarquia

## 3. Banco de dados (migrations)

Tipos:
- `app_role` enum: `admin`, `owner`, `user`
- `company_status` enum: `pending`, `approved`, `rejected`, `claimed_pending`
- `review_status` enum: `pending_moderation`, `approved`, `flagged`, `rejected`

Tabelas:
- `profiles` (id ↔ auth.users, full_name, avatar_url, phone, is_banned)
- `user_roles` (user_id, role) + função `has_role(_user_id, _role)` SECURITY DEFINER
- `categories` (id, name, slug, icon, sort_order)
- `companies` (id, name, category_id, cep, address, number, complement, neighborhood, city, state, lat, lng, phone, whatsapp, email, website, description, logo_url, cover_url, status, owner_id, is_featured, created_at)
- `products` (id, company_id, name, description, price, image_url_1, image_url_2, is_active)
  - Trigger: rejeita insert se a empresa já tem 20 produtos ativos
  - Check constraint: no máximo 2 imagens (já garantido pelos 2 campos)
- `reviews` (id, company_id, user_id, rating 1–5, comment, is_anonymous default true, status, created_at)
  - **Unique constraint (company_id, user_id)** → voto único
- `company_claims` (id, company_id, user_id, document_urls jsonb, message, status, created_at, reviewed_by, reviewed_at)
- `banned_words` (id, word) — usado pelo trigger de moderação

Triggers:
- `handle_new_user`: cria `profiles` + role `user` no signup
- `enforce_product_limit`: máximo 20 produtos ativos por empresa
- `moderate_review`: se `comment` contém palavra de `banned_words`, status = `pending_moderation`; senão `approved`
- `set_updated_at` genérico

**RLS + GRANTs** em todas as tabelas públicas, com `service_role` sempre e `authenticated`/`anon` conforme a tabela. Políticas resumidas:
- `categories`, `companies` (status=`approved`), `products` (de empresas aprovadas), `reviews` (status=`approved`): leitura pública (`anon`+`authenticated`)
- `companies`: owner pode editar a sua; admin pode tudo
- `products`: owner CRUD nos próprios; admin tudo
- `reviews`: usuário autenticado insere; só o autor edita/apaga o seu enquanto pendente; admin modera
- `company_claims`: usuário cria a sua, vê só as suas; admin vê todas
- `user_roles`: leitura só via `has_role`, escrita só admin/service_role

## 4. Autenticação

- Tela `/auth` com tabs **Entrar / Criar conta**, Email/Senha + botões Google e Apple
- Widget Turnstile integrado nos formulários (validação no submit)
- Reset de senha: link envia para `/reset-password` (página pública)
- Listener `onAuthStateChange` único no `__root.tsx`
- Layout protegido `_authenticated/route.tsx` (gerenciado pela integração) redireciona para `/auth`
- Após login, redireciona para `redirect` search param ou `/`

## 5. Rotas (fundação)

Públicas:
- `/` Home: hero com barra de busca centralizada, grid de cards de categorias (ícone + nome), seção de empresas em destaque (`is_featured`), CTA "Cadastre sua empresa"
- `/buscar` resultados de busca (estrutura + filtros básicos)
- `/categoria/$slug` listagem por categoria
- `/empresa/$id` página da empresa (estrutura: header, info, mapa placeholder, produtos, reviews, botão "Reivindicar" condicional)
- `/auth`, `/reset-password`
- `/sobre`, `/contato`

Protegidas (`_authenticated/`):
- `/_authenticated/painel` dashboard do usuário (placeholder com avaliações feitas)
- `/_authenticated/cadastrar-empresa` formulário com ViaCEP
- `/_authenticated/owner` painel do proprietário (lista empresas dele, link p/ gerenciar produtos) — bloqueado se não tiver role `owner`
- `/_authenticated/owner/empresa/$id/produtos` CRUD de produtos (esqueleto)
- `/_authenticated/admin` painel admin (gate via `has_role('admin')`) com sub-abas: Empresas pendentes, Reivindicações, Comentários em moderação, Categorias, Usuários

Cada painel admin/owner entra como esqueleto navegável com tabela vazia + ações desabilitadas marcadas "em breve", para a próxima iteração preencher a lógica sem refator estrutural.

## 6. Componentes principais

- `Header` com logo "Tem em P.A", busca compacta, menu de conta (avatar dropdown: Meu painel, Sair / Entrar)
- `Footer` institucional
- `CategoryCard`, `CompanyCard`, `SearchBar`, `RatingStars` (display)
- `RoleGate` helper para esconder UI por role no cliente (a segurança real é RLS)
- `CepInput` com integração ViaCEP (autopreenche endereço/bairro/cidade/UF) — pronto para o form de cadastro

## 7. Server functions iniciais

Em `src/lib/`:
- `categories.functions.ts` — `listCategories` (público, server publishable client)
- `companies.functions.ts` — `listFeaturedCompanies`, `searchCompanies`, `getCompanyById` (público)
- `viacep.functions.ts` — `lookupCep` (fetch público para ViaCEP)

Placeholders prontos para próxima iteração: `createCompany`, `claimCompany`, `submitReview`, `moderateReview`, `adminListPendingCompanies`, etc.

## 8. O que NÃO entra nesta entrega

- Lógica completa de criação/edição de empresa e produtos (forms ficam estruturados mas a submissão completa fica para próximo passo)
- Upload real de documentos de reivindicação (UI sim, processamento depois)
- Integração do conector Google Maps no front (linkado, mas embed/distância na próxima)
- Cron / notificações por email ao admin

## Detalhes técnicos

- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Supabase
- Validação client/server com Zod
- Server functions com `createServerFn`; protegidas com `requireSupabaseAuth`
- ViaCEP chamado via server function para evitar CORS e validar input
- Nenhum dado de seed em código — categorias iniciais inseridas via migration (Restaurantes, Mercados, Saúde, Beleza, Serviços, Moda, Lazer, Educação, Automotivo, Pet)

Após sua aprovação, executo tudo numa só rodada de build.
