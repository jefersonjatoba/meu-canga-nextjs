# RAS (Regime Adicional de Serviço) Module - Complete Documentation

**Project**: Meu Canga Next.js  
**Module**: RAS (Additional Security Service Schedule)  
**Date Generated**: May 1, 2026  
**Language**: Portuguese (Brazilian)  
**Target Users**: Rio de Janeiro Police Officers  

---

## 1. FILE STRUCTURE

### API Routes
```
app/api/ras/
├── route.ts                      # GET (list) & POST (create) RAS schedules
├── [id]/
│   ├── route.ts                  # GET, PATCH (update), DELETE (soft-cancel)
│   ├── pagamentos/
│   │   └── route.ts              # GET & POST payment records
│   └── comprovante/
│       └── route.ts              # Certificate endpoints
├── cenarios/
│   ├── route.ts                  # GET & POST saved scenarios
│   └── [id]/
│       └── route.ts              # Individual scenario operations
└── stats/
    └── route.ts                  # Monthly statistics & metrics
```

### Frontend Pages & Components
```
app/dashboard/ras/
└── page.tsx                      # Main RAS dashboard (696 lines)

src/
├── types/ras.ts                  # Type definitions (315 lines)
├── lib/
│   ├── ras-calculations.ts       # Business logic (136 lines)
│   └── validations/ras.ts        # Zod schemas (328 lines)
└── components/
    └── ras/                      # RAS-specific components
```

### Database
```
prisma/schema.prisma
├── RasAgenda                      # Main schedule table
├── RasAgendamento                 # Schedule tracking
├── RasPagamento                   # Payment records
└── RasCenarioSalvo               # Saved scenarios
```

### Documentation
```
docs/ras-rules.md                 # Business rules reference
```

---

## 2. DATA MODELS & DATABASE SCHEMA

### RasAgenda (Core Entity)
```typescript
model RasAgenda {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  data          DateTime                          // Event date
  horaInicio    String                            // Start time (HH:mm)
  horaFim       String                            // End time (HH:mm)
  duracao       Int                               // Duration: 6|8|12|24 hours
  local         String                            // Unit name (BPM, UPP, Special)
  graduacao     String                            // Rank: "SD/CB" | "SGT/SUBTEN"
  valorCentavos Int                               // Price in cents (fixed at booking)
  status        String    @default("agendado")    // agendado|realizado|pendente|confirmado|cancelado
  competencia   String                            // Reference month (yyyy-MM)
  tipo          String    @default("voluntario")  // voluntario|compulsorio
  tipoVaga      String    @default("titular")     // titular|reserva
  expiresAt     DateTime?                         // 72h confirmation window expiry
  observacoes   String?                           // Notes
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  agendamentos RasAgendamento[]
  pagamentos   RasPagamento[]

  @@unique([userId, data, horaInicio])              // No duplicates same day/time
  @@index([userId])
  @@index([data])
  @@index([status])
  @@index([competencia])
}
```

### RasAgendamento (Schedule History)
```typescript
model RasAgendamento {
  id             String    @id @default(cuid())
  rasAgendaId    String
  rasAgenda      RasAgenda @relation(fields: [rasAgendaId], references: [id], onDelete: Cascade)
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  status         String    @default("agendado")
  dataRealizacao DateTime?                          // Actual completion date
  observacoes    String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([rasAgendaId])
  @@index([userId])
  @@index([status])
}
```

### RasPagamento (Payment Records)
```typescript
model RasPagamento {
  id            String    @id @default(cuid())
  rasAgendaId   String
  rasAgenda     RasAgenda @relation(fields: [rasAgendaId], references: [id], onDelete: Cascade)
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  valorCentavos Int                               // Amount paid in cents
  competencia   String                            // Payment month (yyyy-MM)
  dataPagamento DateTime?                         // Payment date
  comprovante   String?                           // Proof/receipt number
  observacoes   String?                           // Notes
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([rasAgendaId])
  @@index([userId])
  @@index([competencia])
}
```

