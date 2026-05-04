# 🎨 AUDIT UI/UX — PÁGINA RAS

## Resumo Executivo

A página de RAS **VIOLA PADRÕES DO SISTEMA** em 4 dimensões:

1. ❌ **Styling**: Cores hardcoded + inline styles (não usa componentes UI)
2. ❌ **Estrutura**: Monolítica (tudo em page.tsx) vs modular (padrão do projeto)
3. ❌ **Componentes**: Cria `<input>`, `<select>`, `<button>` manualmente vs reutiliza de `src/components/ui/`
4. ❌ **Layout**: Modal customizado vs `Dialog` do Shadcn (usado em Escala/Cartão/Lançamentos)

---

## 📊 Comparação com Padrões do Projeto

### **Padrão Esperado** (usado em Escala, Lançamentos, Cartão)

```
app/dashboard/FEATURE/page.tsx
  ├─ Imports: componentes do ui/ + features/FEATURE/components/
  ├─ Estado: useState, useQuery, useMutation
  ├─ Render:
  │   ├─ <DashboardLayout>
  │   ├─ <FeatureHeader /> (componente)
  │   ├─ <FeatureFilters /> (componente)
  │   ├─ <FeatureList /> (componente)
  │   └─ <FeatureModal /> (componente para criar/editar)
  │
src/features/FEATURE/components/
  ├─ FeatureHeader.tsx (título + botão criar)
  ├─ FeatureFilters.tsx (dropdowns + busca)
  ├─ FeatureList.tsx (tabela/grid com items)
  ├─ FeatureModal.tsx (Dialog + FeatureForm)
  ├─ FeatureForm.tsx (form fields)
  └─ index.ts (exports)

src/components/ui/
  ├─ Button.tsx (padrão do projeto)
  ├─ Card.tsx (containers)
  ├─ Input.tsx (text inputs)
  ├─ Select.tsx (dropdowns)
  ├─ Dialog.tsx (modais)
  ├─ Badge.tsx (status badges)
  ├─ Table.tsx (tabelas)
  └─ ... mais
```

### **O Que RAS Faz Hoje** ❌

```
app/dashboard/ras/page.tsx
  ├─ Tudo inline:
  │   ├─ ModalForm() com 300+ linhas
  │   ├─ Calendário manual (div + grid)
  │   ├─ Tabela manual (div + map)
  │   ├─ Charts (recharts, OK)
  │   └─ Lógica de estado espalhada
  │
src/components/ras/
  ├─ RasForm.tsx ✓ (existe mas não é usado!)
  ├─ RasModal.tsx ✓ (existe mas não é usado!)
  ├─ RasTable.tsx ✓ (existe mas não é usado!)
  ├─ RasCalendar.tsx ✓ (existe mas não é usado!)
  └─ ... mais

❌ Problema: componentes existem mas page.tsx reimplementa tudo manualmente
```

---

## 🚨 Problemas Específicos

### 1. **Styling Inline vs Componentes UI**

**Hoje** (RAS modal):
```tsx
<div
  style={{ 
    background: '#1a1a2e',  // ❌ hardcoded
    border: '1px solid rgba(255,255,255,0.1)',
  }}
>
```

**Padrão do Projeto** (Escala, Cartão):
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

<Card>
  <CardHeader>
    <CardTitle>Agendar RAS</CardTitle>
  </CardHeader>
  <CardContent>
    ...
  </CardContent>
</Card>
```

**Consequências**:
- Tema claro/escuro não funciona em RAS (hardcoded para dark)
- Mudanças de branding afetam RAS diferente de resto do app
- Acessibilidade (contrast, focus states) não garantida
- Maior peso de JS (estilos inline vs CSS)

---

### 2. **Modal Customizado vs Dialog Padrão**

**Hoje** (RAS):
```tsx
<div className="fixed inset-0 z-50..." style={{ background: 'rgba(0,0,0,0.75)' }}>
  <div className="relative w-full max-w-lg mx-4 rounded-2xl p-6..." onClick={onClose}>
    // Modal content
  </div>
</div>
```

**Padrão** (Escala, Lançamentos, Cartão):
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Agendar RAS</DialogTitle>
    </DialogHeader>
    // Form content
  </DialogContent>
</Dialog>
```

**Consequências**:
- Keyboard trap não implementado em RAS (Dialog faz isso)
- Backdrop scroll não prevenido em mobile
- Acessibilidade ruim (sem ARIA roles)
- Looks diferente de outros modais do app

---

### 3. **Componentes Descartados**

**Existem** em `src/components/ras/` mas **NÃO SÃO USADOS**:

- ✗ `RasForm.tsx` — formulário bem implementado, tipo-seguro
- ✗ `RasModal.tsx` — wrapper Dialog + form
- ✗ `RasTable.tsx` — tabela de RAS com coluna de ações
- ✗ `RasCalendar.tsx` — calendário customizado para RAS
- ✗ `RasStatusBadge.tsx` — status com cores corretas
- ✗ `RasPriceDisplay.tsx` — exibição de preços
- ✗ `RasLocationPicker.tsx` — seletor de locais

**Problema**: Duplicação de esforço + maintenance nightmare se mudar design depois

---

### 4. **Page.tsx Monolítica**

**Tamanho**: ~1000+ linhas em um arquivo

**Contém**:
- ✗ 8 funções helper
- ✗ ModalForm() component (300+ linhas)
- ✗ Tabs (agenda/histórico/gráficos)
- ✗ Calendário inline
- ✗ Tabela inline
- ✗ Charts
- ✗ Estado de 20+ variáveis

