# RAS Module - Technical Architecture & Diagrams

---

## 1. SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (React)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/dashboard/ras/page.tsx (696 lines)                   │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ Tab Navigation                                  │     │  │
│  │  │ [Agenda] [Gráficos] [Cenários]                 │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                    ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ Filters & Month Navigator                       │     │  │
│  │  │ Status | Graduation | Location | ◀ May 26 ▶    │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                    ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ RAS Card List OR Calendar View OR Charts       │     │  │
│  │  │                                                  │     │  │
│  │  │ ┌──────────┐  ┌──────────┐  ┌──────────────┐  │     │  │
│  │  │ │RAS Card  │  │RAS Card  │  │ RAS Card ...│  │     │  │
│  │  │ │#1        │  │#2        │  │             │  │     │  │
│  │  │ │[Buttons] │  │[Buttons] │  │ [Buttons]   │  │     │  │
│  │  │ └──────────┘  └──────────┘  └──────────────┘  │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                    ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │ Modals (Overlay)                                │     │  │
│  │  │ • ModalForm (Create/Edit)                       │     │  │
│  │  │ • ModalConfirmar (Realize)                      │     │  │
│  │  │ • ModalPagamento (Register Payment)             │     │  │
│  │  │ • ModalRealizar (Mark Done)                     │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                            │  │
│  │ React Query (TanStack Query)                             │  │
│  │ ├─ queryKey: ['ras', filters]                            │  │
│  │ ├─ queryKey: ['ras-stats', mes]                          │  │
│  │ ├─ mutations: createRas, updateRas, deleteRas            │  │
│  │ └─ cache invalidation on mutation success                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Fetch with Authorization (Bearer Token)                  │  │
│  │ Content-Type: application/json                           │  │
│  │ getApiUser() - Session validation                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND LAYER (Next.js API Routes)              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/api/ras/route.ts (GET/POST)                          │  │
│  │ ├─ GET: List with filters, pagination, auto-transition  │  │
│  │ └─ POST: Create with full validation                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/api/ras/[id]/route.ts (GET/PATCH/DELETE)            │  │
│  │ ├─ GET: Single RAS detail                                │  │
│  │ ├─ PATCH: Update with transition validation             │  │
│  │ └─ DELETE: Soft-cancel to 'cancelado'                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/api/ras/stats/route.ts (GET)                         │  │
│  │ ├─ Aggregates monthly statistics                         │  │
│  │ └─ Returns RasMonthStats with 3-month history            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/api/ras/[id]/pagamentos/route.ts (GET/POST)          │  │
│  │ ├─ GET: List payments for RAS                            │  │
│  │ └─ POST: Create payment record                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/api/ras/cenarios/route.ts (GET/POST)                 │  │
│  │ ├─ GET: List saved scenarios                             │  │
│  │ └─ POST: Create new scenario (what-if planning)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ app/api/cron/ras-transition/route.ts (GET)               │  │
│  │ ├─ Triggered every 30 minutes by Vercel Cron             │  │
│  │ └─ Auto-transitions realizado → pendente (72h expired)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │ VALIDATION LAYER (Zod)                                │      │
│ │ • createRasAgendaSchema                                │      │
│ │ • updateRasAgendaSchema                                │      │
│ │ • rasAgendaFiltersSchema                               │      │
│ │ • createRasCenarioSchema                               │      │
│ │ • createPagamentoSchema                                │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                   │
│ ┌────────────────────────────────────────────────────────┐      │
│ │ BUSINESS LOGIC LAYER (Pure Functions)                 │      │
│ │ src/lib/ras-calculations.ts                            │      │
│ │ • calculateRasMonthlyHours()                           │      │
│ │ • calculateRasWarningLevel()                           │      │
│ │ • canScheduleRas()                                      │      │
│ │ • calculateRestRequirementsBetween()                   │      │
│ │ • isWithinConfirmationWindow()                         │      │
│ └────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER (PostgreSQL)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Prisma ORM                                               │  │
│  │ ├─ RasAgenda (main table)                                │  │
│  │ │  └─ Indexes: userId, data, status, competencia        │  │
│  │ │  └─ Unique: (userId, data, horaInicio)                │  │
│  │ │                                                        │  │
│  │ ├─ RasAgendamento (tracking)                             │  │
│  │ │  └─ Foreign keys: rasAgendaId, userId                 │  │
│  │ │                                                        │  │
│  │ ├─ RasPagamento (payments)                               │  │
│  │ │  └─ Foreign keys: rasAgendaId, userId                 │  │
│  │ │  └─ Indexes: competencia                              │  │
│  │ │                                                        │  │
│  │ └─ RasCenarioSalvo (scenarios)                           │  │
│  │    └─ JSON field: eventos[]                             │  │
│  │    └─ Indexes: userId, mes                              │  │
│  │                                                        │  │
│  │ Related tables (foreign keys)                            │  │
│  │ ├─ User (1:many with RasAgenda, etc.)                   │  │
│  │ └─ Escala (checked for conflicts)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW DIAGRAM