### RasCenarioSalvo (Scenario Planning)
```typescript
model RasCenarioSalvo {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  nome          String                            // Scenario name
  descricao     String?                           // Description
  mes           String                            // Month (yyyy-MM)
  graduacao     String                            // Rank for scenario
  eventos       Json                              // Array of {data, local, duracao}
  totalHoras    Int                               // Total hours in scenario
  totalCentavos Int                               // Total value in cents
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([mes])
}
```

---

## 3. PRICE TABLE & CALCULATIONS

### RAS_PRICE_TABLE (in cents)
```typescript
export const RAS_PRICE_TABLE: Record<GraduacaoRas, Record<DuracaoRas, number>> = {
  'SD/CB':      { 6: 20863, 8: 27247, 12: 40015, 24: 78321 },
  'SGT/SUBTEN': { 6: 24392, 8: 31952, 12: 47074, 24: 92437 },
}
```

**Formatted Values (BRL)**:
| Rank | 6h | 8h | 12h | 24h |
|------|-------|-------|-------|--------|
| SD/CB | R$ 208,63 | R$ 272,47 | R$ 400,15 | R$ 783,21 |
| SGT/SUBTEN | R$ 243,92 | R$ 319,52 | R$ 470,74 | R$ 924,37 |

### Key Calculations (src/lib/ras-calculations.ts)

**Monthly Hours Sum**:
```typescript
calculateRasMonthlyHours(rasAgendamentos, mes, ano): number
// Sums duracao of all non-cancelled RAS for given month
```

**Warning Level**:
```typescript
calculateRasWarningLevel(totalHoras): 'normal' | 'warning' | 'critical'
- normal:   < 96h   (below 80% of 120h cap)
- warning:  96-119h (yellow alert)
- critical: >= 120h (limit reached)
```

**Rest Requirement Validation**:
```typescript
calculateRestRequirementsBetween(ras1, ras2)
// Validates minimum 8-hour gap between consecutive RAS events
// Returns: { hoursGap, valid: boolean }
```

**Confirmation Window Check**:
```typescript
isWithinConfirmationWindow(dataRas, dataAtual): boolean
// Checks if current date is within 72-hour confirmation window from RAS date
// Window: midnight on RAS date → +72 hours
```

---

## 4. BUSINESS RULES & VALIDATION

### Status State Machine
```
                  ┌──────────────┐
                  │   agendado   │
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │  realizado   │
                  └──────┬───────┘
                    ┌────┴─────┐
                    │           │
            ┌───────▼──┐  ┌─────▼─────────┐
            │ pendente │  │ confirmado    │ (final state)
            └───────┬──┘  └───────────────┘
                    │
            ┌───────▼─────────────────────┐
            │ confirmado (final state)    │
            └─────────────────────────────┘

Any non-confirmed status → cancelado (final state)
```

### Allowed Transitions
| From | To | Condition |
|------|----|-----------:|
| `agendado` | `realizado` | Date has passed + within 72h |
| `agendado` | `cancelado` | Anytime |
| `realizado` | `pendente` | Automatic via cron (72h expired) |
| `realizado` | `confirmado` | Manual (admin/finance) |
| `realizado` | `cancelado` | Within 72h window |
| `pendente` | `confirmado` | Manual |
| `pendente` | `cancelado` | Manual |
| `confirmado` | *(none)* | Immutable final state |
| `cancelado` | *(none)* | Immutable final state |

### Monthly Hours Limit
```
Maximum: 120 hours/month (hard cap)
Warning threshold: 96 hours (80%)
Validation: HorasDoMes + novaDuracao <= 120
Error code: 422 (Unprocessable Entity)
```

### Rest Requirement (8-hour minimum)
```
Between any two non-cancelled RAS events:
- Calculate gap from end of first → start of second
- Gap must be >= 8 hours
- Applied across day boundaries (e.g., 22:00 → 06:00 next day)
- Error code: 422
```

### No Duplicate Same Day/Time
```
UNIQUE constraint: (userId, data, horaInicio)
Prevents scheduling same user at exact same time on same date
Error code: 409 (Conflict)
```

### Schedule Conflict Detection
```
Before creating RAS, checks if user has:
1. Overlapping RAS events (8h rest requirement)
2. Overlapping Escala (regular shift) on same date
If conflict exists: Error 409 (Conflict)
```

