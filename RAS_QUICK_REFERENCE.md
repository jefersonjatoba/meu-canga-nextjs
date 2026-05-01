# RAS Module - Quick Reference Guide

## 1. Key Statistics

- **Total Lines**: ~2,000 lines across all documentation
- **Core Database Tables**: 4 (RasAgenda, RasAgendamento, RasPagamento, RasCenarioSalvo)
- **API Endpoints**: 7 main routes with multiple operations
- **UI Components**: 4 modal types + 1 card component + calendar + charts
- **Business Rules**: 6 major validation layers
- **Supported Locations**: 75 unique police units (47 BPM + 11 Special + 17 UPP)

---

## 2. File Locations Quick Map

| File | Purpose | Lines |
|------|---------|-------|
| `/app/api/ras/route.ts` | List & Create | 243 |
| `/app/api/ras/[id]/route.ts` | Detail, Update, Delete | 186 |
| `/app/api/ras/stats/route.ts` | Monthly Statistics | 148 |
| `/app/api/ras/[id]/pagamentos/route.ts` | Payments | 114 |
| `/app/api/ras/cenarios/route.ts` | Scenarios | 79 |
| `/app/api/cron/ras-transition/route.ts` | Auto-Transition | 58 |
| `/app/dashboard/ras/page.tsx` | Main Dashboard UI | 696+ |
| `/src/types/ras.ts` | Types & Constants | 315 |
| `/src/lib/validations/ras.ts` | Zod Schemas | 328 |
| `/src/lib/ras-calculations.ts` | Pure Functions | 136 |
| `/prisma/schema.prisma` | Database Schema | 75-171 |
| `/docs/ras-rules.md` | Business Rules Doc | 126 |

---

## 3. Price Table (Quick Reference)

```
RANK              6h      8h      12h     24h
─────────────────────────────────────────────
SD/CB          208,63  272,47  400,15  783,21
SGT/SUBTEN     243,92  319,52  470,74  924,37
```

All values in BRL. Stored in cents in database.

---

## 4. Business Rules Summary

### Monthly Limit
- **Cap**: 120 hours/month (hard limit)
- **Warning**: 96 hours (80% threshold)
- **Error Code**: 422 if exceeded

### Rest Requirement
- **Gap**: Minimum 8 hours between RAS events
- **Scope**: Across day boundaries
- **Error Code**: 422 if violated

### Status Transitions
```
agendado → [realizado] → [pendente] → [confirmado]
         → [cancelado] (anytime)
```

### 72-Hour Window
- **When**: After marking RAS as 'realizado'
- **Duration**: 72 hours from event start time
- **Auto-Transition**: realizado → pendente (via cron)
- **Cron**: Runs every 30 minutes

---

## 5. API Endpoints Cheat Sheet

### List RAS
```bash
GET /api/ras?competencia=2026-05&status=realizado&page=1&pageSize=20
```

### Create RAS
```bash
POST /api/ras
Body: {
  data: "2026-05-15",
  horaInicio: "08:00",
  horaFim: "20:00",
  duracao: 12,
  local: "2º BPM - Botafogo",
  graduacao: "SD/CB",
  tipo: "voluntario",
  tipoVaga: "titular",
  competencia: "2026-05",
  observacoes: "optional"
}
```

### Update Status
```bash
PATCH /api/ras/{id}
Body: {
  status: "realizado"  // or confirmado, cancelado
}
```

### Get Statistics
```bash
GET /api/ras/stats?mes=2026-05
```

### Register Payment
```bash
POST /api/ras/{rasId}/pagamentos
Body: {
  valorCentavos: 40015,
  dataPagamento: "2026-05-10",
  comprovante: "DOC123456",  // optional
  observacoes: "Paid"         // optional
}
```

---

## 6. Validation Rules Checklist

When creating/updating RAS, backend validates:

- [ ] Date format: yyyy-MM-dd
- [ ] Time format: HH:mm
- [ ] Duration: 6, 8, 12, or 24 only
- [ ] Competencia: yyyy-MM matching data month
- [ ] (Grad, Duration) exists in price table
- [ ] Location in RAS_ALL_LOCALS (75 options)
- [ ] horaFim > horaInicio
- [ ] Monthly hours would not exceed 120
- [ ] No duplicate (userId, data, horaInicio)
- [ ] 8-hour gap from all other non-cancelled RAS
- [ ] No overlap with Escala (regular shifts)
- [ ] Status transition is valid
- [ ] RAS not already confirmed (immutable)

---

## 7. Status State Machine Quick Guide

```
┌─────────┬─────────────────────────────────────────┐
│ FROM    │ CAN TRANSITION TO                       │
├─────────┼─────────────────────────────────────────┤
│agendado │ realizado, cancelado                    │
│realizado│ pendente (auto-cron), confirmado, cancel│
│pendente │ confirmado, cancelado                   │
│confirm  │ (LOCKED - no transitions)               │
│cancel   │ (LOCKED - no transitions)               │
└─────────┴─────────────────────────────────────────┘
```

---

## 8. Key Database Indexes

For query performance:

```sql
RasAgenda:
  ├─ (userId, competencia, status)
  ├─ (userId, data)
  ├─ UNIQUE(userId, data, horaInicio)
  
RasAgendamento:
  ├─ (userId, rasAgendaId, status)
  
RasPagamento:
  ├─ (userId, competencia)
  
RasCenarioSalvo:
  ├─ (userId, mes)
```

---

## 9. Error Codes Reference