### Creating a New RAS

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks: [+ Agendar]                                        │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ ModalForm opens with form fields                                │
│ • Auto-fill: time=07:00, duration=12, saved graduation         │
│ • Price preview updates on every graduation/duration change     │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ User fills form:                                                │
│ • data, horaInicio (dropdown 00:00-23:00)                       │
│ • duracao (button group), local (dropdown with groups)          │
│ • graduacao, tipo, tipoVaga                                     │
│ • observacoes (optional)                                        │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ User clicks: [Agendar]                                          │
│ Form state → mutation.mutate(formData)                          │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/ras                                                    │
│ ├─ Payload: { data, horaInicio, horaFim, duracao, local, ... } │
│ └─ Headers: Content-Type: application/json                      │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND VALIDATION (route.ts POST handler)                      │
│                                                                   │
│ 1. getApiUser() → validate session                              │
│ 2. createRasAgendaSchema.safeParse(body)                        │
│    ├─ dateStringSchema: yyyy-MM-dd ✓                            │
│    ├─ timeStringSchema: HH:mm ✓                                 │
│    ├─ duracaoEnum: 6|8|12|24 ✓                                  │
│    ├─ graduacao+duracao in RAS_PRICE_TABLE ✓                    │
│    ├─ local in RAS_ALL_LOCALS ✓                                 │
│    ├─ horaFim > horaInicio ✓                                    │
│    └─ competencia matches data month ✓                          │
│                                                                   │
│ 3. validateMonthlyHours(currentHours, newDuracao)               │
│    └─ currentHours + duracao <= 120 ✓                           │
│                                                                   │
│ 4. Check no duplicate: (userId, data, horaInicio) ✓             │
│                                                                   │
│ 5. Check 8-hour rest requirement                                │
│    ├─ Query all non-cancelled RAS for user                      │
│    ├─ For each: calculate gap (end→start, same/adjacent days)   │
│    └─ All gaps >= 480 minutes ✓                                 │
│                                                                   │
│ 6. Check Escala conflict                                        │
│    ├─ Query Escala table for same date                          │
│    ├─ Check time overlap (new.start < existing.end &&           │
│    │                      new.end > existing.start)             │
│    └─ No overlap ✓                                              │
│                                                                   │
│ 7. Auto-status                                                  │
│    ├─ Get current date (São Paulo timezone)                     │
│    ├─ if data < today: status = 'confirmado'                    │
│    └─ else: status = 'agendado'                                 │
│                                                                   │
│ 8. Calculate price                                              │
│    └─ getRasPrice(graduacao, duracao) → valorCentavos           │
│                                                                   │
│ 9. prisma.rasAgenda.create(...)                                 │
│    └─ Insert into database                                      │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSE                                                         │
│ 201 Created: { success: true, data: { ...rasAgenda } }          │
│ or                                                               │
│ 400/409/422: { success: false, error: "message" }               │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (mutation.onSuccess handler)                           │
│ ├─ qc.invalidateQueries({ queryKey: ['ras'] })                 │
│ ├─ qc.invalidateQueries({ queryKey: ['ras-stats'] })           │
│ ├─ localStorage.setItem('ras_graduacao', graduacao)             │
│ └─ onSaved() → close modal                                      │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ RE-FETCH & UI UPDATE                                            │
│ ├─ useQuery refetches RAS list with new filters                 │
│ ├─ useQuery refetches stats                                     │
│ └─ RAS card appears in list (sorted by date)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Status Transition Flow: agendado → realizado → pendente → confirmado