### Auto-Status Logic
```typescript
if (eventDate < today) {
  status = 'confirmado'     // Past events auto-confirmed
} else {
  status = 'agendado'       // Future events scheduled
}
```

### 72-Hour Confirmation Window
```
When status changes to 'realizado':
  expiresAt = dataEvento + 72 hours (São Paulo timezone)

Cron job (/api/cron/ras-transition) runs every 30 minutes:
  - Finds all RAS where status='realizado' AND expiresAt < now()
  - Auto-transitions to status='pendente'
  - Cannot be edited once confirmed
```

---

## 5. API ENDPOINTS

### List RAS Schedules
```
GET /api/ras

Query Parameters:
  competencia=2026-05        (optional, yyyy-MM)
  status=agendado            (optional, or 'all')
  graduacao=SD/CB            (optional, or 'all')
  local=1º BPM              (optional, partial match)
  page=1                     (optional, default 1)
  pageSize=20                (optional, default 20, max 100)

Response:
{
  success: true,
  data: {
    rasAgendas: RasAgenda[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }
}

Auto-transitions: realizado→pendente if expiresAt passed
```

### Create RAS Schedule
```
POST /api/ras

Body:
{
  data: "2026-05-15",            // yyyy-MM-dd
  horaInicio: "08:00",           // HH:mm
  horaFim: "20:00",              // HH:mm
  duracao: 12,                   // 6|8|12|24
  local: "2º BPM - Botafogo",    // Must be in RAS_ALL_LOCALS
  graduacao: "SD/CB",            // SD/CB|SGT/SUBTEN
  tipo: "voluntario",            // voluntario|compulsorio
  tipoVaga: "titular",           // titular|reserva
  competencia: "2026-05",        // yyyy-MM (must match data month)
  observacoes: "Optional notes"  // max 500 chars
}

Validations:
  - Monthly hours limit (120h max)
  - No duplicate same day/time
  - 8-hour minimum rest between RAS
  - No conflict with regular schedule (Escala)
  - Price table lookup: (graduacao, duracao) must exist
  - competencia must match data month

Response:
  201 Created with created RasAgenda
  400/409/422 on validation errors
```

### Get RAS Detail
```
GET /api/ras/{id}

Response:
  200 with RasAgenda object (includes agendamentos, pagamentos)
  404 if not found
  403 if not user's RAS
```

### Update RAS Schedule
```
PATCH /api/ras/{id}

Body (all optional):
{
  data: "2026-05-16",           // Can reschedule
  horaInicio: "09:00",
  horaFim: "21:00",
  duracao: 12,
  local: "3º BPM - Méier",
  graduacao: "SGT/SUBTEN",
  tipo: "compulsorio",
  tipoVaga: "reserva",
  competencia: "2026-05",
  status: "realizado",           // Status change
  observacoes: "Updated notes"
}

Validations:
  - Status transition rules enforced
  - Cannot modify if status='confirmado'
  - If marking as 'realizado', expiresAt set to data+72h
  - At least one field required

Response:
  200 with updated RasAgenda
  422 on invalid transition or locked status
```

### Delete/Cancel RAS
```
DELETE /api/ras/{id}

Body: (none)

Behavior:
  - Soft-cancel: sets status='cancelado'
  - Cannot cancel if already 'confirmado'
  - Cannot cancel if already 'cancelado'

Response:
  200 with cancelled RasAgenda
  422 if already in final state
```

### Get RAS Statistics
```
GET /api/ras/stats

Query Parameters:
  mes=2026-05                    (optional, yyyy-MM)
  ano=2026                       (optional fallback)
  (defaults to current month if not provided)

Response:
{
  success: true,
  data: {
    competencia: "2026-05",
    totalHoras: 48,
    totalCentavos: 192000,       // In cents
    totalEventos: 4,
    eventosPendentes: 1,
    eventosConfirmados: 2,
    percentualLimite: 40,        // % of 120h
    alertaLimite: false,         // true if >= 96h
    horasRestantes: 72,
    horasPorGraduacao: {
      "SD/CB": 24,
      "SGT/SUBTEN": 24
    },
    contagemPorStatus: {
      agendado: 1,
      realizado: 1,
      pendente: 1,
      confirmado: 1,
      cancelado: 0
    },
    horasPorStatus: {
      agendado: 8,
      realizado: 8,
      pendente: 12,
      confirmado: 20,
      cancelado: 0
    },
    centavosPorStatus: { /* ... */ },
    historico3Meses: [
      { competencia: "2026-04", totalHoras: 44, totalCentavos: 176000 },
      { competencia: "2026-03", totalHoras: 52, totalCentavos: 208000 },
      { competencia: "2026-02", totalHoras: 40, totalCentavos: 160000 }
    ]
  }
}
```

