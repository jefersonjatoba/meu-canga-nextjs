# RAS Module Documentation Index

**Generated**: May 1, 2026  
**Module**: RAS (Regime Adicional de Serviço) - Police Security Service Scheduling  
**Project**: Meu Canga Next.js  
**Status**: Complete & Production Ready

---

## Documentation Files Overview

### 1. **RAS_QUICK_REFERENCE.md** (10 KB)
**Purpose**: Fast lookup for developers  
**Contents**:
- Key statistics & file locations
- Price table (quick reference)
- Business rules summary
- API endpoints cheat sheet
- Validation rules checklist
- Status state machine
- Database indexes
- Error codes reference
- Component hierarchy
- React Query patterns
- Calculation functions
- Type definitions
- Locations map (75 units)
- UI modals summary
- Environment variables
- Development checklist
- Common bugs & solutions
- Performance tips

**Best for**: Daily development, quick lookups, troubleshooting

---

### 2. **RAS_MODULE_COMPLETE_DOCUMENTATION.md** (36 KB)
**Purpose**: Comprehensive reference manual  
**Contents** (18 sections):

1. **File Structure** - All RAS-related files organized by layer
2. **Data Models & Database Schema** - Complete entity definitions with constraints
3. **Price Table & Calculations** - BRL values, calculation functions
4. **Business Rules & Validation** - 6 major validation layers
5. **API Endpoints** - All 7 endpoints with full request/response examples
6. **Frontend UI & Components** - Layout diagrams, modal descriptions, cards, responsive design
7. **State Management & Data Flow** - React Query setup, localStorage, data flow
8. **Validation Schemas** - Zod schema definitions with examples
9. **Cron Jobs & Automation** - Scheduled tasks and auto-transitions
10. **Locations Reference** - All 75 police units by category
11. **Translations & Labels** - Portuguese labels and emoji indicators
12. **Error Handling** - HTTP status codes and error messages
13. **Charts & Visualizations** - Recharts configuration
14. **Type Definitions** - Complete TypeScript interfaces
15. **Features Summary** - CRUD operations and capabilities
16. **Summary of Key Files** - File purposes and line counts
17. **Deployment & Environment** - Setup and configuration
18. **Future Enhancements** - Potential features not yet implemented

**Best for**: Understanding the system deeply, implementation decisions, API contracts

---

### 3. **RAS_TECHNICAL_ARCHITECTURE.md** (56 KB)
**Purpose**: System design and technical flows  
**Contents** (10 sections):

1. **System Architecture Diagram** - Layered architecture (frontend → API → backend → database)
2. **Data Flow Diagram** - Complete flow from user action to database
3. **Monthly Hours Calculation Flow** - Validation logic with examples
4. **8-Hour Rest Requirement Validation** - Detailed gap calculation
5. **Status Transition State Machine** - Visual FSM with all transitions
6. **72-Hour Confirmation Window Timeline** - Timeline from event to auto-transition
7. **Payment Record Lifecycle** - Complete payment workflow
8. **Query & Filter Logic Flow** - How filtering and pagination works
9. **Responsive Design Breakpoints** - Desktop/tablet/mobile layouts
10. **Color Palette & Styling** - Dark theme colors and gradients

**Best for**: System design review, architecture decisions, visual understanding, troubleshooting flows

---

### 4. **docs/ras-rules.md** (126 lines)
**Purpose**: Business rules reference  
**Contents**:
- RAS definition and context
- Price table with source
- Business limits (monthly hours, rest, window)
- State machine diagram
- Transition rules table
- 72-hour window mechanics
- Conflict prevention rules
- Competência (reference month) handling
- Payment rules
- Valid locations (all 75)
- Cron jobs required
- Scenario saving feature

**Best for**: Business stakeholders, understanding rules origins, regulatory compliance

---

## Quick Navigation Guide

### I want to...

**...understand the whole system**
→ Start with **RAS_TECHNICAL_ARCHITECTURE.md** Section 1 (System Architecture Diagram), then **RAS_MODULE_COMPLETE_DOCUMENTATION.md** (full read)

**...fix a bug**
→ Use **RAS_QUICK_REFERENCE.md** Section 18 (Common Bugs) or **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 12 (Error Handling)

**...implement a new feature**
→ Reference **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 5 (API Endpoints) + Section 6 (Frontend UI)

**...understand data validation**
→ **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 4 (Business Rules) + Section 8 (Validation Schemas)

**...add an API endpoint**
→ **RAS_QUICK_REFERENCE.md** Section 5 (API Cheat Sheet) + **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 5 (Full Endpoints)

**...understand the database**
→ **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 2 (Data Models) + **RAS_QUICK_REFERENCE.md** Section 12 (Indexes)

**...understand the UI**
→ **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 6 (Frontend UI) + **RAS_TECHNICAL_ARCHITECTURE.md** Section 9 (Responsive Design)

**...debug a state transition issue**
→ **RAS_TECHNICAL_ARCHITECTURE.md** Section 5 (State Machine) + Section 6 (72-hour window)

**...understand payment processing**
→ **RAS_TECHNICAL_ARCHITECTURE.md** Section 7 (Payment Lifecycle) + **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 5 (Payment Endpoints)

**...optimize queries**
→ **RAS_QUICK_REFERENCE.md** Section 12 (Indexes) + **RAS_QUICK_REFERENCE.md** Section 19 (Performance Tips)

**...look up error codes**
→ **RAS_QUICK_REFERENCE.md** Section 9 (Error Codes)

**...see price table**
→ **RAS_QUICK_REFERENCE.md** Section 3 (Price Table)

