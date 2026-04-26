# Regras de Negócio — RAS (Regime Adicional de Serviço)

Fonte: `modules/ras/ras.routes.js`, `modules/ras/ras.config.js`

## O que é RAS

Serviço adicional de segurança pública no Estado do Rio de Janeiro. O policial pode se escalar voluntariamente ou ser escalado compulsoriamente para turnos extras fora da escala regular.

## Tabela de Preços (centavos)

| Graduação | 6h | 8h | 12h | 24h |
|-----------|-----|-----|-----|-----|
| SD/CB (Soldado/Cabo) | R$ 208,63 | R$ 272,47 | R$ 400,15 | R$ 783,21 |
| SGT/SUBTEN (Sargento/Subtenente) | R$ 243,92 | R$ 319,52 | R$ 470,74 | R$ 924,37 |

Fonte: `src/types/ras.ts → RAS_PRICE_TABLE`

O valor é fixado no momento do agendamento e nunca recalculado depois.

## Limites

| Regra | Valor |
|-------|-------|
| Máximo de horas/mês | **120h** (hard cap — não permite agendar além) |
| Alerta amarelo | 96h (80% do limite) |
| Descanso mínimo entre eventos | **8h** |
| Janela para marcar como "realizado" | **72h** após a data do evento |

## Máquina de Estados

```
agendado ──────┐
     │         │
     ▼         │
  realizado    │ (qualquer estado)
     │         ▼
     ▼       cancelado
  pendente
     │
     ▼
  confirmado  (estado final — imutável)
```

### Transições Permitidas

| De | Para | Condição |
|----|------|----------|
| `agendado` | `realizado` | Data passada + dentro de 72h |
| `agendado` | `cancelado` | Qualquer momento |
| `realizado` | `pendente` | Automático via cron — 72h expirado |
| `realizado` | `confirmado` | Manual (admin/financeiro) |
| `realizado` | `cancelado` | Dentro da janela de 72h |
| `pendente` | `confirmado` | Manual |
| `pendente` | `cancelado` | Manual |
| `confirmado` | *(nenhuma)* | Estado final — bloqueado |
| `cancelado` | *(nenhuma)* | Estado final — bloqueado |

## Janela de Realização (72h)

Quando o status é atualizado para `realizado`:
- `expiresAt = data_do_evento + 72 horas` (America/Sao_Paulo)
- Cron job (`/api/cron/ras-transition`) verifica eventos com `status = 'realizado' AND expiresAt < now()`
- Esses eventos são automaticamente transitados para `pendente`

## Prevenção de Conflitos

### Limite Mensal de Horas
```
HorasDoMes = SUM(duracao WHERE competencia = mes AND status != 'cancelado')
Se HorasDoMes + novaDuracao > 120 → rejeitar com 400
```

### Descanso Mínimo (8h)
Antes de agendar um novo RAS, verificar todos os RAS não-cancelados do usuário:
```
Para cada RAS existente R:
  gap_inicio = |novo.horaInicio - R.horaFim|  (em horas, mesmo dia ou dias adjacentes)
  gap_fim    = |R.horaInicio - novo.horaFim|
  Se gap_inicio < 8h OU gap_fim < 8h → rejeitar
```
Implementação: `src/lib/ras-calculations.ts → calculateRestRequirementsBetween()`

### Sem Duplicata no Mesmo Dia+Hora
Constraint de banco: `UNIQUE(userId, data, horaInicio)`

### Conflito com Escala Regular
Antes de agendar, verificar se existe `Escala` na mesma data com horário sobreposto.

## Competência (Mês de Referência)

- Campo: `RasAgenda.competencia` (formato `yyyy-MM`)
- Representa o mês ao qual o RAS pertence para fins de pagamento
- Pode diferir do mês real da data (ex.: RAS realizado em 31/jan conta para fev)
- Validação: formato `^\d{4}-\d{2}$`

## Pagamento

- RAS `confirmado` do mês M → pagamento esperado **até dia 15 do mês M+1**
- Registrado em `RasPagamento` com `valorCentavos` e `dataPagamento`
- Status do pagamento: `pendente` → `pago`

## Locais Válidos

Definidos em `src/types/ras.ts`:
- **BPM**: 47 batalhões (1º ao 47º BPM)
- **Especiais**: BOPE, BPChq, RECOM, BPVE, BAC, GAM, BPRv, GPFer, CPAM, BPtur, BEPE
- **UPP**: 17 unidades de polícia pacificadora

Total: 75 locais válidos em `RAS_ALL_LOCALS`

## Cron Jobs Necessários

| Job | Frequência | Ação |
|-----|-----------|------|
| `ras-transition` | A cada 30 min | `realizado → pendente` quando `expiresAt < now()` |
| `ras-expire` | A cada hora | Marca como expirado RAS `pendente` há > 30 dias |
| Notificação RAS | A cada 30 min | Push 12h antes de RAS agendado |

Implementados: `/api/cron/ras-transition` (já existe)

## Cenários Salvos

- Usuário pode simular combinações de RAS (`RasCenarioSalvo`)
- Armazena: `graduacao`, lista de `eventos: { data, local, duracao }[]`, totais
- Não afeta o saldo nem a escala real — é apenas projeção