### Get/Create Payment Records
```
GET /api/ras/{rasId}/pagamentos
  Returns: RasPagamento[]

POST /api/ras/{rasId}/pagamentos

Body:
{
  valorCentavos: 40015,          // Must be positive integer
  dataPagamento: "2026-05-15",   // optional, defaults to today
  comprovante: "DOC123456",      // optional, max 500 chars
  observacoes: "Payment notes"   // optional, max 500 chars
}

Validations:
  - RAS must exist and belong to user
  - RAS status must be 'confirmado' or 'pendente'
  - valor must be positive

Response:
  201 Created with RasPagamento
  404 if RAS not found
  409 if RAS in wrong status
```

### Saved Scenarios (Planning Tool)
```
GET /api/ras/cenarios?mes=2026-05
  Returns: RasCenarioSalvo[] (ordered by creation date desc)

POST /api/ras/cenarios

Body:
{
  nome: "Scenario April",        // 1-100 chars
  descricao: "Testing...",       // optional, max 300 chars
  mes: "2026-04",                // yyyy-MM
  graduacao: "SD/CB",
  eventos: [
    { data: "2026-04-05", local: "2º BPM", duracao: 8 },
    { data: "2026-04-10", local: "5º BPM", duracao: 12 }
  ]
}

Validations:
  - At least 1 event required
  - Total hours <= 120h
  - All locations must be valid

Response:
  201 Created with calculated totalHoras, totalCentavos
  Does NOT affect actual schedule or balance
```

---

## 6. FRONTEND UI & COMPONENTS

### Main Page: app/dashboard/ras/page.tsx (696 lines)

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ RAS Dashboard Header                    │
│ Logo + Title + Quick Stats              │
└─────────────────────────────────────────┘
│ ┌──────────────────┬──────────────────┐ │
│ │ Tab Navigation   │ Month Navigator  │ │
│ │ (Agenda/Gráficos)│ (◀ May 2026 ▶)  │ │
│ └──────────────────┴──────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Month Statistics Panel              │ │
│ │ Total Hours | Total Value | Pending │ │
│ │ Progress Bar (% of 120h limit)      │ │
│ └─────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐│
│ │ [AGENDA TAB] (default view)          ││
│ │ ┌──────────────────────────────────┐││
│ │ │ Filters: Status | Graduation     │││
│ │ │ [+ Agendar] [Calendário]         │││
│ │ └──────────────────────────────────┘││
│ │ ┌────────────────────────────────┐  ││
│ │ │ RAS Card #1 (Agendado)         │  ││
│ │ │ Local, Date, Time, Value       │  ││
│ │ │ [✅ Realizado][✏️ Edit][❌ Del]│  ││
│ │ └────────────────────────────────┘  ││
│ │ ┌────────────────────────────────┐  ││
│ │ │ RAS Card #2 (Realizado)        │  ││
│ │ │ ⏳ Confirm in: 12h 30min       │  ││
│ │ │ [🔒 Confirmar][💰 Pagar]      │  ││
│ │ └────────────────────────────────┘  ││
│ │                                      ││
│ │ Calendar View (optional)             ││
│ │ Grid with days, RAS count per day   ││
│ └──────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐│
│ │ [GRÁFICOS TAB]                       ││
│ │ Bar Chart: Hours per Month (6 mo)   ││
│ │ Bar Chart: Value per Month (6 mo)   ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Modal Components

