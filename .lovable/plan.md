# Plano de Refatoração — Concluído

Todas as 4 fases foram entregues.

## Fase 1 — Organização por feature + tipos de domínio ✅

Nova estrutura em `src/features/`:

```
src/features/
  admin/        functions/ + components/ (tabs)
  auth/         components/ + schemas + use-auth
  claims/       components/
  companies/    functions/ + hooks/ + components/
  notifications/components/ + hooks/
  owner/        functions/ + hooks/ + components/
  products/     hooks/ + components/
  reviews/      components/
```

Mantidos em `src/`:
- `components/ui/*` (shadcn), `components/Header`, `Footer`, `Logo`, `PageShell`,
  `Breadcrumbs`, `SearchBar`, `QrCodeCard`, `ShareButton`, `ConfirmDestructive`,
  `ImageUpload`, `forms/FormSection`, `upload/*` (utilitários compartilhados)
- `lib/utils`, `masks`, `hours`, `track`, `geocode.functions`, `viacep.functions`,
  `queryKeys`, `storage/uploadFile`, `error-*` (cross-domain)
- `hooks/use-mobile`, `useGeolocation`
- `types/domain.ts` (Row aliases)

## Fase 2 — Camada de dados ✅

Hooks de query padronizados com `queryKeys` centralizado e mutations com
`invalidateQueries`. Já estavam implementados antes do trabalho de hoje.

## Fase 3 — Quebra dos arquivos grandes ✅

Já entregue: tabs do admin, blocos da empresa, `CompanyForm` unificado,
seções do dashboard do dono.

## Fase 4 — Limpeza final ✅

- Removidos shims `src/lib/companies.functions.ts` e `src/lib/admin-audit.ts`.
- `CARD_COLS` / `DETAIL_COLS` viraram `as const` → inferência Supabase precisa.
- Eliminados **todos os `as any`** do código de app (mantidos apenas em
  `routeTree.gen.ts`, que é auto-gerado).
- `CompanyMap` agora tipa `window.google` via `WindowWithMaps` em vez de cast.
- `buildCompanyHead` tipa o loaderData via helpers `asRecord` / `asString`.
- `typecheck` verde.

## O que NÃO foi mexido (por design)

- Migrations / schema do banco.
- URLs, comportamento de UI, design tokens.
- Arquivos auto-gerados (`routeTree.gen.ts`, `integrations/supabase/*`).
- Server functions: apenas movidas, não reescritas.