```
┌────────────────┐
│  Event Date    │
│  (e.g. May 5)  │
└────────────────┘
        ▼
┌────────────────────────────────────┐
│ User action: [✅ Realizado]        │
│ (same day or up to 72h after)      │
└────────────────────────────────────┘
        ▼
┌────────────────────────────────────┐
│ PATCH /api/ras/{id}                │
│ { status: 'realizado' }            │
└────────────────────────────────────┘
        ▼
┌────────────────────────────────────┐
│ Backend Logic:                     │
│ ├─ Validate transition allowed     │
│ ├─ Set expiresAt = data + 72h      │
│ └─ Update status='realizado'       │
└────────────────────────────────────┘
        ▼
┌────────────────────────────────────┐
│ Status: realizado                  │
│ expiresAt: May 8, 08:00 (72h)      │
│ [⏳ Confirmar em: 48h 15min]       │
│ [🔒 Confirmar] [💰 Pagar]  [❌]   │
│                                    │
│ Card displays countdown timer      │
└────────────────────────────────────┘
        ▼
        ├─ Manual Path:               Auto Path (Cron):
        │                             │
        ▼                             ▼
    [User clicks:             ┌─────────────────────┐
     🔒 Confirmar]            │ GET /api/cron/ras-  │
        │                     │ transition (every   │
        ▼                     │ 30 minutes)         │
    PATCH /api/ras/{id}       │                     │
    { status:                 │ Finds: expiresAt    │
      'confirmado' }          │ <= now() &&          │
        │                     │ status='realizado'   │
        ▼                     │                     │
    Status: confirmado        │ Updates:            │
    (final, locked)           │ status='pendente'   │
                              │ expiresAt cleared   │
                              └─────────────────────┘
                                      ▼
                              Status: pendente
                              (waiting approval)
                              [🔒 Confirmar]
                              │
                              ▼
                              Admin/Finance:
                              PATCH → confirmado
                              └─ Final state
```

---

## 3. MONTHLY HOURS CALCULATION FLOW

```
User creates RAS with duracao=12 hours

┌─────────────────────────────────────────────────┐
│ POST /api/ras                                    │
│ duração: 12, competência: "2026-05"             │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Query current month hours:                      │
│                                                 │
│ existingHoursResult = await prisma.rasAgenda    │
│   .aggregate({                                  │
│     where: {                                    │
│       userId: user.id,                          │
│       competencia: "2026-05",                   │
│       status: { notIn: ['cancelado'] }          │
│     },                                          │
│     _sum: { duracao: true }                     │
│   })                                            │
│                                                 │
│ currentHours = existingHoursResult._sum.duracao│
│   = 44 hours (from 4 existing RAS)              │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ validateMonthlyHours(44, 12):                   │
│                                                 │
│ projected = 44 + 12 = 56                        │
│                                                 │
│ if (56 <= 120) → Valid ✓                        │
│ if (56 > 120) → Error                           │
│                                                 │
│ Remaining: 120 - 56 = 64 hours still available │
│                                                 │
│ Return: null (no error)                         │
└─────────────────────────────────────────────────┘
                    ▼
            ✓ Proceed with creation

─────────────────────────────────────────────────
Scenario: User tries to add 100h RAS

┌─────────────────────────────────────────────────┐
│ Current: 44 hours                               │
│ New: 100 hours                                  │
│ Projected: 44 + 100 = 144                       │
│                                                 │
│ if (144 > 120) → ERROR 422                      │
│                                                 │
│ Message:                                        │
│ "Limite mensal de 120h seria excedido.         │
│  Horas disponíveis: 76h.                        │
│  Solicitado: 100h."                             │
│                                                 │
│ Return: 422 Unprocessable Entity                │
└─────────────────────────────────────────────────┘
```