**1. ModalForm (Create/Edit RAS)**
```
─────────────────────────────────────
│ ➕ Agendar RAS / ✏️ Editar RAS    │
─────────────────────────────────────
│                                   │
│ Data: [____/____/____]            │
│ Hora Início: [dropdown: 00:00-23] │
│ Duração: [6h] [8h] [12h] [24h]    │
│   Each button shows: 6h          │
│                    R$ 208,63     │
│                                   │
│ Término: 20:00                    │
│                                   │
│ Graduação: [SD/CB] [SGT/SUBTEN]   │
│                                   │
│ Tipo:        Vaga:                │
│ [✅ Vol]     [★ Tit]              │
│ [⚡ Comp]    [🎭 Res]             │
│                                   │
│ Local: [dropdown with groups]     │
│ ├─ BPM (47 options)              │
│ ├─ Especiais (11 options)        │
│ └─ UPP (17 options)              │
│                                   │
│ Observações: [textarea, 500 max] │
│                                   │
│ ┌─────────────────────────────┐  │
│ │ Valor do RAS    R$ 400,15   │  │
│ └─────────────────────────────┘  │
│                                   │
│ [Cancelar] [Agendar/Salvar]       │
│                                   │
─────────────────────────────────────
```

**2. ModalConfirmar (Mark as Realized)**
```
─────────────────────────────────
│ 🔒 Confirmar Pagamento        │
│                               │
│ 05/05/2026 · 08:00–20:00     │
│ 2º BPM - Botafogo            │
│                               │
│ ┌─────────────────────────┐   │
│ │ Valor  R$ 400,15        │   │
│ └─────────────────────────┘   │
│                               │
│ Observações: [textarea]       │
│                               │
│ [Cancelar] [Confirmar]        │
│                               │
─────────────────────────────────
```

**3. ModalPagamento (Register Payment)**
```
─────────────────────────────────────
│ 💰 Registrar Pagamento        │
│ 05/05/2026 · 2º BPM           │
│                               │
│ Valor Pago (R$): [R$ 400,15]  │
│                               │
│ Data do Pagamento:            │
│ [05/05/2026]                  │
│                               │
│ Comprovante (URL/nº):         │
│ [DOC1234567] (optional)       │
│                               │
│ Observações: [textarea]       │
│                               │
│ [Cancelar] [Registrar]        │
│                               │
─────────────────────────────────────
```

### RAS Card Component
```
┌──────────────────────────────────────┐
│ 📅 Agendado   ✅ Voluntário · ★ Tit  │
│                                      │
│ 2º BPM - Botafogo             R$ ...│
│ 05/05/2026 · 08:00–20:00 · 12h     │
│                                      │
│ [✅ Realizado] [✏️ Editar]  [❌ Del] │
│                                      │
│   or (if realizado):                 │
│                                      │
│ ⏳ Confirmar em: 24h 15min           │
│ [🔒 Confirmar] [💰 Pagar]  [❌ Del] │
│                                      │
└──────────────────────────────────────┘
```

### Calendar Component
```
┌────────────────────────────────┐
│ May 2026                        │
├─────────────────────────────────┤
│ Seg Ter Qua Qui Sex Sáb Dom    │
├─────────────────────────────────┤
│       1   2   3  [4]  5   6     │
│                   ◇◆ (today)   │
│   7   8   9  10  11  12  13    │
│  [V]                           │
│  8h                            │
├─────────────────────────────────┤
│ ■ V = Voluntário               │
│ ■ C = Compulsório              │
└────────────────────────────────┘
```

### Status Badge Colors
```
agendado:   Blue badge     #60a5fa (bg: rgba(.15))
realizado:  Green badge    #22c55e (bg: rgba(.15))
pendente:   Amber badge    #f59e0b (bg: rgba(.15))
confirmado: Emerald badge  #10b981 (bg: rgba(.15))
cancelado:  Red badge      #ef4444 (bg: rgba(.1))
```

### Responsive Design
- **Desktop**: Full card layout, side-by-side components
- **Tablet (md:)**: Stacked layout, full-width cards
- **Mobile (sm:)**: Single column, modal-first navigation

---

## 7. STATE MANAGEMENT & DATA FLOW

