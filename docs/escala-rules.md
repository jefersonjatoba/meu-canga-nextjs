# Regras de Negócio — Escala de Plantões

Fonte: `modules/escala/escala.routes.js`, implementação em `app/api/escala/`

## O que é Escala

Sistema de gerenciamento de turnos de trabalho para policiais militares do RJ. Registra e projeta os plantões baseado no ciclo de trabalho configurado pelo usuário.

## Tipos de Turno (`tipoTurno`)

| Tipo | Descrição |
|------|-----------|
| `plantao` | Turno regular de trabalho |
| `sobreaviso` | De plantão mas não no quartel (em casa / disponível) |
| `extra` | Serviço extra além da escala regular |
| `folga` | Dia de folga |
| `ferias` | Período de férias |

## Ciclos de Trabalho (`tipoCiclo`)

| Código | Descrição | Horas trabalhadas | Horas de folga |
|--------|-----------|------------------|----------------|
| `12x24-12x72` | 12h trabalho, 24h folga, 12h trabalho, 72h folga | 12h / turno | Ciclo ~5 dias |
| `12x24-12x48` | 12h trabalho, 24h folga, 12h trabalho, 48h folga | 12h / turno | Ciclo ~4 dias |
| `24x48` | 24h trabalho, 48h folga | 24h / turno | Ciclo 3 dias |
| `24x72` | 24h trabalho, 72h folga | 24h / turno | Ciclo 4 dias |
| `12x36-folgao` | 12h trabalho, 36h folga com "folgão" semanal | 12h / turno | — |

Definido em `src/types/escala.ts → CYCLE_CONFIG`

## Status (`status`)

| Status | Descrição |
|--------|-----------|
| `agendada` | Plantão agendado para data futura |
| `realizada` | Plantão já ocorreu |
| `cancelada` | Plantão cancelado |

## Configuração do Usuário (`EscalaConfig`)

Cada usuário configura:
- `tipo`: ciclo de trabalho (ver tabela acima)
- `horaInicio` / `horaFim`: horário padrão (ex.: 07:00 / 19:00)
- `inicioCiclo`: data de início do ciclo (`YYYY-MM-DD`) — âncora para calcular próximos plantões
- `localServico`: local padrão de trabalho
- `alarmeAtivo`: gerar lembretes automaticamente

## Cálculo de Dias de Plantão

A partir da `EscalaConfig.inicioCiclo` e do `tipo` de ciclo, o sistema calcula automaticamente quais dias do mês são dias de trabalho.

Implementado em: `src/lib/escala-calculations.ts`

```typescript
// Verificar se uma data é dia de trabalho no ciclo configurado
isWorkDay(ciclo: TipoCiclo, dataInicio: string, dataVerificada: string): boolean
```

## Prevenção de Conflitos com RAS

Antes de agendar um novo RAS, o sistema verifica se existe `Escala` (tipo `plantao` ou `sobreaviso`) na mesma data com horários sobrepostos.

Verificação implementada em: `app/api/ras/route.ts`

## Constraint de Banco

```sql
UNIQUE(userId, dataEscala, horaInicio)  -- sem duplicata no mesmo dia+hora
```

## Alarmes / Notificações

- `alarmeAtivo = true` → push notification 12h antes do turno
- Cron job verifica escalas nas próximas 12h a cada 30 min
- Implementação pendente: Fase 7

## Stats Mensais

A rota `GET /api/escala/stats` retorna:
- Total de plantões no mês
- Total de horas trabalhadas
- Contagem por status
- Contagem por tipo de turno

## Integração com RAS

- RAS tem campo `tipo: 'voluntario' | 'compulsorio'`
- Compulsório = o policial foi obrigado a fazer RAS sem agendamento prévio
- Voluntário = o policial se inscreveu para o RAS
- A escala regular e o RAS são módulos independentes mas com verificação de conflito