---

## 4. 8-HOUR REST REQUIREMENT VALIDATION

```
User tries to schedule RAS:
  New: Date 2026-05-05, 08:00-16:00 (8h)

Existing RAS in DB:
  RAS #1: Date 2026-05-04, 20:00-22:00 (2h)
  RAS #2: Date 2026-05-07, 18:00-02:00 (8h, crosses midnight)

┌────────────────────────────────────────────────────┐
│ Calculate time gaps                                │
│                                                    │
│ New RAS: start=08:00, end=16:00 (same day)        │
│ Convert to absolute minutes:                       │
│   newStartMin = 8*60 + 0 = 480 min               │
│   newEndMin = 16*60 + 0 = 960 min                │
│                                                    │
│ For RAS #1 (2026-05-04, 20:00-22:00):            │
│   On day -1 relative to new RAS                  │
│   vStartMin = 20*60 + 0 + (-1)*1440 = -880 min  │
│   vEndMin = 22*60 + 0 + (-1)*1440 = -760 min    │
│                                                    │
│ Gap calculation:                                   │
│   newStartMin - vEndMin = 480 - (-760) = 1240min│
│   = 20.67 hours ✓ (>= 480 min)                    │
│                                                    │
│ ─────────────────────────────────────────────────│
│                                                    │
│ For RAS #2 (2026-05-07, 18:00-02:00):            │
│   Crosses midnight: vEndMin gets +1440           │
│   On day +2 relative to new RAS                  │
│   vStartMin = 18*60 + 2*1440 = 3480 min         │
│   vEndMin = 2*60 + 24*60 + 2*1440 = 3600 min    │
│                                                    │
│ Gap calculation:                                   │
│   vStartMin - newEndMin = 3480 - 960 = 2520 min │
│   = 42 hours ✓ (>= 480 min)                       │
│                                                    │
│ Both gaps valid!                                   │
└────────────────────────────────────────────────────┘
                    ▼
            ✓ Allow scheduling

─────────────────────────────────────────────────────

Conflicting scenario:
  Existing RAS: 2026-05-05, 14:00-18:00 (4h)
  New RAS: 2026-05-05, 18:30-02:30 (8h)

Gap: 18:30 - 18:00 = 30 minutes < 8 hours

┌────────────────────────────────────────────────────┐
│ restAfterExisting = newStartMin - vEndMin        │
│ = (18*60+30) - (18*60) = 30 min < 480 min        │
│                                                    │
│ ERROR 422:                                        │
│ "Intervalo mínimo de 8h entre RAS não respeitado│
│  Existe um RAS em 14:00–18:00 que conflita       │
│  com o horário solicitado."                       │
└────────────────────────────────────────────────────┘
```

---

## 5. STATUS TRANSITION STATE MACHINE (Detailed)