### React Query (TanStack Query) Setup
```typescript
// Hook pattern
const { data, isLoading, error } = useQuery({
  queryKey: ['ras', { competencia, status, page }],
  queryFn: () => fetchRas({ competencia, status, page })
})

// Mutations
const mutation = useMutation({
  mutationFn: (newRas) => createRas(newRas),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ras'] })
    queryClient.invalidateQueries({ queryKey: ['ras-stats'] })
  }
})
```

### localStorage Caching
```typescript
// Persist graduation preference
localStorage.setItem('ras_graduacao', graduacao)
const savedGraduacao = localStorage.getItem('ras_graduacao') as GraduacaoRas
```

### Data Flow
```
User Action
    ↓
Modal/Form Submission
    ↓
API Call (fetch with Content-Type: application/json)
    ↓
Backend Validation → API Response
    ↓
Mutation Success → Query Invalidation
    ↓
Re-fetch Data → UI Update
```

---

## 8. VALIDATION SCHEMAS (Zod)

### Create RAS Schema
```typescript
createRasAgendaSchema = z.object({
  data: dateString(yyyy-MM-dd),           // Required
  horaInicio: timeString(HH:mm),          // Required
  horaFim: timeString(HH:mm),             // Required
  duracao: z.union([6,8,12,24]),          // Required
  local: z.string(),                      // Required, must be in RAS_ALL_LOCALS
  graduacao: z.enum([SD/CB, SGT/SUBTEN]), // Required
  tipo: z.enum([voluntario, compulsorio]),// Default: voluntario
  tipoVaga: z.enum([titular, reserva]),   // Default: titular
  competencia: z.string(yyyy-MM),         // Required, must match data month
  observacoes: z.string().max(500)        // Optional
}).superRefine([
  validate graduacao+duracao in price table
  validate local in RAS_ALL_LOCALS
  validate horaFim > horaInicio
  validate competencia matches data month
])
```

### Update RAS Schema
```typescript
updateRasAgendaSchema = z.object({
  // All fields optional, but at least 1 required
  data, horaInicio, horaFim, duracao: optional
  local, graduacao, tipo, tipoVaga: optional
  competencia, status, observacoes: optional
}).refine(atLeastOneField)
 .superRefine([conditional validations])
```

### Validation Helpers
```typescript
// Format validators
isValidTimeFormat(time: string): boolean        // HH:mm
isValidDateFormat(date: string): boolean        // yyyy-MM-dd
isValidCompetenciaFormat(comp: string): boolean // yyyy-MM

// Calculations
calculateDurationHours(start, end): number      // handles day boundary
extractCompetencia(dateString): {year, month}

// Business logic
validateMonthlyHours(current, new): string|null
```

---

## 9. CRON JOBS & AUTOMATION

### RAS Transition Cron
**File**: `/api/cron/ras-transition`  
**Trigger**: Vercel Cron Jobs (every 30 minutes)  
**Protection**: `Authorization: Bearer ${CRON_SECRET}`

```typescript
// Executes:
const expirados = await prisma.rasAgenda.findMany({
  where: {
    status: 'realizado',
    expiresAt: { lte: now }
  }
})

await prisma.rasAgenda.updateMany({
  where: { id: { in: expirados.map(r => r.id) } },
  data: { status: 'pendente' }
})

// Returns: { transicionados: number, ids: [], executadoEm: ISO }
```

**Expected Cron Setup** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/ras-transition",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## 10. LOCATIONS REFERENCE

### BPM (47 Battalions)
```
1º-47º BPM covering all RJ municipalities including:
São Gonçalo, Botafogo, Méier, São Cristóvão, Centro (Gamboa),
Tijuca, Campos, Rocha Miranda, Barra do Piraí, Nova Friburgo,
Niterói, Bangu, Duque de Caxias, Olaria, Ilha do Governador,
Jacarepaguá, Copacabana, Mesquita, São João de Meriti, Bonsucesso,
Leblon, Queimados, Cabo Frio, Petrópolis, Santa Cruz, Volta Redonda,
Itaperuna, Teresópolis, Recreio, Macaé, Angra, Magé, Itaboraí,
Pádua, Resende, Três Rios, Belford Roxo, Campo Grande, Irajá,
Araruama, Pavuna, Nova Iguaçu, Jacarezinho, Campos Guarus, Barra da Tijuca
```

