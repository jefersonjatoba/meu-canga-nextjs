# 🔍 AUDIT PRÉ-DESENVOLVIMENTO RAS

## Relatório Técnico de Análise Arquitetural
**Data**: 2026-05-04  
**Nível**: Banco Profissional / Fintech  
**Status**: CRÍTICO - Refatoração Necessária Antes de Sprint 1

---

## ✅ O Que Está Bom

### Tipos e Validações (Excelente)
- ✅ `src/types/ras.ts`: Tipos bem estruturados, constantes, labels
- ✅ `src/lib/validations/ras.ts`: Schemas Zod robusto, validações cross-field
- ✅ Tabela de preços corretamente mapeada em centavos
- ✅ Locais (BPM, Especiais, UPP) sincronizados com v1
- ✅ Status workflow documentado
- ✅ Limites de negócio (120h/mês, 8h descanso, 72h window) definidos

### Schema Prisma (Bom)
- ✅ 4 tabelas criadas (RasAgenda, RasAgendamento, RasPagamento, RasCenarioSalvo)
- ✅ Índices apropriados (userId, competencia, status)
- ✅ Relações FK com cascata delete
- ✅ Campos monetários em centavos (nunca Float)

### API Routes (Parcial)
- ✅ `GET /api/ras` com transição automática realizado→pendente
- ✅ `POST /api/ras` com validações básicas
- ✅ `PATCH /api/ras/[id]` com state machine
- ⚠️ Outras rotas existem mas incompletas

---

## 🚨 CRÍTICOS - Bloqueadores para Sprint 1

### 1. **Problema: Timezone São Paulo Inconsistente**

**Arquivo**: `app/api/ras/route.ts:216`