```
                    ┌────────────────┐
                    │   agendado     │
                    │ (scheduled)    │
                    └────────────────┘
                     /    |    \
        realizado /  │     │     \ cancelado
               /      │     │      \
              ▼       │     │       ▼
        ┌─────────┐   │     │   ┌──────────┐
        │realizado│   │     │   │cancelado │
        │(done)   │   │     │   │(voided)  │
        └─────────┘   │     │   └──────────┘
             / \      │     │     (final)
            /   \     │     │
       pend/     \conf│     │
          /       \ │     │
         ▼         ▼ ▼     ▼
    ┌────────┐  ┌───────────┐
    │pendente│  │confirmado │
    │(pending)  │(confirmed)│
    └────────┘  └───────────┘
       / \          (final)
      /   \
     /     \
confirmado/ \ cancelado
    /       \
   ▼         ▼
(final)  (final)

Rules:
────────
1. Confirmed (confirmado) → No transitions (locked)
2. Canceled (cancelado) → No transitions (locked)
3. From agendado:
   - Can → realizado (user marks as done)
   - Can → cancelado (anytime)
   - Cannot → pendente or confirmado directly
4. From realizado:
   - Can → confirmado (immediate confirmation)
   - Can → pendente (auto-transition via cron after 72h)
   - Can → cancelado (within 72h window)
5. From pendente:
   - Can → confirmado (manual approval)
   - Can → cancelado (manual)
6. From confirmado or cancelado:
   - No transitions (immutable)
```

---

## 6. 72-HOUR CONFIRMATION WINDOW TIMELINE

```
RAS Event Date: May 5, 2026, 08:00 (São Paulo time)

┌──────────────────────────────────────────────────────────┐
│ May 5, 2026                                              │
│ ├─ 08:00: Event occurs (user marks status='realizado') │
│ ├─ Server: expiresAt = May 5, 08:00 + 72h              │
│ │           = May 8, 08:00                              │
│ ├─ Status: 'realizado'                                  │
│ ├─ Card: [⏳ Confirmar em: 72h 0min]                    │
│ └─ Buttons: [🔒 Confirmar] [💰 Pagar] [❌]             │
└──────────────────────────────────────────────────────────┘
        ▼ (time passes...)
┌──────────────────────────────────────────────────────────┐
│ May 6, 2026, 15:00                                      │
│ └─ Status: still 'realizado'                             │
│    Card: [⏳ Confirmar em: 16h 45min]                   │
│    (user can still click [🔒 Confirmar] to finalize)   │
└──────────────────────────────────────────────────────────┘
        ▼ (more time passes...)
┌──────────────────────────────────────────────────────────┐
│ May 7, 2026, 20:00                                      │
│ └─ Status: still 'realizado'                             │
│    Card: [⏳ Confirmar em: 12h 0min]                    │
│    (user can still confirm)                              │
└──────────────────────────────────────────────────────────┘
        ▼ (72 hours elapse)
┌──────────────────────────────────────────────────────────┐
│ May 8, 2026, 08:00 + ε (1 minute past threshold)        │
│                                                          │
│ Cron job runs: GET /api/cron/ras-transition            │
│ ├─ Query: WHERE status='realizado' AND                 │
│ │          expiresAt <= now()                           │
│ ├─ Found: This RAS (expiresAt=May 8 08:00)             │
│ ├─ Update: status='pendente'                            │
│ │          expiresAt cleared                            │
│ ├─ Card: [⏳ Pendente] - awaiting approval             │
│ │         [🔒 Confirmar] (only)                        │
│ └─ Cannot be marked realizado again                     │
│    Must wait for admin/finance approval                 │
└──────────────────────────────────────────────────────────┘
```

---

## 7. PAYMENT RECORD LIFECYCLE