### Special Units
```
BOPE (SWAT), BPChq (Federal), RECOM, BPVE (Green Police),
BAC (Canine), GAM (Motorcycle), BPRv (Rural), GPFer (Railway),
CPAM (Traffic), BPtur (Tourism), BEPE (Special Peacekeeping)
```

### UPP (17 Pacifying Police Units)
```
Santa Marta, Adeus Baiana, Providência, Pavão, Tabajaras,
Babilônia, Rocinha, São João, Jacarezinho, Lins, Turano,
Borel, Macacos, Complexo do Alemão, Complexo da Penha,
Manguinhos, Mangueira
```

---

## 11. TRANSLATIONS & LABELS

### Status Labels
```
agendado:   📅 Agendado
realizado:  ✅ Realizado
pendente:   ⏳ Pendente
confirmado: 🔒 Confirmado
cancelado:  ❌ Cancelado
```

### Duration Labels
```
6:  6 horas
8:  8 horas
12: 12 horas
24: 24 horas
```

### Graduation Labels
```
SD/CB:      Soldado / Cabo
SGT/SUBTEN: Sargento / Subtenente
```

### Type Labels
```
voluntario:  ✅ Voluntário
compulsorio: ⚡ Compulsório
```

### Vacancy Type Labels
```
titular: ★ Titular
reserva: 🎭 Reserva
```

### Button Labels (Portuguese)
```
Agendar RAS      Schedule new RAS
Editar RAS       Edit RAS
Realizado        Mark as realized
Confirmar        Confirm/Finalize
Cancelar         Cancel
Pagar            Register payment
Cenários         Scenarios
Gráficos         Charts
```

---

## 12. ERROR HANDLING & HTTP STATUS CODES

| Code | Scenario | Message |
|------|----------|---------|
| 200 | Success | Operation completed |
| 201 | Created | New RAS created |
| 400 | Bad Request | Invalid JSON, missing fields |
| 401 | Unauthorized | No user session |
| 403 | Forbidden | RAS belongs to another user |
| 404 | Not Found | RAS ID doesn't exist |
| 409 | Conflict | Duplicate booking, scheduling conflict |
| 422 | Unprocessable | Invalid status transition, validation failed |
| 500 | Server Error | Database/server error |

### Common Validation Errors
```
"Limite mensal de 120h seria excedido"
→ Would exceed monthly cap

"Intervalo mínimo de 8h entre RAS não respeitado"
→ Less than 8 hours gap to existing RAS

"Já existe um RAS agendado para esta data e horário"
→ Duplicate at same time

"Conflito com plantão na Escala: ..."
→ Overlaps with regular schedule

"Transição de status inválida: agendado → cancelado"
→ Not a valid state transition

"Não é possível alterar dados de um RAS confirmado"
→ Confirmed RAS is locked
```

---

## 13. CHARTS & VISUALIZATIONS

