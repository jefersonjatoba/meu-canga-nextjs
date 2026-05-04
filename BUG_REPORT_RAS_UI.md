# 🐛 BUG REPORT — RAS UI/UX

## Problemas Encontrados

### 1. ❌ Erro "Number must be less than or equal to 100"
**Causa**: `pageSize: 200` em page.tsx linha 60 ultrapassa limite de validação  
**Solução**: Trocar para `pageSize: 100`

### 2. ❌ Modal muito grande, requer scroll
**Causa**: Modal sem height constraint, formulário ocupa espaço indefinido  
**Solução**: 
- Limitar modal a `max-h-[80vh]`
- Fazer form scrollable com `overflow-y-auto`
- Buttons ficam sticky no final

### 3. ❌ Label LOCAL com fundo escuro fora do modal
**Causa**: RasLocationPicker usa select nativo que ignora dark: context  
**Solução**: Verificar RasLocationPicker e fazer funcionar com dark mode

### 4. ❌ Tema light/dark não funciona
**Causa**: Botão no header pode ter bug, ou tema não está sendo aplicado  
**Solução**: Verificar ThemeToggle e garantir que está funcionando

### 5. ❌ Data e Hora lado a lado (50% cada)
**Causa**: Estão em divs separadas (não em grid)  
**Solução**: Envolvê-los em `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">`

### 6. ❌ TIPO "Compulsório" deveria ocultar "Reserva" em Vaga
**Causa**: Não há lógica condicional em tipoVaga  
**Solução**: 
- Se tipo === 'compulsorio', mostrar apenas 'titular'
- Se tipo === 'voluntario', mostrar 'titular' + 'reserva'
- Auto-mudar tipoVaga para 'titular' se tipo mudar para 'compulsorio'

---

## Arquivos a Corrigir

1. `app/dashboard/ras/page.tsx` — pageSize: 200 → 100
2. `src/features/ras/components/RasModal.tsx` — max-h-[80vh] + overflow-y-auto
3. `src/features/ras/components/RasForm.tsx` — 
   - Data + Hora em grid lado a lado
   - Lógica condicional de tipoVaga baseado em tipo
4. `src/components/ras/RasLocationPicker.tsx` — verificar dark mode

---

## Prioridade

Todas críticas para usar em produção.