```
RAS Event Date: May 5, 2026

┌─────────────────────────────────────────┐
│ Status: agendado                        │
│ Buttons: [✅ Realizado] [✏️ Edit]      │
│ No payment options available            │
└─────────────────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│ User clicks: [✅ Realizado]             │
│ Status changes to: realizado             │
│ expiresAt = May 8, 08:00                │
└─────────────────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│ Status: realizado                       │
│ expiresAt: May 8, 08:00                 │
│ Buttons: [🔒 Confirmar] [💰 Pagar]    │
│                                         │
│ User can start registering payment      │
│ (even before confirmation)              │
│                                         │
│ POST /api/ras/{id}/pagamentos           │
│ ├─ valorCentavos: 40015                 │
│ ├─ dataPagamento: 2026-05-10            │
│ ├─ comprovante: DOC123456 (optional)   │
│ └─ observacoes: "Paid via TED"          │
└─────────────────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│ RasPagamento created                    │
│ ├─ rasAgendaId: {id}                    │
│ ├─ userId: {user.id}                    │
│ ├─ valorCentavos: 40015                 │
│ ├─ competencia: "2026-05"               │
│ ├─ dataPagamento: 2026-05-10            │
│ ├─ comprovante: "DOC123456"             │
│ ├─ observacoes: "Paid via TED"          │
│ └─ createdAt: timestamp                 │
└─────────────────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│ User clicks: [🔒 Confirmar]             │
│ PATCH /api/ras/{id}                     │
│ { status: 'confirmado' }                │
└─────────────────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│ Status: confirmado (final)              │
│ expiresAt: cleared (no longer needed)   │
│ Buttons: None (locked state)            │
│                                         │
│ RasPagamento(s) persist in database     │
│ Can query GET /api/ras/{id}/pagamentos │
│ to view payment history                 │
└─────────────────────────────────────────┘
```

---

## 8. QUERY & FILTER LOGIC FLOW

```
User navigates: Agenda Tab
  Filters: competencia="2026-05", status="realizado", page=1

┌──────────────────────────────────────────────┐
│ Frontend builds query parameters:             │
│ GET /api/ras?competencia=2026-05&\           │
│               status=realizado&\              │
│               page=1&pageSize=20              │
└──────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│ Backend: rasAgendaFiltersSchema.safeParse()  │
│ ├─ competencia: "2026-05" ✓                  │
│ ├─ status: "realizado" ✓                     │
│ ├─ page: 1 (coerced to int) ✓                │
│ └─ pageSize: 20 ✓                            │
└──────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│ Auto-transition check:                       │
│ UPDATE rasAgenda                             │
│ SET status='pendente'                        │
│ WHERE userId={user} AND                      │
│       status='realizado' AND                 │
│       expiresAt <= now()                     │
│                                              │
│ (May have transitioned some RAS)             │
└──────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│ Build WHERE clause:                          │
│ {                                            │
│   userId: user.id,                           │
│   competencia: "2026-05",                    │
│   status: "realizado",                       │
│   // (no graduacao, local, etc.)             │
│ }                                            │
└──────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│ Query in parallel:                           │
│                                              │
│ [0] SELECT * FROM RasAgenda                  │
│     WHERE (above)                            │
│     ORDER BY data ASC                        │
│     SKIP 0                                   │
│     TAKE 20                                  │
│                                              │
│ [1] SELECT COUNT(*) FROM RasAgenda           │
│     WHERE (above)                            │
│                                              │
│ Results:                                     │
│   rasAgendas: [ {...}, {...}, ... ] (20)    │
│   total: 47                                  │
└──────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│ Response: {                                  │
│   success: true,                             │
│   data: {                                    │
│     rasAgendas: [ ... ],                     │
│     total: 47,                               │
│     page: 1,                                 │
│     pageSize: 20,                            │
│     totalPages: 3                            │
│   }                                          │
│ }                                            │
└──────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────┐
│ Frontend useQuery receives data               │
│ ├─ RAS cards rendered (first 20)             │
│ ├─ Pagination: showing 1-20 of 47            │
│ ├─ [◀ Prev] [1] [2] [3] [Next ▶]            │
│ └─ User can click pagination to fetch next   │
│    page=2 (will trigger new query)           │
└──────────────────────────────────────────────┘
```

---

## 9. RESPONSIVE DESIGN BREAKPOINTS

