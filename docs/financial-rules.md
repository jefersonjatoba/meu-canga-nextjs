# Regras Financeiras — Meu Canga

Fonte: `core/finance.engine.js`, `modules/transactions/`, `modules/dashboard/`

## Tipos de Transação

| Tipo | Descrição | Impacto no Saldo |
|------|-----------|-----------------|
| `income` | Receita operacional (salário, extras) | `+` |
| `expense` | Despesa operacional (aluguel, alimentação) | `-` |
| `ras` | RAS — pago mês seguinte | **zero** (rastreado separado) |
| `investment_aporte` | Depósito em investimento | `-` (sai do saldo, vai pro patrimônio) |
| `investment_resgate` | Resgate de investimento | `+` (volta do patrimônio pro saldo) |
| `transfer` | Transferência entre contas | zero (nulo líquido) |

## Fórmulas Core

```
SALDO_OPERACIONAL = totalIncome - totalExpense - totalAportes + totalResgates

PATRIMÔNIO_LÍQUIDO = totalAportes_acumulado - totalResgates_acumulado

TAXA_DE_POUPANÇA (%) = (SALDO_OPERACIONAL / totalIncome) × 100
  — Clampado em [0, 100]
  — Zero se totalIncome = 0
```

## Implementação de Referência

Engine pura: `src/server/engines/finance.engine.ts`

```typescript
// Saldo operacional do mês
const balance = totalIncome - totalExpense - totalAportes + totalResgates

// Nota: RAS não subtrai do saldo. É rastreado como totalRas mas não afeta balance.
```

## Regras de Lançamento

### Parcelamentos
- Valor por parcela = `valor_total / num_parcelas` (arredondado em centavos)
- Cada parcela = 1 registro `Lancamento` independente
- Ligados por `parentId` → `filhos[]`
- Descrição: `"Compra X (2/5)"` — sufixo `(parcela_atual/parcelas)`
- `source = 'parcelado'`

### Cartão de Crédito
- `Conta.tipo = 'credit'`
- `Conta.diaFechamento` define o ciclo
- Se `data_lancamento.dia > diaFechamento` → fatura no **próximo mês**
- Caso contrário → fatura no mês corrente
- Stored em `Lancamento.competenciaAt` (yyyy-MM)

### Recorrências
- Geradas automaticamente no `diaVencimento` de cada mês
- `Lancamento.source = 'recorrente'`
- `Lancamento.recorrenciaId` aponta para o registro pai
- Prevenção de duplicata: `UNIQUE(userId, recorrenciaId, competenciaAt)`
- Worker/cron deve rodar ao menos 1x/dia verificando diaVencimento = hoje

## Plano Free vs Pro

### Free
| Recurso | Limite |
|---------|--------|
| Lançamentos | 10/mês |
| RAS | 4/mês |
| Contas | 3 total |
| Metas | 1 ativa |
| Recorrências | 2 ativas |
| PDFs | 1/mês |

### Pro (R$ 29,90/mês ou R$ 299/ano)
Todos os limites = ilimitado. Features adicionais: investimentos, IA, jurídico, cotações, push.

## Formatação Monetária

```typescript
// Sempre usar src/lib/money.ts
formatBRL(78321)  // → "R$ 783,21"
toCents("R$ 783,21") // → 78321
toCents(783.21)      // → 78321
```

Nunca use `parseFloat()` + operações aritméticas em campos monetários.

## Resumo do Dashboard

| Indicador | Fórmula |
|-----------|---------|
| Receita | `SUM(income WHERE competencia = mes_atual)` |
| Despesa | `SUM(expense WHERE competencia = mes_atual)` |
| Saldo | `Receita - Despesa - Aportes + Resgates` |
| RAS do mês | `SUM(ras WHERE competencia = mes_atual)` — informativo |
| Taxa de poupança | `(Saldo / Receita) × 100` |
| Patrimônio | `SUM(todos aportes) - SUM(todos resgates)` — acumulado histórico |

## Evolução Mensal (Gráfico)

- Janela: últimos 6 meses
- Dados: `{ competencia, totalIncome, totalExpense, balance }` por mês
- Projeção: média dos meses históricos para próximos N meses

## Alertas Financeiros

| Condição | Tipo | Mensagem |
|----------|------|---------|
| `balance < 0` | danger | Saldo operacional negativo |
| `totalExpense > totalIncome * 0.9` | warning | Despesas > 90% da receita |
| Orçamento de categoria > 100% | danger | Orçamento estourado |
| Orçamento de categoria > 80% | warning | Orçamento quase estourado |
| 7+ dias sem lançamentos | info | Lembrete de atualização |
| Meta concluída | success | Parabéns! |