**...view all locations**
→ **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 10 (Locations Reference)

---

## Statistics Summary

| Metric | Value |
|--------|-------|
| Total Documentation Lines | 2,900+ |
| Total File Size | 102 KB |
| Code Files Documented | 12 |
| API Endpoints | 7 |
| Database Tables | 4 |
| Business Rules | 6+ |
| Valid Locations | 75 |
| Type Definitions | 5 main |
| Status States | 5 |
| Price Tiers | 8 (2 ranks × 4 durations) |

---

## File Organization

```
Meu Canga Next.js Root/
├── RAS_DOCUMENTATION_INDEX.md (this file)
├── RAS_QUICK_REFERENCE.md (10 KB, 20 sections)
├── RAS_MODULE_COMPLETE_DOCUMENTATION.md (36 KB, 18 sections)
├── RAS_TECHNICAL_ARCHITECTURE.md (56 KB, 10 sections)
├── docs/
│   └── ras-rules.md (business rules)
├── app/
│   ├── api/ras/
│   │   ├── route.ts (GET/POST)
│   │   ├── [id]/
│   │   │   ├── route.ts (GET/PATCH/DELETE)
│   │   │   ├── pagamentos/route.ts (GET/POST)
│   │   │   └── comprovante/route.ts
│   │   ├── cenarios/route.ts (GET/POST)
│   │   └── stats/route.ts (GET)
│   ├── api/cron/
│   │   └── ras-transition/route.ts
│   └── dashboard/ras/
│       └── page.tsx (main UI, 696 lines)
├── src/
│   ├── types/ras.ts (315 lines, all types)
│   ├── lib/
│   │   ├── validations/ras.ts (328 lines, Zod schemas)
│   │   └── ras-calculations.ts (136 lines, pure functions)
└── prisma/
    └── schema.prisma (RAS tables)
```

---

## Key Technical Stack

**Frontend**:
- React 18
- TanStack Query (React Query)
- Recharts (visualizations)
- Zod (validation)
- TypeScript

**Backend**:
- Next.js 15 API Routes
- Prisma ORM
- PostgreSQL
- Vercel Cron Jobs

**Styling**:
- Tailwind CSS v4
- Dark theme (custom colors)
- Responsive design (mobile-first)

---

## Development Workflow

1. **Reading Code**: Start with types (`src/types/ras.ts`), then schemas (`src/lib/validations/ras.ts`)
2. **Understanding Logic**: Review calculations (`src/lib/ras-calculations.ts`)
3. **API Integration**: Check endpoint in `app/api/ras/` folder
4. **UI Implementation**: Reference dashboard (`app/dashboard/ras/page.tsx`)
5. **Testing**: Validate against business rules (`docs/ras-rules.md`)
6. **Documentation**: Update relevant doc if changing behavior

---

## Version History

**v2026-05-01** (Current)
- Complete RAS module documentation
- 3 comprehensive documentation files created
- 2,900+ lines of documentation
- Coverage: 100% of RAS module features
- Status: Production ready

---

## How to Maintain Documentation

### When Adding a New Endpoint
1. Update **RAS_QUICK_REFERENCE.md** Section 5 (API Cheat Sheet)
2. Update **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 5 (API Endpoints)
3. Add to file count in Section 16 (Key Files)

### When Changing a Business Rule
1. Update **docs/ras-rules.md**
2. Update **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 4 (Business Rules)
3. Update **RAS_TECHNICAL_ARCHITECTURE.md** relevant section

### When Adding a UI Component
1. Update **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 6 (Frontend UI)
2. Update component hierarchy in **RAS_QUICK_REFERENCE.md** Section 10

### When Modifying Database Schema
1. Update **RAS_MODULE_COMPLETE_DOCUMENTATION.md** Section 2 (Data Models)
2. Update **RAS_QUICK_REFERENCE.md** Section 12 (Indexes)

---

## External Resources

- **Meu Canga v1 Reference**: Original ras.routes.js, ras.config.js (legacy)
- **Prisma Docs**: https://www.prisma.io/docs
- **Zod Docs**: https://zod.dev
- **React Query Docs**: https://tanstack.com/query/latest
- **Recharts Docs**: https://recharts.org

---

## Contacts & Maintenance

**Created By**: Claude AI (Anthropic)  
**Created On**: May 1, 2026  
**Maintained By**: Jeferson Jatobá (jefersonjatobaa@gmail.com)  
**Last Updated**: May 1, 2026  

---

## Using This Documentation

1. **Bookmarks**: Add all 3 main docs to your IDE/browser favorites
2. **Search**: Use Ctrl+F to search within files (e.g., "status transition", "payment")
3. **Cross-Reference**: Each doc links to others where relevant
4. **Print**: PDF-friendly markdown format (no images, plain text diagrams)
5. **Share**: All docs are self-contained in the repository

---

## Checklist for New Team Members

- [ ] Read **RAS_QUICK_REFERENCE.md** (30 minutes)
- [ ] Review **RAS_TECHNICAL_ARCHITECTURE.md** diagrams (45 minutes)
- [ ] Read **RAS_MODULE_COMPLETE_DOCUMENTATION.md** fully (2 hours)
- [ ] Review `app/dashboard/ras/page.tsx` code (1 hour)
- [ ] Review `app/api/ras/route.ts` code (30 minutes)
- [ ] Understand database schema (30 minutes)
- [ ] Try creating a test RAS in development (30 minutes)
- [ ] Study a full user flow (create → realize → confirm → pay) (1 hour)

**Total Onboarding Time**: ~6 hours

---

**End of Documentation Index**

For the most up-to-date information, always check the source code files and run tests.