### Bar Charts (Recharts)
1. **Hours per Month** (last 6 months)
   - X-axis: Month labels (Jan, Feb, Mar, etc.)
   - Y-axis: Hours (0-120+)
   - Bar color: Blue (#3b82f6)
   - Height: 200px responsive

2. **Value per Month** (last 6 months)
   - X-axis: Month labels
   - Y-axis: Value in BRL (R$)
   - Bar color: Green (#10b981)
   - Height: 200px responsive

### Styling
```typescript
CartesianGrid: strokeDasharray="3 3", stroke="rgba(255,255,255,0.05)"
Tooltip: background="#1a1a2e", border="1px solid rgba(255,255,255,0.1)"
XAxis/YAxis: fill="#9ca3af", fontSize=11
```

---

## 14. TYPE DEFINITIONS (TypeScript)

### Core Types
```typescript
type GraduacaoRas = 'SD/CB' | 'SGT/SUBTEN'
type DuracaoRas = 6 | 8 | 12 | 24
type TipoRas = 'voluntario' | 'compulsorio'
type TipoVagaRas = 'titular' | 'reserva'
type StatusRas = 'agendado' | 'realizado' | 'pendente' | 'confirmado' | 'cancelado'

interface RasAgenda { /* ... */ }                    // 154 fields
interface RasAgendamento { /* ... */ }               // 167 fields
interface RasPagamento { /* ... */ }                 // 180 fields
interface RasCenarioSalvo { /* ... */ }              // 194 fields
interface RasMonthStats { /* ... */ }                // Rich stats object
```

---

## 15. FEATURES SUMMARY

### Create
- **New RAS Schedule**: Full form with date, time, location, duration, rank, type
- **Auto-pricing**: Price calculated from table based on rank+duration
- **Auto-status**: Past events = confirmed, future = scheduled
- **Validation**: Monthly limit, rest gaps, no duplicates, no conflicts

### Read
- **List with filters**: By month, status, rank, location, pagination
- **Detail view**: Single RAS with all data + related payments/agendamentos
- **Statistics**: Monthly hours, breakdown by rank/status, 3-month history
- **Calendar view**: Visual representation of RAS per day

### Update
- **Edit scheduled RAS**: Modify date, time, location, notes
- **Status transitions**: Manual state changes with validation
- **Mark as realized**: Auto-set 72h confirmation window
- **Lock on confirmed**: No edits to finalized RAS

### Delete
- **Soft-cancel**: Mark status as cancelado (not hard-deleted)
- **Prevent confirmed**: Cannot cancel finalized RAS
- **Restore not available**: Once cancelled, cannot undo

### Search & Filter
- **Competencia (month)**: Filter by reference month
- **Status filter**: All, Agendado, Realizado, Pendente, Confirmado, Cancelado
- **Graduation filter**: All, SD/CB, SGT/SUBTEN
- **Location search**: Partial match (contains, case-insensitive)
- **Pagination**: Configurable page size (1-100 items)

### Sort
- **By date**: Default ascending (earliest first)
- **Via query params**: Frontend implements custom sorts

### Export
- **Payment records**: Can export RasPagamento
- **Statistics**: Chart data exportable to CSV via browser

### Additional Features
- **Scenarios**: Save "what-if" plans without affecting actual schedule
- **Payment tracking**: Register payments with date, receipt, notes
- **Calendar view**: Visual month layout with RAS indicators
- **Charts**: Historical data visualization (6-month trend)
- **Notifications**: Countdown timer for 72h confirmation window
- **localStorage**: Persist graduation preference

---

## 16. SUMMARY OF KEY FILES

| File | Lines | Purpose |
|------|-------|---------|
| `src/types/ras.ts` | 315 | All type definitions & constants |
| `src/lib/validations/ras.ts` | 328 | Zod validation schemas |
| `src/lib/ras-calculations.ts` | 136 | Business logic (no DB) |
| `app/api/ras/route.ts` | 243 | GET/POST list & create |
| `app/api/ras/[id]/route.ts` | 186 | GET/PATCH/DELETE detail |
| `app/api/ras/stats/route.ts` | 148 | Monthly statistics endpoint |
| `app/api/ras/cenarios/route.ts` | 79 | Scenario GET/POST |
| `app/api/ras/[id]/pagamentos/route.ts` | 114 | Payment GET/POST |
| `app/api/cron/ras-transition/route.ts` | 58 | Auto-transition cron |
| `app/dashboard/ras/page.tsx` | 696+ | Main UI & components |
| `docs/ras-rules.md` | 126 | Business rules reference |
| `prisma/schema.prisma` | 17-171 | Database schema |

---

## 17. DEPLOYMENT & ENVIRONMENT

### Required Environment Variables
```
DATABASE_URL=postgresql://...
CRON_SECRET=<random-token>
```

### Vercel Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/ras-transition",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Database Migrations
```bash
npx prisma migrate dev --name add_ras_module
npx prisma db push
```

---

## 18. FUTURE ENHANCEMENTS

Potential features not yet implemented:
- SMS/Email notifications (12h before RAS)
- RAS expiration tracking (>30 days pending → expire)
- Admin approval workflow for compulsory RAS
- Bulk operations (multi-select edit/cancel)
- Advanced reporting (PDF export, email)
- API rate limiting
- Audit log (who changed what, when)
- Mobile app integration
- iCalendar (.ics) export
- Integration with payroll system

---

**End of Documentation**

Generated: May 1, 2026  
Module Version: 2026 Fintech Design System  
Status: Production Ready