| Code | Scenario | Example |
|------|----------|---------|
| 200 | OK | Data returned successfully |
| 201 | Created | New RAS created |
| 400 | Bad Request | Invalid JSON or format |
| 401 | Unauthorized | No session token |
| 403 | Forbidden | Accessing another user's RAS |
| 404 | Not Found | RAS ID doesn't exist |
| 409 | Conflict | Duplicate or scheduling conflict |
| 422 | Unprocessable | Validation failed (status, hours, rest, etc) |
| 500 | Server Error | Database or server issue |

---

## 10. Component Hierarchy

```
app/dashboard/ras/page.tsx (Client Component)
├─ RasHeader
├─ TabNavigation
├─ MonthNavigator
├─ StatsPanel
├─ TabContent
│  ├─ AgendaTab
│  │  ├─ FilterBar
│  │  ├─ RasCardList
│  │  │  ├─ RasCard (repeated)
│  │  └─ Pagination
│  ├─ CalendarTab
│  │  └─ RasCalendar
│  └─ GraficosTab
│     ├─ BarChart (hours)
│     └─ BarChart (value)
├─ ModalForm (Create/Edit)
├─ ModalConfirmar (Realize)
└─ ModalPagamento (Register Payment)
```

---

## 11. React Query Pattern

```typescript
// Fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['ras', { competencia, status, page }],
  queryFn: () => fetchRas({ competencia, status, page })
})

// Creating
const mutation = useMutation({
  mutationFn: (newRas) => createRas(newRas),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['ras'] })
    qc.invalidateQueries({ queryKey: ['ras-stats'] })
  },
  onError: (error) => setError(error.message)
})

// Using
mutation.mutate(formData)
mutation.isPending  // Loading state
```

---

## 12. Calculation Functions

```typescript
// File: src/lib/ras-calculations.ts

calculateRasMonthlyHours(agendamentos, mes, ano)
// → number (total hours for month)

calculateRasWarningLevel(totalHoras)
// → 'normal' | 'warning' | 'critical'

canScheduleRas(existingHours, newDuracao)
// → boolean (true if can add)

calculateRestRequirementsBetween(ras1, ras2)
// → { hoursGap, valid }

isWithinConfirmationWindow(dataRas, dataAtual)
// → boolean (72h window check)
```

---

## 13. Type Definitions

```typescript
type GraduacaoRas = 'SD/CB' | 'SGT/SUBTEN'
type DuracaoRas = 6 | 8 | 12 | 24
type TipoRas = 'voluntario' | 'compulsorio'
type TipoVagaRas = 'titular' | 'reserva'
type StatusRas = 'agendado' | 'realizado' | 'pendente' | 'confirmado' | 'cancelado'

interface RasAgenda {
  id, userId, data, horaInicio, horaFim, duracao,
  local, graduacao, tipo, tipoVaga, valorCentavos,
  status, competencia, expiresAt, observacoes,
  createdAt, updatedAt, agendamentos, pagamentos
}
```

---

## 14. Locations Quick Map

### BPM (47)
1º-47º covering all RJ (São Gonçalo, Botafogo, Méier, Campos, Copacabana, etc.)

### Special (11)
BOPE, BPChq, RECOM, BPVE, BAC, GAM, BPRv, GPFer, CPAM, BPtur, BEPE

### UPP (17)
Santa Marta, Rocinha, Alemão, Penha, Providência, Pavão, etc.

**Total: 75 unique locations**

---

## 15. UI Modals Summary

| Modal | Purpose | Fields |
|-------|---------|--------|
| ModalForm | Create/Edit RAS | Data, Hora, Duration, Location, Rank, Type, Vaga, Notes |
| ModalConfirmar | Mark as Realized | Observações (optional) |
| ModalPagamento | Register Payment | Valor, Data, Comprovante, Observações |
| ModalRealizar | (optional) | Confirmation dialog |

All modals are overlays (z-50) with dark background (rgba(0,0,0,0.75)).

---

## 16. Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/meucanga
CRON_SECRET=<random-32-char-token>
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

---

## 17. Development Checklist

- [ ] Install dependencies: `npm install`
- [ ] Setup database: `npx prisma db push`
- [ ] Create seed user: `npx ts-node create_test_user.ts`
- [ ] Start dev server: `npm run dev`
- [ ] Run tests: `npm test`
- [ ] Format code: `npm run format`
- [ ] Check types: `npm run type-check`

---

## 18. Common Bugs & Solutions

### Bug: 72h window not expiring
**Solution**: Check cron job is running. Verify CRON_SECRET in environment.

### Bug: Monthly limit not enforced
**Solution**: Check validation in POST /api/ras - ensure it queries current month only.

### Bug: 8-hour gap not working
**Solution**: Verify time calculation handles day boundaries (e.g., 22:00→06:00 next day).

### Bug: RAS card shows wrong price
**Solution**: Check getRasPrice() uses correct (graduacao, duracao) combination.

### Bug: Can edit confirmed RAS
**Solution**: Verify PATCH handler checks `existing.status === 'confirmado'` before allowing edits.

---

## 19. Performance Tips

1. **Query caching**: React Query auto-caches for 5 minutes
2. **Pagination**: Use pageSize=20 for list views
3. **Indexes**: Ensure database indexes on userId, data, status, competencia
4. **Lazy load**: Calendar and chart tabs load stats only when clicked
5. **localStorage**: Persist graduation preference to avoid re-selecting

---

## 20. Resources

- **Main Docs**: `RAS_MODULE_COMPLETE_DOCUMENTATION.md` (1,113 lines)
- **Architecture**: `RAS_TECHNICAL_ARCHITECTURE.md` (806 lines)
- **Business Rules**: `docs/ras-rules.md` (126 lines)
- **Migration Status**: `MIGRATION_STATUS.md`

---

**Last Updated**: May 1, 2026  
**Module Status**: Production Ready  
**Next Review**: November 2026
