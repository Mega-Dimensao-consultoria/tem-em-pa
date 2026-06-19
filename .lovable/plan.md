# Plano de Refatoração Profunda

Antes de executar mudanças invasivas, quero alinhar o **escopo e a ordem** com você. A refatoração é grande e algumas escolhas têm impacto em vários arquivos — melhor combinar primeiro do que reescrever às cegas.

## Diagnóstico atual

Pontos fortes: TanStack Start bem usado, server functions já isoladas em `*.functions.ts`, shadcn padronizado, RLS no banco, masks/utils já extraídos.

Pontos de melhoria identificados:

1. **Arquivos enormes com múltiplas responsabilidades**
   - `admin.tsx` (768 linhas) — 5 tabs + stats + queries + mutations + diálogos, tudo no mesmo arquivo.
   - `empresa.$id.tsx` (464) — header + galeria + horário + reviews + mapa + JSON-LD + breadcrumbs.
   - `owner.empresa.$id.dashboard.tsx` (306) — métricas + gráfico + reviews sem resposta + share.
   - `cadastrar-empresa.tsx` (240) e `owner.../editar.tsx` (284) — **forms quase idênticos** duplicados.

2. **Lógica de dados misturada com UI**
   - Queries Supabase inline em vários componentes (`NotificationsBell`, `FavoriteButton`, `admin`, `dashboard`, `favoritos`, `notificacoes`).
   - Sem camada consistente: alguns dados vêm de `*.functions.ts`, outros direto do `supabase` client no componente.

3. **Duplicação concreta**
   - Form de empresa (cadastrar vs editar): mesmos campos, masks, geocode, hours, gallery.
   - Cards/seções no `admin.tsx` para "pending companies", "claims", "reviews", "reports" seguem a mesma estrutura.
   - `Card`/`Field` helpers redeclarados localmente em editar e cadastrar.

4. **Hooks que faltam**
   - `useCompany(id)`, `useReviews(companyId)`, `useNotifications()`, `useFavorites()`, `useAdminStats()`, `useOwnerCompanies()` — hoje cada componente chama `supabase.from(...)` direto, sem cache compartilhado.

5. **Organização de pastas**
   - `src/lib/` mistura server functions, utils puros e helpers de domínio.
   - Não há separação por feature/domínio (companies, reviews, claims, notifications, admin).

6. **Tipagem**
   - Vários `as any` em campos novos (`instagram_url`, `gallery_urls`, `hours`) por causa de tipos auto-gerados desatualizados — tratáveis com tipos de domínio próprios.

## Proposta de refatoração — em 4 fases

Cada fase é **independente e segura** (sem mudança de comportamento). Posso parar entre fases para você revisar.

### Fase 1 — Organização de pastas e tipos de domínio
- Criar estrutura por feature:
  ```text
  src/features/
    companies/   (functions, hooks, components, types)
    reviews/
    claims/
    notifications/
    admin/
    auth/
  ```
- Mover `*.functions.ts` e componentes relacionados para suas features.
- Criar `src/features/*/types.ts` com tipos de domínio (Company, Review, Claim, Notification) — elimina `as any`.
- Re-exports em `src/lib/` mantidos como shim temporário para não quebrar imports (depois removidos).

### Fase 2 — Camada de dados (hooks com React Query)
- Criar hooks padronizados:
  - `useCompany(id)`, `useCompanyReviews(id)`, `useOwnerCompanies()`,
  - `useNotifications()`, `useUnreadCount()`,
  - `useFavorites()`, `useToggleFavorite()`,
  - `useAdminPending()`, `useAdminClaims()`, `useAdminReports()`, `useAdminStats()`.
- Cada hook = `queryKey` consistente + `queryFn` chamando server fn (ou supabase client encapsulado).
- Substituir as chamadas inline `supabase.from(...).select(...)` espalhadas pelos componentes.
- Mutations com `invalidateQueries` centralizado → fim do problema "contador não atualiza".

### Fase 3 — Quebra dos arquivos grandes
- `admin.tsx` → vira shell de tabs; cada tab vira componente em `features/admin/components/`:
  - `PendingCompaniesTab`, `ClaimsTab`, `ReviewsModerationTab`, `ReportsTab`, `UsersTab`, `AdminStats`.
- `empresa.$id.tsx` → split em `CompanyHeader`, `CompanyGallery`, `CompanyHours`, `CompanyContactCard`, `CompanyReviewsSection`, `CompanyJsonLd`.
- `owner.../dashboard.tsx` → `DashboardMetrics`, `DashboardChart`, `UnansweredReviews`, `PeriodSelector`.
- Form de empresa: extrair `<CompanyForm mode="create" | "edit">` único em `features/companies/components/CompanyForm.tsx`. `cadastrar-empresa.tsx` e `editar.tsx` viram wrappers finos (~30 linhas).
- Extrair `Card`/`Field` helpers duplicados para `components/ui/form-card.tsx`.

### Fase 4 — Limpeza final
- Padronizar imports (ordem: react → libs → @/features → @/components → @/lib → relativos).
- Remover shims temporários de `src/lib/` que viraram re-export.
- Remover `as any` restantes.
- ESLint rule check (sem auto-fix destrutivo) e build.

## O que NÃO vou mexer
- Migrations / schema do banco.
- Comportamento de UI, fluxos, URLs, design tokens.
- Arquivos auto-gerados (`routeTree.gen.ts`, `integrations/supabase/*`).
- Server functions já existentes (só movidas, não reescritas).

## Validação por fase
- Build (`tsc`/Vite) verde após cada fase.
- Smoke test via Playwright nas rotas críticas: home, busca, empresa, admin, dashboard do dono, cadastro.

## Pergunta antes de começar

Esse plano de 4 fases é grande (≈ 30–40 arquivos tocados, vários novos). Como quer prosseguir?

**A)** Executo as 4 fases em sequência, em um único turno longo, e te entrego tudo no final.
**B)** Executo **fase por fase** (paro entre cada uma para você ver o diff).
**C)** Faço só as fases de maior impacto: **Fase 2 (hooks de dados) + Fase 3 (quebrar arquivões + unificar CompanyForm)** — pula reorganização de pastas e tipos de domínio, mantém estrutura atual.

Qual prefere?
