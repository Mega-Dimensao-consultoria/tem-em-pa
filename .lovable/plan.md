## Objetivo

Refatorar a base de código sem alterar nenhum comportamento visível: mesmas telas, mesmas rotas, mesmos fluxos. O foco é organização, redução de duplicação e padronização.

## Diagnóstico (pontos confirmados na análise)

- **Duplicação de queries de "minhas empresas"**: `routes/_authenticated/owner.tsx`, `painel.index.tsx` e `features/owner/hooks/useMyCompaniesCount.ts` repetem a leitura de `companies` por `owner_id` com chaves diferentes.
- **Labels/cores de status de empresa repetidos**: `STATUS_LABEL` e `STATUS_STYLE` aparecem em `painel.index.tsx`, `painel.avaliacoes.tsx` e `admin/.../AllCompaniesTab.tsx` com pequenas variações.
- **`ImageUpload` duplicado**: existe `src/components/ImageUpload.tsx` (stub) e `src/components/upload/ImageUpload.tsx` (real).
- **`useAuth` dispara `getSession` e `onAuthStateChange` em todo consumidor**: cada componente que usa `useAuth()` cria um listener próprio (vários consumidores no Header, Painel, OnboardingDialog, owner, etc.). Deve virar um `AuthProvider` com contexto.
- **Regras de negócio dentro de rotas**: `painel.configuracoes.tsx` (337 linhas) e `painel.avaliacoes.tsx` (280) misturam queries Supabase, mutações e UI; `cadastrar-empresa` e `owner.empresa.$id.editar` também.
- **Server fns e queries do mesmo domínio espalhadas**: leitura de "minhas empresas" não vive em `features/owner/`, mas em rotas. Atualizações de perfil ficam inline na rota.
- **`queryKeys.ts` subutilizado**: já existe um helper central, mas várias chaves são strings cruas (`["my-companies", id]`, `["my-profile", id]`, etc.).
- **Imports inconsistentes**: mistura de `import type` x `import` para tipos; alguns arquivos importam `React` namespace sem necessidade.

## Princípios da refatoração

- Zero mudança visual e zero mudança de comportamento.
- Sem novas dependências, sem mudanças de rotas, sem migrações de banco.
- Cada arquivo movido/renomeado mantém os mesmos consumidores funcionando (re-exports temporários quando necessário).
- Sem mexer em `routeTree.gen.ts`, `integrations/supabase/types.ts`, `client.ts`, `auth-attacher.ts`, `auth-middleware.ts`.

## Plano por fase

### Fase 1 — Consolidação de duplicações (baixo risco)

1. Remover `src/components/ImageUpload.tsx` (stub) e redirecionar imports para `@/components/upload/ImageUpload` (rg confirma os call sites antes).
2. Criar `src/features/companies/lib/companyStatus.ts` exportando `COMPANY_STATUS_LABEL`, `COMPANY_STATUS_STYLE` e um `<CompanyStatusBadge />` reutilizável. Substituir as três cópias locais (`painel.index`, `painel.avaliacoes`, `AllCompaniesTab`).
3. Centralizar a leitura "minhas empresas" em `features/owner/hooks/useMyCompanies.ts` (lista) e ajustar `useMyCompaniesCount` para reaproveitar a mesma query key. Atualizar `owner.tsx` e `painel.index.tsx` para consumir o hook.

### Fase 2 — Query keys e camada de dados

4. Estender `src/lib/queryKeys.ts` com as chaves usadas hoje em strings cruas (`profile`, `myCompanies`, `myReviews`, `notifications`, `favorites`).
5. Mover leituras Supabase inline das rotas para hooks de feature:
   - `features/profile/hooks/useProfile.ts` + `useUpdateProfile.ts` (extraído de `painel.configuracoes`).
   - `features/reviews/hooks/useMyReviews.ts` (extraído de `painel.avaliacoes`).
   - `features/favorites/hooks/useFavorites.ts` (extraído de `favoritos.tsx`).
6. Padronizar nomes: hooks em `useX`, server fns em `*.functions.ts`, helpers puros em `lib/`.

### Fase 3 — Auth como contexto único

7. Converter `features/auth/use-auth.tsx` em `AuthProvider` + `useAuth()` consumidor de contexto. Montar `<AuthProvider>` em `RootComponent` (`src/routes/__root.tsx`).
8. Mover o listener `onAuthStateChange` existente em `__root.tsx` para dentro do provider, mantendo o mesmo `router.invalidate()` + `queryClient.invalidateQueries()`.
9. `useRoles` passa a ler `user` do contexto (sem novo listener).

### Fase 4 — Rotas finas, UI em componentes

10. Reduzir as três rotas longas (`painel.configuracoes`, `painel.avaliacoes`, `owner.empresa.$id.editar`) extraindo:
    - Seções de UI para `features/<dominio>/components/`.
    - Mutações para hooks dedicados.
    - As rotas ficam só com `head()`, `Route`, e a composição da página.
11. Garantir que `painel.configuracoes` reutilize `useProfile`/`useUpdateProfile` e que as ações destrutivas continuem usando `ConfirmDestructive`.

### Fase 5 — Higiene final

12. Ordenar imports por: externos → `@/` → relativos; converter `import { Type }` em `import type` quando aplicável.
13. Remover variáveis/imports não utilizados (ESLint --fix em modo seco, revisão manual).
14. Conferir build TypeScript e abrir as rotas-chave (`/`, `/painel`, `/owner`, `/admin`, `/empresa/$id`) via Playwright para confirmar que nada mudou visualmente.

## Estrutura-alvo (recorte)

```text
src/
  features/
    auth/            (provider + hooks + forms + onboarding)
    profile/         (NOVO — hooks de perfil)
    favorites/       (NOVO — hooks de favoritos)
    companies/
      lib/companyStatus.ts  (NOVO)
    owner/
      hooks/useMyCompanies.ts (NOVO, substitui duplicações)
    reviews/         (+ hooks/useMyReviews.ts)
    admin/
  lib/queryKeys.ts   (expandido)
  routes/            (mais finas; mesmas URLs)
```

## Garantias

- Nenhuma rota criada, removida ou renomeada.
- Nenhum endpoint Supabase novo; mesmas tabelas, mesmas policies.
- Nenhuma dependência adicionada ou removida.
- Cada PR-equivalente (fase) é independente; se algo quebrar, é possível reverter por fase.

## Riscos e mitigação

- **Listener de auth duplicado durante a transição**: a Fase 3 troca o provider e remove o listener antigo no mesmo commit.
- **Quebra de tipos em queryKeys**: `queryKeys.ts` mantém as chaves antigas até todos os consumidores migrarem.
- **Tela visualmente diferente após extração**: os componentes extraídos preservam className e estrutura JSX; revisão visual via Playwright na Fase 5.

## Fora de escopo

- Correções dos avisos de segurança RLS listados no painel (são alterações de comportamento de acesso, devem ser tratadas em pedido separado).
- Mudanças de design, copy, traduções, novos componentes UI.
- Otimizações de performance que mudem semântica (memoização agressiva, virtualização).

Confirma para eu executar? Posso também fazer só uma fase de cada vez se preferir revisar incrementalmente.