```
┌─────────────────────────────────────────────────────────┐
│ DESKTOP (1024px+)                                       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┬─────────────────────────────────┐  │
│ │ Left Panel      │ Main Content                    │  │
│ │ • Month Nav     │ • Stats Header (3 cols)        │  │
│ │ • Filters       │ • Tab Navigation               │  │
│ │ • Buttons       │ • Card Grid (2-3 col)          │  │
│ │                 │ • Calendar (grid)              │  │
│ │                 │ • Charts (full width)          │  │
│ └─────────────────┴─────────────────────────────────┘  │
│                                                         │
│ Modal: max-width: 600px, centered overlay              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TABLET (768px-1023px)                                   │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ Full width with smaller padding                   │ │
│ │ • Month Nav (horizontal)                         │ │
│ │ • Filters (row-based)                            │ │
│ │ • Stats (2 cols stacked)                         │ │
│ │ • Card Grid (1-2 col)                            │ │
│ │ • Calendar (scaled)                              │ │
│ │ • Charts (single bar)                            │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ Modal: max-width: 90vw, mx-4 margins                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ MOBILE (< 768px)                                        │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ ┌──────────────────────────────────────────────┐  │ │
│ │ │ Header: "RAS Dashboard"                      │  │ │
│ │ │ Quick stats (scrollable cards)               │  │ │
│ │ │ Tabs (swipeable or dropdown)                 │  │ │
│ │ └──────────────────────────────────────────────┘  │ │
│ │                                                   │ │ │
│ │ ┌──────────────────────────────────────────────┐  │ │
│ │ │ [◀ May ▶] [Filters▼]                         │  │ │
│ │ │ [+ Agendar]                                  │  │ │
│ │ └──────────────────────────────────────────────┘  │ │
│ │                                                   │ │ │
│ │ ┌──────────────────────────────────────────────┐  │ │
│ │ │ RAS Card #1 (full width, compact)            │  │ │
│ │ │ • Title + status badge                       │  │ │
│ │ │ • Details (smaller text)                     │  │ │
│ │ │ • Action buttons (row wrap)                  │  │ │
│ │ └──────────────────────────────────────────────┘  │ │
│ │ ┌──────────────────────────────────────────────┐  │ │
│ │ │ RAS Card #2                                  │  │ │
│ │ └──────────────────────────────────────────────┘  │ │
│ │                                                   │ │ │
│ │ [Load More] or infinite scroll                   │ │
│ │                                                   │ │ │
│ │ Modals: 100% width minus margins                 │ │
│ │ Forms: Stack vertically                          │ │
│ │ Buttons: Full width in group                     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ Typography:                                            │
│ • Title: 16px                                          │
│ • Subtitle: 14px                                       │
│ • Body: 12px                                           │
│ • Spacing: 12px (instead of 16px/20px)                │
└─────────────────────────────────────────────────────────┘
```

---

## 10. COLOR PALETTE & STYLING

```
Dark Theme (Primary)
──────────────────────
Background:
  Main: #1a1a2e (dark blue-black)
  Card: #12122a (darker blue-black)
  Input: #0f0f1a (almost black)

Text:
  Primary: #ffffff (white)
  Secondary: #9ca3af (gray-400)
  Tertiary: #6b7280 (gray-500)

Borders:
  Default: rgba(255,255,255,0.1)
  Hover: rgba(255,255,255,0.15)
  Focus: rgba(255,255,255,0.2)

Status Colors:
  agendado:   #60a5fa (blue)      bg: rgba(96,165,250,0.15)
  realizado:  #22c55e (green)     bg: rgba(34,197,94,0.15)
  pendente:   #f59e0b (amber)     bg: rgba(245,158,11,0.15)
  confirmado: #10b981 (emerald)   bg: rgba(16,185,129,0.15)
  cancelado:  #ef4444 (red)       bg: rgba(239,68,68,0.1)

Gradients:
  Primary CTA: linear-gradient(135deg, #2563EB, #7C3AED)
               (blue → purple)
  Success: linear-gradient(135deg, #10b981, #059669)
           (emerald)
  Warning: linear-gradient(135deg, #f59e0b, #d97706)
           (amber)

Shadows:
  Card: border 1px rgba(255,255,255,0.07)
  Hover: border 1px rgba(255,255,255,0.15)
  Modal: background: rgba(0,0,0,0.75)
```

---

**End of Technical Architecture Document**

Generated: May 1, 2026
