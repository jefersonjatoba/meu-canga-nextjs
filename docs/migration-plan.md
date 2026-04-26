# Plano de Migração — Meu Canga v1 → v2

## Visão Geral

| Item | Detalhe |
|------|---------|
| Origem | Node.js 20 / Express 5 + SQLite/PostgreSQL + HTML/JS |
| Destino | Next.js 16 / React 19 / TypeScript / Prisma / PostgreSQL |
| Metodologia | Regras de negócio preservadas; UI e infraestrutura completamente reescritas |

## Princípios Inegociáveis

1. **Dinheiro = centavos Int.** `Float` proibido em campos monetários.
2. Regras de negócio vivem em **engines** e **services** — nunca em componentes React.
3. **Prisma** só é acessado em repositories e API routes (server-side).
4. **Engines** são funções puras — testáveis sem banco de dados.
5. **Zod** valida entrada em todas as API routes.
6. **TypeScript estrito** em todos os domínios.

## Arquitetura de Destino

```
src/
  server/
    engines/          # Lógica pura — sem I/O, testável unitariamente
      finance.engine.ts
      ras.engine.ts       (próxima fase)
      alerts.engine.ts    (próxima fase)
    services/         # Orquestra engine + repository
      dashboard.service.ts
      lancamento.service.ts
    repositories/     # Único ponto de acesso ao Prisma
      lancamento.repository.ts
      conta.repository.ts
  features/           # UI por domínio: hooks + components + types locais
    lancamentos/
    dashboard/
    investimentos/
  lib/
    money.ts          # toCents / formatBRL — nunca usar Float para dinheiro
    dates.ts          # timezone America/Sao_Paulo
    env.ts            # variáveis de ambiente type-safe
  components/
    ui/               # Componentes atômicos (Button, Card, Input…)
  types/              # Tipos de domínio (ras.ts, escala.ts…)
app/
  api/                # Route handlers Next.js (só validam e chamam services)
  dashboard/          # Pages React
```

## Fases

### Fase 0 — Auditoria ✅
- [x] Mapeamento do legado (`docs/legacy-map.md`)
- [x] Regras financeiras documentadas (`docs/financial-rules.md`)
- [x] Regras RAS documentadas (`docs/ras-rules.md`)
- [x] Regras de escala documentadas (`docs/escala-rules.md`)

### Fase 1 — Fundação Técnica ✅
- [x] `prisma/schema.prisma` — Float → Int em campos monetários
- [x] `src/lib/money.ts` — helpers de centavos
- [x] `src/lib/dates.ts` — helpers de data com timezone BR
- [x] `src/lib/env.ts` — env vars type-safe
- [x] `src/server/engines/finance.engine.ts` — engine financeira pura
- [x] `tests/unit/finance.engine.test.ts` — testes da engine

### Fase 2 — Módulo de Lançamentos
- [ ] API routes: `GET/POST/PATCH/DELETE /api/lancamentos`
- [ ] `src/server/repositories/lancamento.repository.ts`
- [ ] `src/server/services/lancamento.service.ts`
- [ ] `app/dashboard/lancamentos/page.tsx` (refatorar)
- [ ] Parcelamentos (parcelas + parentId)
- [ ] Transações por cartão de crédito (dia de fechamento)

### Fase 3 — Dashboard Financeiro
- [ ] API routes: `/api/dashboard/mensal`, `/api/dashboard/anual`
- [ ] `src/server/services/dashboard.service.ts` usando `finance.engine.ts`
- [ ] Gráfico de evolução 6 meses (Recharts)
- [ ] Cards de saldo, receita, despesa, poupança

### Fase 4 — Módulo de Contas
- [ ] API routes: `/api/contas`
- [ ] Tipos: corrente, poupança, crédito, investimento
- [ ] Saldo calculado dinamicamente por transações

### Fase 5 — Metas e Recorrências
- [ ] API routes: `/api/metas`, `/api/recorrencias`
- [ ] Cron: `/api/cron/processar-recorrencias`
- [ ] Engine de geração automática de recorrências

### Fase 6 — Módulo de Investimentos
- [ ] API routes: `/api/investimentos`
- [ ] Integração brapi.dev para cotações
- [ ] Patrimônio líquido integrado ao dashboard

### Fase 7 — Alertas e Notificações
- [ ] `src/server/engines/alerts.engine.ts`
- [ ] Web Push (VAPID)
- [ ] Alertas: orçamento, saldo negativo, metas, horas RAS

### Fase 8 — Admin e Planos
- [ ] Middleware de plano (Free/Pro)
- [ ] Limites: 10 lançamentos, 4 RAS, 3 contas, 1 meta (Free)
- [ ] Integração Mercado Pago

### Fase 9 — Assistente IA
- [ ] Integração Claude API com prompt caching
- [ ] Contexto financeiro personalizado por usuário

## Riscos

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Float em dados financeiros existentes | Alta | Migration SQL: `ROUND(valor * 100)::INTEGER` |
| `tipo` RECEITA/DESPESA (uppercase) em código legado do front | Média | Substituir globalmente por `income`/`expense` |
| Tabelas financeiras sem migração aplicada | Alta | Rodar `npx prisma migrate dev` antes de qualquer deploy |
| 2FA/TOTP não implementado | Baixa | Planejar Fase 8+ |
| Sessão Supabase + NextAuth duplicada | Média | Unificar em Fase 8 |

## Comandos

```bash
# Aplicar migrações (incluindo Float → Int)
npx prisma migrate dev --name fix_monetary_floats_to_cents

# Rodar testes da engine financeira
npm run test

# Verificar tipos TypeScript
npx tsc --noEmit
```
