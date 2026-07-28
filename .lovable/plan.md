
# Contadores reais + paginação universal no admin

Objetivo: nenhuma estimativa em lugar nenhum, e toda lista longa com paginação de página com tamanho editável (10/25/50/100).

## Parte 1 — Cache de contadores (banco)

Criar `public.admin_stats_cache` com uma linha por métrica (`key text PRIMARY KEY, value bigint, updated_at timestamptz`). Populada por triggers `AFTER INSERT/UPDATE/DELETE` nas tabelas grandes:

- `companies` → total, approved, pending (pending+claimed_pending), rejected
- `reviews` → total, pending (pending_moderation+flagged)
- `company_claims` → pending
- `company_removal_requests` → pending
- `review_reports` → pending
- `contact_messages` → pending, total
- `profiles` → total (usuários)
- `blog_posts` → total, published
- `site_pages`, `cities`, `neighborhoods`, `categories` → total

Regra: cada trigger só faz `UPDATE admin_stats_cache SET value = value ± 1 WHERE key = ...`. Custo por escrita ≈ 1 update em tabela de 15 linhas — imperceptível. Migração seed roda `COUNT(*)` real 1× (sem timeout: rodando como SECURITY DEFINER via função de reseed).

RLS: leitura só por admin (`has_role(auth.uid(),'admin')`). Uma RPC `admin_reseed_stats()` recalcula tudo do zero on-demand.

## Parte 2 — Frontend admin: contadores exatos

- `stats.ts`: substitui os 18 `count: "estimated"` por um único `SELECT * FROM admin_stats_cache`. Resultado exato, ~10ms.
- `AdminOverviewTab`: sem mudança visual, agora com número real.
- `companies.ts` (`useCompaniesPage`): quando não há filtro custom (status/city/q), usa `total` do cache; quando há filtro, usa `count: "estimated"` (única exceção justificada — filtro arbitrário sobre 200k linhas não tem como ser exato em <8s sem materializar cada combinação).

## Parte 3 — Paginação universal

Componente `AdminPagination` ganha seletor de tamanho de página (10/25/50/100), estado persistido em `localStorage` por lista (`admin.pageSize.<listKey>`).

Refatorar cada aba abaixo para paginação server-side (`.range(from,to)` + `count: "exact"` — todas essas tabelas têm poucos milhares de linhas no máximo, `exact` roda em milissegundos):

- `AllCompaniesTab` — já paginada; adicionar seletor de tamanho.
- `UsersTab` — hoje carrega tudo; server-side com busca.
- `PendingCompaniesTab`, `PendingClaimsTab`, `PendingRemovalsTab`, `PendingReviewsTab`, `ReportsTab`, `FlaggedCompaniesTab`, `ContactMessagesTab`, `TwoFaResetRequestsTab`, `AuditLogTab`, `DuplicatesTab`.
- `BlogPostsTab`, `BlogCategoriesTab`, `SitePagesTab`, `CategoriesTab`, `BannedWordsTab`, `CitiesSeoTab`.

Cada tabela retorna `{ rows, total }` do banco; UI mostra "Mostrando X–Y de TOTAL" com total real. Nenhum "500 de 500" placeholder.

## Detalhes técnicos

- Triggers usam `pg_try_advisory_xact_lock` por chave para evitar lock contention em bursts de inserts (ex.: importação em massa) — cai no fallback de reseed agendado.
- Após uma importação em massa, chamar `admin_reseed_stats()` explicitamente do backend do importador para garantir consistência (a fila natural de triggers já mantém sincronia, mas o reseed é barato como salvaguarda).
- `AdminPagination` novo prop: `pageSize`, `onPageSizeChange`, `pageSizeOptions=[10,25,50,100]`. Mantém compat com quem não passar.
- Hooks de listagem seguem o padrão `useXxxPage(filters, page, pageSize) → { rows, total }` com `placeholderData: prev`.

## Ordem de entrega

1. Migração do cache + triggers + RPC de reseed + seed inicial.
2. Refatorar `stats.ts` + `AdminOverviewTab`.
3. `AdminPagination` com seletor de tamanho + `useAdminPageSize(listKey)`.
4. Converter cada aba (`AllCompaniesTab` primeiro; depois Users; depois as pending; depois as demais).

## Fora do escopo

- Paginação em telas do usuário final (empresas, home, cidade) — só admin, como pedido.
- Métricas fora das listadas (ex.: contagem de favoritos, notificações) — podem ser adicionadas depois sob o mesmo padrão.
