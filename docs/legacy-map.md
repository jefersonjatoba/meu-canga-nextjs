# Mapeamento do Legado — Meu Canga v1

## Repositório Origem
`github.com/jefersonjatoba/meu-canga` (Node.js/Express/SQLite/PostgreSQL)

## Mapa de Módulos

### core/ (lógica de negócio)

| Arquivo legado | Tamanho | Destino na v2 | Observação |
|----------------|---------|----------------|------------|
| `core/finance.engine.js` | 2KB | `src/server/engines/finance.engine.ts` | ✅ Migrado na Fase 1 |
| `core/helpers.js` | — | `src/lib/money.ts`, `src/lib/dates.ts` | ✅ Migrado na Fase 1 |
| `core/plans.config.js` | — | `src/lib/plans.config.ts` | Fase 8 |
| `core/planChecker.js` | — | `src/server/services/plan.service.ts` | Fase 8 |
| `core/transactionTypes.js` | — | `src/types/lancamento.ts` (enum) | Fase 2 |
| `core/cache.js` | — | React Query (substituído) | Não migrar |
| `core/mailer.js` | — | `src/server/services/mail.service.ts` | Fase 8 |
| `core/backup.service.js` | — | Supabase backups automáticos | Não migrar |
| `core/weekly_report.js` | — | Cron + email via Resend | Fase 9 |
| `core/layout.js` | 100KB | Descartado — HTML/template engine | ❌ Não migrar |

### modules/ (routes Express)

| Módulo legado | Tamanho | Status | Destino na v2 |
|---------------|---------|--------|----------------|
| `modules/auth/` | 49KB | 🔄 Reescrever | NextAuth + Supabase (em andamento) |
| `modules/dashboard/` | 83KB | 🔄 Reescrever | Fase 3 — `app/dashboard/` + `dashboard.service.ts` |
| `modules/transactions/` | 83KB + 2.2KB | 🔄 Reescrever | Fase 2 — `app/api/lancamentos/` |
| `modules/accounts/` | 113KB | 🔄 Reescrever | Fase 4 — `app/api/contas/` |
| `modules/recorrencias/` | — | 🔄 Reescrever | Fase 5 |
| `modules/metas/` | — | 🔄 Reescrever | Fase 5 |
| `modules/investimentos/` | — | 🔄 Reescrever | Fase 6 — Pro plan only |
| `modules/ras/` | 163KB + config | ✅ Em andamento | `app/api/ras/` (já existe) |
| `modules/escala/` | 79KB | ✅ Em andamento | `app/api/escala/` (já existe) |
| `modules/notificacoes/` | — | 🔄 Reescrever | Fase 7 |
| `modules/assistente/` | — | 🔄 Reescrever | Fase 9 |
| `modules/admin/` | 117KB | 🔄 Reescrever | Fase 8 |
| `modules/pagamento/` | — | 🔄 Reescrever | Fase 8 — Mercado Pago |
| `modules/pdf/` | — | 🔄 Reescrever | Fase 8 |
| `modules/juridico/` | — | 🔄 Reescrever | Fase 9 — Pro plan only |
| `modules/landing/` | — | ✅ Reescrito | `app/page.tsx` (sections/) |

### O que NÃO migrar

| Item | Motivo |
|------|--------|
| `core/layout.js` (100KB) | Template engine EJS/HTML inline — descartado por design |
| HTML inline em routes | CSS inline e JS inline não são práticas React |
| `public/css/*.css` | Substituído por Tailwind CSS |
| `public/sw.js` | Reescrever como Next.js PWA se necessário |
| `config/db.js` (SQLite/PG dual) | Substituído por Prisma + Supabase |
| `middlewares/csrf.js` | Next.js App Router não precisa — CSRF mitigado por SameSite cookies + origin check |
| `core/cache.js` (Redis) | Substituído por React Query + revalidação |
| Session-based auth | Substituído por JWT (NextAuth/Supabase) |

## Regras de Negócio Críticas a Preservar

### Financeiro (Fase 2-3)
- Saldo operacional: `income - expense - aportes + resgates`
- RAS **não** entra no saldo operacional
- Patrimônio: `aportes - resgates` (acumulado)
- Parcelamentos: `valor_total / num_parcelas` por mês
- Cartão de crédito: `data_compra > dia_fechamento` → fatura próximo mês
- Recorrências: disparo automático no `dia_do_mes` configurado

### RAS (já em andamento)
- Ver `docs/ras-rules.md`

### Escala (já em andamento)
- Ver `docs/escala-rules.md`

### Planos (Fase 8)
- Free: 10 lançamentos/mês, 4 RAS/mês, 3 contas, 1 meta, 2 recorrências
- Pro: ilimitado + investimentos, IA, jurídico, exportação CSV, cotações

## Database Schema Map

| Tabela legada | Tabela nova (Prisma) | Mudanças principais |
|---------------|----------------------|---------------------|
| `users` | `User` | UUID → cuid; CPF added; senha = bcrypt |
| `transactions` | `Lancamento` | `amount_cents Int` → `valorCentavos Int`; tipo lowercase |
| `accounts` | `Conta` | `saldo Float` → `saldoCentavos Int` |
| `categories` | Inline em `Lancamento.categoria` | Sem modelo separado na v2 (Fase 2) |
| `recorrencias` | `Recorrencia` | `valor Float` → `valorCentavos Int` |
| `metas` | `Meta` | `valorAlvo Float` → `valorAlvoCentavos Int` |
| `investimentos` | `Investimento` | `precoMedio Float` → `precoMedioCentavos Int` |
| `ras_agenda` | `RasAgenda` | Idêntico — já migrado |
| `ras_pagamentos` | `RasPagamento` | Idêntico — já migrado |
| `ras_cenarios_salvos` | `RasCenarioSalvo` | Idêntico — já migrado |
| `push_subscriptions` | Pendente | Fase 7 |
| `budgets` | Pendente | Fase 3 |