**Comparar com Lançamentos**:
- `page.tsx` ≈ 150 linhas (delegação limpa)
- `LancamentosHeader.tsx` (título + botões)
- `LancamentosFilters.tsx` (filtros)
- `LancamentosList.tsx` (lista)
- `LancamentoModal.tsx` (modal)
- `LancamentoForm.tsx` (form)

**Consequências**:
- Difícil testar lógica (tudo acoplado)
- Difícil reutilizar componentes
- Readability baixa
- Refatorações arriscadas

---

### 5. **Inputs/Selects Customizados**

**Hoje** (RAS inputs):
```tsx
<input
  type="date"
  className="w-full rounded-lg px-3 py-2 text-white"
  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
/>

<select
  className="w-full rounded-lg px-3 py-2 text-white"
  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
>
```

**Padrão** (projeto):
```tsx
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

<Input type="date" placeholder="Data" />

<Select
  options={localOptions}
  value={local}
  onChange={setLocal}
  placeholder="Selecione o local"
/>
```

**Benefícios de usar componentes**:
- ✓ Tema automático (light/dark)
- ✓ Validação integrada
- ✓ Estados consistentes (focus, error, disabled)
- ✓ Acessibilidade (labels, ARIA)
- ✓ Responsivo (sm:/md:/lg: breakpoints)

---

### 6. **Responsividade**

**Problema em RAS**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="relative w-full max-w-lg mx-4 ...">
    // Modal com max-w-lg fixo
  </div>
</div>
```

**Em mobile** (viewport 375px):
- max-w-lg ≈ 512px > 375px → overflow
- mx-4 (16px) em cada lado deixa pouco espaço

**Padrão** (Dialog do Shadcn):
```tsx
// Automático responsive:
// - Desktop: max-w-lg
// - Tablet: max-w-md
// - Mobile: w-[90%]
```

---

## ✅ O Que Está Bom

1. ✓ **Charts** — Recharts é padrão do projeto (Escala usa também)
2. ✓ **Validações** — Zod schemas em `src/lib/validations/ras.ts` estão ótimas
3. ✓ **Tipos** — RasAgenda, RasForm tipos bem estruturados
4. ✓ **API calls** — Funções assíncronas bem separadas
5. ✓ **Componentes RAS** — Existem e estão bem feitos, só faltam ser usados

---

## 🎯 Recomendações

### **Opção A: Refatoração Completa** (Recomendado para banco profissional)

Restructure para seguir padrão de Lançamentos:

```
1. Decompose page.tsx em:
   - page.tsx (layout + orquestração)
   - components/RasHeader.tsx (título + botão criar)
   - components/RasFilters.tsx (competência, status, graduação, local)
   - components/RasList.tsx (tabela/grid de RAS)
   - components/RasModal.tsx (modal para criar/editar)
   - components/RasCharts.tsx (gráficos por mês)

2. Usar componentes UI padrão:
   - Card, Button, Input, Select, Dialog, Badge, Table

3. Reutilizar componentes existentes:
   - RasForm (já existe!)
   - RasStatusBadge (já existe!)
   - RasPriceDisplay (já existe!)

4. Adicionar responsividade:
   - sm:/md:/lg: breakpoints em todos os componentes
   - Mobile-first design

5. Tema light/dark:
   - Remover hardcoded colors
   - Usar CSS vars do projeto
   - Teste em light mode + dark mode
```

**Tempo estimado**: 3-4 horas  
**Resultado**: Página pronta para produção, mantível, acessível

---

### **Opção B: Melhoria Incremental**

1. ✓ Refactor modal para usar `Dialog` do Shadcn
2. ✓ Refactor inputs/selects para usar componentes UI
3. ✓ Extrair ModalForm para component separado
4. ✓ Depois: decompose em header/filters/list/modal

**Tempo**: 2-3 horas  
**Resultado**: Melhorado mas ainda não 100% padrão

---

### **Opção C: Manter Como Está**

**❌ NÃO RECOMENDADO** para sistema de banco

- Inconsistente com resto do app
- Tema não funciona correto
- Acessibilidade ruim
- Difícil manter

---

## 📋 Checklist de Conformidade

Para RAS passar em audit profissional de banco:

- [ ] Usa componentes UI do projeto (Button, Input, Select, Card, Dialog)
- [ ] Tema light/dark funciona
- [ ] Responsivo (sm:/md:/lg: breakpoints)
- [ ] Acessibilidade WCAG AA (keyboard, ARIA, contrast)
- [ ] Componentes reutilizáveis (não inline)
- [ ] Modular (page.tsx < 200 linhas)
- [ ] Consistente com Escala/Lançamentos/Cartão
- [ ] Testes de UI (ao menos smoke tests)

**RAS Hoje**: 2/8 ✗  
**RAS Após Opção A**: 8/8 ✓

---

## 🚀 Próximas Etapas

**Você quer que eu**:

1. **Faça refatoração completa** (Opção A) → Deixa UI 100% profissional
2. **Faça melhoria incremental** (Opção B) → Rápido, parcial
3. **Mantenha como está** (Opção C) → Avança para Sprint 1 (não recomendado)
4. **Apenas documente as mudanças necessárias** → Você decide depois

---

## 📎 Referências

**Padrão do projeto** (use como template):
- `app/dashboard/lancamentos/page.tsx` (150 linhas, modular)
- `src/features/lancamentos/components/` (bem separado)

**UI Components** (reutilize):
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Dialog.tsx`

**RAS Components** (já existem, use):
- `src/components/ras/RasForm.tsx`
- `src/components/ras/RasModal.tsx`
- `src/components/ras/RasTable.tsx`
- `src/components/ras/RasCalendar.tsx`