```typescript
const nowBR = new Date(
  new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
)
const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`
```

**Problema**: 
- `toLocaleString('en-US')` retorna string, depois reconstrói Date (perde timezone)
- Campo `data` é DateTime sem timezone
- Comparações de data podem falhar em horários críticos (23:30-23:59)

**Impacto**: 🔴 CRÍTICO para sistema financeiro
- RAS agendado no passado pode ser criado como "confirmado" incorretamente
- Decisões de `autoStatus` baseadas em data errada

**Solução**: Criar helper centralizado que use `Intl.DateTimeFormat`

---

### 2. **Problema: Validação de Conflito com Escala Quebrada**

**Arquivo**: `app/api/ras/route.ts:182-209`

```typescript
const escalaConflito = await prisma.escala.findFirst({
  where: {
    userId: user.id,
    dataEscala: dataDate, // DateTime vs DateTime ✓ OK
    status: { not: 'cancelada' }, // ❌ ERRADO: campo é 'status' não 'cancelada'
  },
})
```

**Problema 1**: Campo `status` em Escala é enum `agendada|realizada|cancelada`, mas está validando `not: 'cancelada'` (deveria ser `cancelada` com 'a' final).

**Problema 2**: Não valida contra `RasAgendamento` (tabela que marca datas rápidas no calendário). Um RAS pode conflitar com outra marcação rápida.

**Impacto**: 🔴 CRÍTICO
- Validação de conflito não funciona
- Usuário pode agendar RAS+Escala no mesmo dia/hora
- Violação de regra de negócio

**Solução**: Corrigir enum E adicionar check contra RasAgendamento

---

### 3. **Problema: Status Auto-Atribuído Semanticamente Errado**

**Arquivo**: `app/api/ras/route.ts:211-216`

```typescript
const autoStatus = data < todayStr ? 'confirmado' : 'agendado'
```

**Problema**: 
- Se data passada, status é `confirmado` (significa já aprovado por admin)
- Deveria ser `realizado` (usuário trabalhou no passado)
- Flow v1 é: agendado → realizado (quando marca) → pendente/confirmado

**Impacto**: 🔴 CRÍTICO
- Semântica de status quebrada
- RAS criado para data passada pula de agendado direto para confirmado
- Viola workflow esperado

**Solução**: 
```typescript
const autoStatus = data < todayStr ? 'realizado' : 'agendado'
```

---

### 4. **Problema: Falta de Repository/Service Layer**

**Arquivo**: `app/api/ras/*`

**Problema**:
- Lógica de negócio (validações, transições, cálculos) espalhada nas rotas
- Sem camada de repository
- Sem camada de service
- Duplicação potencial entre endpoints

**Impacto**: 🔴 CRÍTICO para banco profissional
- Violação de DDD / Clean Architecture
- Testes unitários impossíveis (lógica acoplada a HTTP)
- Risco de inconsistência entre endpoints
- Difícil de manter (mudança em lógica → múltiplos arquivos)

**Solução**:
```
src/server/repositories/ras.repository.ts
  ├─ CRUDOperations
  ├─ Queries especializadas
  └─ Transações

src/server/services/ras.service.ts
  ├─ Validações de negócio
  ├─ Transições de estado
  ├─ Cálculos
  └─ Orquestração

app/api/ras/* (API routes)
  ├─ HTTP handling only
  ├─ Auth/validation
  └─ Delegação para service
```

---

### 5. **Problema: Janela de 72h Não Implementada**

**Arquivo**: `RasAgenda.expiresAt` definido no schema mas:

- ❌ Não há lógica em POST para calcular `expiresAt` ao marcar realizado
- ❌ Não há cron job para auto-transição
- ❌ Campo `expiresAt` pode vencer mas nada acontece automaticamente sem GET `/api/ras`
- ❌ Endpoint `/api/cron/ras-transition` existe mas está vazio

**Impacto**: 🟠 ALTO
- Regra crítica do negócio não funciona
- Admin precisa clicar em GET para atualizar status
- Em produção, status pode ficar incorreto por dias

**Solução**: 
1. Implementar cron job real (`/api/cron/ras-transition`)
2. Calcular `expiresAt` ao mudar para "realizado"
3. Testar transição automática

---

### 6. **Problema: Cron Job Inativo**

**Arquivo**: `app/api/cron/ras-transition/route.ts`

```typescript
// ❌ Vazio ou não faz nada
```

**Problema**: Nenhuma implementação de transição automática realizado→pendente.

**Impacto**: 🟠 ALTO  
**Solução**: Implementar lógica de transição com segurança

---

## ⚠️ ALTOS - Problemas Importantes

### 7. **Problema: Descanso de 8h Entre RAS Pode ter Overflow**

**Arquivo**: `app/api/ras/route.ts:156-178`

```typescript
const vStartMin = vStartH * 60 + vStartM + diffDays * 24 * 60  // ❌ Pode overflow
const vEndMin = vEndH * 60 + vEndM + (vEndH < vStartH ? 24 * 60 : 0) + diffDays * 24 * 60
```

**Problema**: Se `diffDays` = 7, valor pode ficar 11,520+ minutos. Aritmética fica confusa.

**Impacto**: 🟠 MÉDIO  
**Solução**: Usar timestamps absolutos (milisegundos) em vez de minutos relativos.

---

### 8. **Problema: Falta Integração com Escala (Soft)**

**Arquivo**: Sem arquivo dedicado para validar conflitos Escala ↔ RAS

**Problema**: 
- Validação de conflito duplicada em `/api/ras`
- Sem endpoint separado para "verificar conflitos antes de editar"
- Componente UI pode não refletir conflitos em tempo real

**Impacto**: 🟠 MÉDIO (UX)  
**Solução**: Criar endpoint dedicado `/api/ras/conflitos?data=YYYY-MM-DD`

---

### 9. **Problema: Sem Repository para Escala**

**Arquivo**: `src/server/repositories/`

**Problema**: Escala não tem repository, então RAS não consegue validar conflitos de forma isolada.

**Impacto**: 🟠 MÉDIO  
**Solução**: Criar `escala.repository.ts` com método `findByUserAndDate()`

---

### 10. **Problema: Sem Tratamento de Race Condition**

**Arquivo**: `app/api/ras/route.ts:120-132`

```typescript
const existing = await prisma.rasAgenda.findFirst({ ... })
if (existing) return errorResponse(...)

// ❌ Entre aqui e o CREATE, outro request pode ter criado
await prisma.rasAgenda.create({ ... })
```

**Problema**: TOCTOU (Time-of-Check-Time-of-Use) race condition.

**Impacto**: 🟠 MÉDIO (raro mas possível)  
**Solução**: Usar `unique` constraint + try-catch para capturar erro de violação

---

## 📊 MÉDIOS - Melhorias

### 11. **Problema: Sem Error Codes Padronizados**

**Arquivo**: Múltiplos endpoints retornam strings genéricas

```typescript
return errorResponse('Já existe um RAS agendado...', 409)
return errorResponse(`Conflito com plantão...`, 409)
```

**Problema**: Frontend não consegue diferenciar entre tipos de erro (duplicação vs conflito).

**Solução**: Criar enum de error codes:
```typescript
export enum RasErrorCode {
  DUPLICATE = 'RAS_DUPLICATE',
  MONTHLY_HOURS_EXCEEDED = 'RAS_MONTHLY_HOURS_EXCEEDED',
  ESCALA_CONFLICT = 'RAS_ESCALA_CONFLICT',
  MIN_REST_VIOLATED = 'RAS_MIN_REST_VIOLATED',
  TRANSITION_INVALID = 'RAS_TRANSITION_INVALID',
}
```

---

### 12. **Problema: Sem Audit Log**

**Arquivo**: Nenhum log de mudanças de RAS

**Problema**: Em sistema financeiro, precisa rastrear quem/quando mudou cada RAS.

**Solução**: Adicionar tabela `RasAuditLog` com user, ação, valores antigos/novos, timestamp.

---

### 13. **Problema: Sem Soft Delete**

**Arquivo**: `DELETE /api/ras/[id]` faz delete hard

**Problema**: Dados financeiros (RAS confirmados) podem ser apagados.

**Solução**: 
- Não permitir delete de confirmados (apenas cancelar)
- Implementar soft delete com `deletedAt`

---

### 14. **Problema: Sem Permissões Admin**

**Arquivo**: Falta endpoint para admin confirmar RAS

**Problema**: Workflow v1 tem admin confirmando RAS. Aqui não há rol distintos.

**Solução**: Adicionar cheque `user.role === 'admin'` em `/api/ras/[id]/confirmar`

---

## 🏗️ ESTRUTURA - Problemas Arquiteturais

### 15. **Falta de Padrão Consistente com Outras Features**

**Comparação**:
- **lancamentos**: Tem repository + service ✓
- **cartao**: Tem repository + service + engine ✓
- **ras**: Tudo inline nas rotas ❌

**Solução**: Seguir padrão de lancamentos/cartao

```
src/server/repositories/ras.repository.ts
src/server/services/ras.service.ts
app/api/ras/* (roteadores + controller)
```

---

### 16. **Sem Testes Unitários para Lógica de RAS**

**Arquivo**: Nenhum teste para:
- Validação de 8h descanso
- Transição de status
- Cálculo de 72h window
- Conflito com Escala

**Solução**: Adicionar testes em `tests/unit/ras.service.test.ts`

---

## 📋 CHECKLIST DE CORREÇÃO (Antes de Sprint 1)

### 🔴 BLOQUEADORES (DEVE fazer antes)
- [ ] **FIX-1**: Timezone São Paulo — criar helper centralizado
- [ ] **FIX-2**: Status auto-atribuído — mudar para `realizado` para datas passadas
- [ ] **FIX-3**: Validação de conflito Escala — corrigir enum e adicionar RasAgendamento
- [ ] **FIX-4**: Repository/Service layer — refatorar app/api/ras/* para usar services
- [ ] **FIX-5**: Cron job 72h — implementar real no `/api/cron/ras-transition`

### 🟠 ALTOS (DEVERIA fazer antes)
- [ ] **FIX-6**: Descanso 8h — refatorar aritmética com timestamps
- [ ] **FIX-7**: Escala repository — criar para validações isoladas
- [ ] **FIX-8**: Race condition — usar unique constraint + try-catch
- [ ] **FIX-9**: Error codes — criar enum de códigos padronizados

### 🟡 MÉDIOS (BOM fazer antes)
- [ ] **FIX-10**: Audit log — adicionar tabela e registrar mudanças
- [ ] **FIX-11**: Soft delete — implementar para RAS confirmados
- [ ] **FIX-12**: Admin permissions — diferenciar roles em endpoints críticos
- [ ] **FIX-13**: Testes unitários — cobertura para lógica de negócio

---

## 🎯 Ordem Recomendada de Correção

### Fase 0: Setup (30 min)
1. FIX-1: Timezone helper
2. FIX-9: Error codes enum

### Fase 1: Architecture (1-2h)
3. FIX-4: Repository/Service refactor
4. FIX-7: Escala repository

### Fase 2: Logic (1h)
5. FIX-2: Auto-status para data passada
6. FIX-3: Validação de conflito completa
7. FIX-6: Descanso 8h com timestamps
8. FIX-8: Race condition handling

### Fase 3: Features (1h)
9. FIX-5: Cron job 72h
10. FIX-10: Audit log
11. FIX-11: Soft delete

### Fase 4: Quality (30 min)
12. FIX-12: Admin permissions
13. FIX-13: Unit tests

---

## 📊 Impacto por Correção

| Correção | Impacto | Esforço | Prioridade |
|----------|---------|---------|------------|
| FIX-1 (Timezone) | 🔴 Crítico | 30min | 1️⃣ |
| FIX-2 (Auto-status) | 🔴 Crítico | 15min | 1️⃣ |
| FIX-3 (Conflito) | 🔴 Crítico | 45min | 1️⃣ |
| FIX-4 (Repository) | 🔴 Crítico | 2h | 1️⃣ |
| FIX-5 (Cron) | 🟠 Alto | 45min | 2️⃣ |
| FIX-6 (8h) | 🟠 Alto | 30min | 2️⃣ |
| FIX-7 (Escala repo) | 🟠 Alto | 45min | 2️⃣ |
| FIX-8 (Race) | 🟠 Alto | 20min | 2️⃣ |
| FIX-9 (Error codes) | 🟡 Médio | 20min | 3️⃣ |
| FIX-10 (Audit) | 🟡 Médio | 1h | 3️⃣ |
| FIX-11 (Soft delete) | 🟡 Médio | 45min | 3️⃣ |
| FIX-12 (Permissions) | 🟡 Médio | 30min | 3️⃣ |
| FIX-13 (Tests) | 🟡 Médio | 1h | 3️⃣ |

**Total Estimado**: 8-10 horas

---

## 🎓 Conclusão

O projeto tem uma **boa base de tipos/validações**, mas a **implementação atual viola padrões profissionais de banco**:

- ❌ Sem separação de responsabilidades (repository/service)
- ❌ Bugs críticos em timezone e status
- ❌ Validações incompletas (conflito Escala)
- ❌ Regras de negócio (72h, 8h) não totalmente implementadas
- ❌ Sem audit/compliance (necessário para fintech)

**Recomendação**: Investir 8-10h em refatoração agora, antes da Sprint 1, economiza 20h depois e garante qualidade nível banco.

---

## 📎 Próximos Passos

1. ✅ Aprovação deste audit
2. ⏳ Executar Fase 0 (Timezone + Error codes)
3. ⏳ Executar Fase 1 (Repository/Service refactor)
4. ⏳ Depois disso, Spring 1 de RAS fica muito mais rápida

**Quer que eu comece pelas correções agora?**
