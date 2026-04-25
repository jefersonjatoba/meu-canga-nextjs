# Meu Canga — Arquitetura de Referência para Reimplementação Next.js 14

> **Fonte:** Análise do repositório original Node/Express `jefersonjatoba/meu-canga`
> **Data da análise:** 2026-04-24
> **Destino:** Next.js 14 + Supabase + TypeScript (qualidade fintech sênior)

---

## 1. Visão Geral do Produto

**Meu Canga** é um SaaS de finanças pessoais especializado para profissionais de saúde que trabalham em regime de plantão. Seu diferencial são os módulos RAS (Regime de Atividade Suplementar) e Escala, que integram gestão de turnos com lançamentos financeiros automáticos.

### Usuário-alvo
- Técnicos de enfermagem, enfermeiros, médicos, farmacêuticos
- Trabalham em escalas 12x36, 24x72, 24x48 no setor público
- Realizam plantões extras (RAS) remunerados por tabela governamental
- Precisam controlar patrimônio, metas, e declaração de IR

### Planos
| Feature | Free | Pro (R$ 19,90/mês) |
|---------|------|---------------------|
| Lançamentos/mês | 10 | Ilimitado |
| Contas | 3 | Ilimitado |
| Metas ativas | 2 | Ilimitado |
| Recorrências | 3 | Ilimitado |
| RAS/mês | 5 | Ilimitado |
| Investimentos | Bloqueado | Habilitado |
| Assistente IA | Bloqueado | Habilitado |
| Relatórios PDF | Bloqueado | Habilitado |
| Relatório IR | Bloqueado | Habilitado |

---

## 2. Diagrama de Modelos de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                           users                                  │
│  id · email · cpf · nome_completo · profissao · unidade          │
│  plan (free/pro/trial) · plan_expires_at                         │
│  totp_enabled · lgpd_consent · is_admin · is_blocked             │
└────────────────────────────┬────────────────────────────────────┘
                             │ 1:N para todas as entidades abaixo
         ┌───────────────────┼──────────────────────┐
         │                   │                      │
         ▼                   ▼                      ▼
┌─────────────────┐  ┌───────────────┐  ┌─────────────────────┐
│    accounts     │  │  categories   │  │      metas          │
│  type: banco/   │  │  tipo: income │  │  valor_alvo_cents   │
│  credito/invest │  │  expense/ambos│  │  valor_atual_cents  │
│  dia_fechamento │  │  icone · cor  │  │  prazo_mes/ano      │
│  credit_limit   │  └───────┬───────┘  │  ativo              │
└────────┬────────┘          │          └─────────────────────┘
         │                   │
         └──────┬────────────┘
                ▼
┌───────────────────────────────────────────────────────────────┐
│                       transactions                             │
│  type: income/expense/ras/aporte/resgate                       │
│  amount_cents · date · competencia_at                          │
│  source: manual/parcelado/recorrente/ras                       │
│  parcelas · parcela_atual · parent_id (self-ref)               │
│  meta_json (graduacao, horas, local — para RAS)                │
│  recorrencia_id → recorrencias                                 │
└───────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│   recorrencias   │     │     budgets       │
│  frequency enum  │     │  mes · ano        │
│  dia_do_mes      │     │  amount_cents     │
│  ativo           │     │  UNIQUE(user,cat  │
└──────────────────┘     │  ,mes,ano)        │
                         └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO ESCALA                                  │
├─────────────────────────────┬───────────────────────────────────┤
│         escala              │        escala_config               │
│  data · hora_inicio/fim     │  user_id (PK)                      │
│  tipo: plantao/sobr/extra   │  tipo: 24x72/12x36/etc            │
│  alarme_ativo               │  inicio_ciclo                      │
│  alarme_enviado             │  hora_inicio/fim                   │
│  UNIQUE(user,data,h_inicio) │  local                             │
└─────────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO RAS                                     │
├─────────────────┬──────────────────┬───────────────────────────┤
│   ras_agenda    │  ras_pagamentos   │  ras_cenarios_salvos      │
│  data_ras       │  mes_ref YYYY-MM  │  nome · items (JSON)      │
│  hora_inicio    │  valor_cents      │  total_horas              │
│  duracao (6/12h)│  status: pend/pago│  total_valor_cents        │
│  graduacao      │  UNIQUE(user,mes) │                           │
│  tipo_vaga      └──────────────────┘                           │
│  status (state machine)                                         │
│  valor_cents (tabela)                                           │
│  expires_at (72h window)                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 INFRAESTRUTURA / SUPORTE                         │
├──────────────┬──────────────────┬─────────────────────────────┤
│ subscriptions│  push_subscript  │  audit_logs / login_logs    │
│ plan history │  VAPID endpoint  │  ações · ip · user_agent    │
│ mp webhook   │  subscription_   │                             │
│ grantPro()   │  json            │                             │
└──────────────┴──────────────────┴─────────────────────────────┘
```

---

## 3. Fluxos Principais por Módulo

### 3.1 Módulo ESCALA

**Objetivo:** Gestão do calendário de plantões ordinários com alarmes.

```
CONFIGURAR ESCALA
  └─ Usuário define: tipo_ciclo (24x72, 12x36...), hora_inicio, hora_fim,
     local, data_inicio_ciclo
  └─ Sistema gera automaticamente os plantões futuros com base no padrão

MARCAR PLANTÃO (manual)
  └─ POST /app/escala/marcar
  └─ Validações:
     ├─ data formato YYYY-MM-DD ✓
     ├─ hora_inicio formato HH:MM ✓
     └─ UNIQUE(user_id, data, hora_inicio) — sem duplicatas

PROGRESSO DO PLANTÃO
  └─ calcularProgressoEscala(plantao, agora_SP)
  └─ Status: futuro (0%) → em_progresso (1-99%) → concluido (100%)
  └─ Fórmula: pct = elapsed_ms / total_duration_ms * 100

ALARME 12H ANTES
  └─ Worker (cron) verifica:
     WHERE (data + hora_inicio) BETWEEN [now+11.5h] AND [now+12.5h]
     AND alarme_ativo = 1
     AND alarme_enviado = 0
  └─ Dispara email HTML com data, hora, local, link
  └─ Marca alarme_enviado = 1

CICLOS SUPORTADOS:
  24x72:      [24h plantão] [72h folga] (ciclo 4 dias)
  24x48:      [24h plantão] [48h folga] (ciclo 3 dias)
  12x36-folgao: [12h] [36h] com folgão semanal
  12x24-12x72: [12h] [24h] [12h] [72h] (ciclo 5 dias)
  12x24-12x48: [12h] [24h] [12h] [48h] (ciclo 4 dias)
```

### 3.2 Módulo RAS (Regime de Atividade Suplementar)

**Objetivo:** Controle de plantões extras remunerados com máquina de estados e cálculo automático de valor.

```
AGENDAR RAS
  └─ POST /ras/agendar
  └─ Validações (CRÍTICAS):
     ├─ Limite 120h/mês: horasAcumuladas + duracao <= 120
     ├─ Descanso 8h: nenhum RAS nas 8h antes/depois
     ├─ Sem conflito com Escala ordinária na mesma data
     ├─ Plan limit: checkRas(userId) → free=5/mês, pro=∞
     └─ tipo_vaga reserva oculta quando tipo=compulsorio

MÁQUINA DE ESTADOS:
  agendado ──(data passada)──────────────────► confirmado
      │                                            │
      ├──(usuário marca dentro 72h)──► realizado   │
      │                                    │       │
      └──(usuário cancela)──► cancelado    │       │
                                           │       │
                    expires_at passou ─────▼       │
                                        pendente ──┘
                                           │
                              confirmação manual
                                           │
                                           ▼
                                       confirmado

CÁLCULO DE VALOR:
  valor = RAS_PRICE_TABLE[graduacao][duracao_horas]
  Ex: enfermeiro · 6h → R$ XXX
      enfermeiro · 12h → R$ XXX
  Valores em cents, armazenados em ras_agenda.valor_cents

LIMPEZA AUTOMÁTICA:
  RAS com status (agendado|pendente) E data_ras < hoje → DELETE
  (lógica: sem confirmação após 70h = dado inválido)

AUTO-TRANSIÇÃO:
  atualizarStatusPendentes(userId):
  UPDATE ras_agenda SET status='pendente'
  WHERE status='realizado' AND expires_at < NOW()

PAGAMENTOS ELEGÍVEIS:
  status IN ('realizado', 'pendente', 'confirmado')
  status NOT IN ('agendado', 'cancelado')

PROGRESSO MENSAL:
  Barra: horas_acumuladas / 120 * 100%
  Alerta vermelho se > 80% (96h)
  Bloqueio ao atingir 120h
```

### 3.3 Módulo LANÇAMENTOS (Transactions)

**Objetivo:** Registro e categorização de movimentações financeiras com suporte a parcelamentos, recorrências e IA.

```
NOVO LANÇAMENTO
  └─ POST /lancamentos
  └─ Validações:
     ├─ amount_cents > 0
     ├─ type IN (income, expense, ras, aporte, resgate)
     ├─ aporte/resgate: apenas usuários Pro
     ├─ Limite mensal: free=10 lançamentos, pro=∞
     └─ date <= hoje

LÓGICA DE PARCELAMENTO (apenas despesas em cartão de crédito):
  ├─ Elegibilidade: type=expense AND account.type=credito AND parcelas 2-72
  ├─ Cálculo:
  │   centsPerParcela = floor(amount_cents / total_parcelas)
  │   resto = amount_cents - (centsPerParcela * total_parcelas)
  │   1ª parcela recebe o resto (arredondamento)
  ├─ Billing date:
  │   SE purchase_day > dia_fechamento → entra no próximo ciclo
  │   SENÃO → entra no ciclo atual
  └─ Cria N registros com parent_id, parcela_atual, source='parcelado'

LÓGICA DE RECORRÊNCIA:
  ├─ Freq: semanal/quinzenal/mensal/bimestral/anual, rep 2-24
  ├─ Mutuamente exclusivo com parcelamento
  ├─ Cria parent (parcela_atual=1, source='recorrente')
  └─ Cria N-1 filhos com datas calculadas por frequência

SUGESTÃO DE CATEGORIA (IA + fallback):
  ├─ Trigger: debounce 700ms no campo descrição
  ├─ Primary: Claude Haiku via API
  │   System: "Classify expense/income. Respond ONLY with category ID or 0"
  │   Input: descrição + lista de categorias do usuário
  └─ Fallback: matching por keywords normalizadas
     Grupos: salário, alimentação, transporte, saúde,
             lazer, educação, utilidades, moradia,
             vestuário, investimento, bônus

CONVERSÃO DE MOEDA:
  toCents("1.234,56") → 123456
  Remover separador de milhar → trocar vírgula por ponto → * 100 → round
```

### 3.4 Módulo METAS

```
CRIAR META
  └─ POST /metas
  └─ Validações:
     ├─ nome não vazio, max 100 chars
     ├─ valor_alvo > 0
     ├─ Plan limit: free=2 ativas, pro=∞
     └─ prazo opcional (mes/ano)

APORTAR NA META
  └─ POST /metas/:id/aportar
  └─ Cap: valor_atual não ultrapassa valor_alvo
  └─ valor_atual += min(aporte, valor_alvo - valor_atual)

CÁLCULOS DE PROGRESSO:
  pct = (valor_atual / valor_alvo) * 100
  falta = valor_alvo - valor_atual
  meses_restantes = calcMesesAte(prazoano, prazomes)
  sugestao_mensal = falta / meses_restantes

ALERTAS AUTOMÁTICOS (alerts.engine.js):
  meta_concluida: pct >= 100 → success
  meta_urgente:   meses_restantes <= 2 → warning
  meta_expirada:  prazo passou E pct < 100 → warning
```

### 3.5 Módulo INVESTIMENTOS

```
ACESSO:
  └─ Bloqueado para Free → redirect /upgrade?recurso=investimentos

ESTRUTURA DE ATIVOS:
  Contas com type='investimento'
  Nome format: "Categoria › Instrumento"
  Ex: "Renda Fixa › Tesouro Direto"
      "Ações › PETR4"

CÁLCULOS DE PORTFOLIO:
  patrimonio_total = SUM(saldo de todas as contas investimento)
  total_aportado   = SUM(transactions onde type='aporte')
  total_resgatado  = SUM(transactions onde type='resgate')
  saldo_por_ativo  = aportado - resgatado (por account_id)
  pct_por_categoria = saldo_ativo / patrimonio_total * 100

COTAÇÕES AO VIVO:
  └─ API: brapi.dev
  └─ Atualização: a cada 60s
  └─ Ticker detection: /^[A-Z]{4}\d{1,2}$/ (ex: PETR4, MXRF11)
  └─ Fallback: primeiros 4 chars do nome como símbolo
```

### 3.6 Módulo DASHBOARD

```
HEALTH SCORE (0-100):
  ├─ Saldo positivo no mês:         20 pts
  ├─ Taxa de poupança (savings rate): 40 pts
  │   savings_rate = (income - expense) / income * 100
  ├─ Horas RAS no mês:              30 pts
  └─ Uso de categorias (engajamento): 10 pts

KPIs MENSAIS:
  patrimonio_total     = SUM(saldo contas não-crédito)
  operacional          = SUM(saldo contas banco+outro)
  investido            = SUM(saldo contas investimento)
  cashflow_mes         = income_mes - expense_mes
  ras_pendente         = SUM(ras_agenda.valor_cents WHERE status IN paid_states)
  savings_rate         = cashflow_mes / income_mes * 100
  projecao_fim_mes     = saldo_atual + (cashflow_diario * dias_restantes)

PROJEÇÃO:
  SE progresso_mes > 5%: usar taxa diária atual
  SENÃO: usar média histórica 3 meses

ALERTAS (alerts.engine.js) — máx 5, por prioridade:
  1. orcamento_estourado (danger):   gasto_cat > budget_cat
  2. saldo_negativo (danger):         expense > income
  3. ras_limite (danger):             horas >= 120
  4. orcamento_critico (warning):    gasto_cat > 80% budget
  5. gasto_elevado (warning):         expense > 90% income
  6. ras_alerta (warning):            horas > 80% (96h)
  7. meta_expirada (warning):         prazo passou
  8. meta_urgente (warning):          <= 2 meses
  9. inatividade (info):              7+ dias sem lançamento
  10. meta_concluida (success):       pct = 100%
```

---

## 4. Regras de Validação Críticas

### Segurança & Auth
| Regra | Implementação |
|-------|---------------|
| Bcrypt salt 12 | Hash de senhas |
| Session fixation prevention | `req.session.regenerate()` antes do login |
| Timing-safe comparison | `crypto.timingSafeEqual()` para tokens |
| TOTP 2FA | TOTP secret por usuário, QR code |
| Rate limiting | login/register/forgot-password com retry timer |
| LGPD consent | Checkbox obrigatório no cadastro |
| CPF validation | Algoritmo mod11 frontend + backend |
| CSRF | Synchronizer Token Pattern em todos os POST |
| Session max age | 7 dias, secure+samesite em produção |

### Dados Financeiros
| Regra | Detalhes |
|-------|----------|
| Valores em centavos | NUNCA float — sempre INTEGER cents |
| Parcelamento só crédito | type=expense AND account.type=credito |
| Parcelas 2-72 | Range obrigatório |
| Recorrência e parcelamento exclusivos | Não podem coexistir no mesmo lançamento |
| Datas ISO 8601 | YYYY-MM-DD, max=hoje |
| competencia_at para fatura | Determina em qual fatura do cartão cai |

### RAS Específico
| Regra | Valor |
|-------|-------|
| Limite mensal de horas | 120h |
| Descanso entre RAS | 8h mínimo |
| Janela de confirmação | 72h após início do plantão |
| Horas acima do limite | Não remuneradas |
| Timezone | America/Sao_Paulo (UTC-3, sem DST) |
| Conflito Escala | RAS não pode coincidir com plantão ordinário |

### Escala Específico
| Regra | Valor |
|-------|-------|
| Alarme | 12h antes do início do plantão |
| Formato hora | HH:MM (regex `/^([01]\d|2[0-3]):[0-5]\d$/`) |
| Unicidade | UNIQUE(user_id, data, hora_inicio) |

---

## 5. Endpoints por Módulo

### Auth (`/`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/login` | Página de login |
| POST | `/login` | Autenticar usuário |
| GET | `/register` | Formulário de cadastro |
| POST | `/register` | Criar conta (CPF + LGPD) |
| GET | `/forgot-password` | Solicitar reset |
| POST | `/forgot-password` | Enviar email de reset |
| GET | `/reset-password/:token` | Página de nova senha |
| POST | `/reset-password/:token` | Atualizar senha |
| GET | `/2fa/setup` | Configurar 2FA TOTP |
| POST | `/2fa/enable` | Ativar 2FA |
| POST | `/2fa/verify` | Verificar código 2FA no login |
| POST | `/2fa/disable` | Desativar 2FA |
| POST | `/logout` | Encerrar sessão |

### Dashboard (`/app`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/app` | Dashboard mensal com KPIs |
| GET | `/app/anual` | Visão anual agregada |

### Lançamentos (`/lancamentos`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/lancamentos` | Histórico com filtros |
| GET | `/lancamentos/novo` | Formulário novo lançamento |
| POST | `/lancamentos` | Criar lançamento |
| GET | `/lancamentos/:id/editar` | Formulário de edição |
| POST | `/lancamentos/:id/editar` | Atualizar lançamento |
| POST | `/lancamentos/:id/excluir` | Excluir lançamento |
| POST | `/lancamentos/sugerir-categoria` | IA: sugerir categoria |

### Contas (`/contas`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/contas` | Listar contas por tipo |
| GET | `/contas/:id` | Detalhe da conta + extrato |
| POST | `/contas` | Criar conta |
| POST | `/contas/:id/editar` | Atualizar conta |
| POST | `/contas/:id/excluir` | Excluir conta |

### Categorias (`/categorias`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/categorias` | Listar + orçamentos |
| POST | `/categorias` | Criar categoria |
| POST | `/categorias/:id/orcamento` | Definir orçamento |
| POST | `/categorias/:id/excluir` | Excluir categoria |

### Recorrências (`/recorrencias`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/recorrencias` | Listar recorrências |
| POST | `/recorrencias` | Criar recorrência |
| POST | `/recorrencias/:id/toggle` | Ativar/pausar |
| POST | `/recorrencias/:id/excluir` | Excluir |

### Metas (`/metas`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/metas` | Listar metas |
| POST | `/metas` | Criar meta |
| POST | `/metas/:id/aportar` | Adicionar valor |
| POST | `/metas/:id/toggle` | Ativar/pausar |
| POST | `/metas/:id/excluir` | Excluir |

### Escala (`/app/escala`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/app/escala` | Calendário + lista de plantões |
| POST | `/app/escala/marcar` | Criar/atualizar plantão |
| POST | `/app/escala/desmarcar` | Remover plantão |
| GET | `/app/escala/api/config` | Obter config de escala |
| POST | `/app/escala/api/config` | Salvar config de escala |
| POST | `/app/escala/deletar-config` | Remover config + plantões |
| GET | `/app/escala/api/dia` | Plantão de uma data |
| GET | `/app/escala/api/mes` | Plantões do mês |

### RAS (`/ras`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/ras` | Dashboard RAS (calendário + estatísticas) |
| POST | `/ras/agendar` | Agendar RAS |
| POST | `/marcar` | Toggle rápido no calendário |
| POST | `/desmarcar` | Remover do calendário |
| POST | `/ras/:id/realizar` | Marcar como realizado (72h window) |
| POST | `/ras/:id/confirmar` | Confirmar RAS com observação |
| POST | `/ras/:id/editar` | Editar dados do RAS |
| POST | `/ras/:id/delete` | Remover RAS |
| GET | `/api/ras/verificar-conflitos` | Verificar conflitos de horário |
| GET | `/api/ras/debug` | Debug (dev only) |

### Investimentos (`/investimentos`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/investimentos` | Dashboard portfolio (Pro only) |

### Assistente IA (`/assistente`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/assistente` | Interface de chat |
| POST | `/assistente/chat` | Enviar mensagem ao Claude |

### Relatórios (`/relatorios`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/relatorios` | Dashboard com filtros |
| GET | `/relatorios/export` | Download PDF mensal |
| GET | `/relatorios/csv` | Export CSV |
| GET | `/relatorios/ir` | PDF declaração IR anual |

### Pagamentos & Planos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/webhook/mercadopago` | Webhook de pagamentos |
| GET | `/upgrade` | Página de upgrade |

### Push Notifications
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/push/vapid-public-key` | Chave pública VAPID |
| POST | `/push/subscribe` | Registrar dispositivo |
| POST | `/push/unsubscribe` | Remover subscrição |
| GET | `/push/status` | Status da subscrição |
| POST | `/push/test` | Testar notificação |

### Configurações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/configuracoes` | Página de configurações |
| GET | `/backup` | Export de dados (JSON/CSV) |

### Admin (`/hq`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/hq` | Painel administrativo |
| POST | `/hq/users/:id/grant-pro` | Conceder PRO |
| POST | `/hq/users/:id/grant-trial` | Conceder Trial |
| POST | `/hq/users/:id/cancel-pro` | Cancelar PRO |
| POST | `/hq/users/:id/block` | Bloquear usuário |
| GET | `/hq/metrics` | MRR, ARR, churn |

---

## 6. Integrações Externas

### Anthropic Claude API
- **Modelo:** `claude-sonnet-4-20250514`
- **Max tokens:** 1024
- **Usos:**
  1. **Assistente financeiro** (POST /assistente/chat): Contexto inclui transações do mês, contas, metas, recorrências, métricas financeiras do usuário
  2. **Sugestão de categoria** (POST /lancamentos/sugerir-categoria): Prompt minimalista retorna apenas o ID da categoria
- **Fallback de categoria:** keyword matching em 11 grupos semânticos normalizados

### Mercado Pago
- **Tipo:** Webhooks (não SDK direto)
- **Eventos:**
  - `payment.updated` (status=`approved`) → `grantPro(userId, 30 dias)`
  - `subscription_preapproval` (status=`authorized`) → `grantPro(userId, 35 dias)`
  - Cancelamento/pausa → `cancelPro(userId)`
- **Segurança:** `MP_WEBHOOK_SECRET` para validar assinatura

### BRAPI.dev (Cotações B3)
- **Uso:** Cotações de ações em tempo real no módulo Investimentos
- **Polling:** 60 segundos
- **Fallback:** exibir último valor conhecido sem indicador "ao vivo"

### Web Push (PWA)
- **Protocolo:** VAPID com biblioteca `web-push`
- **Variáveis:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- **Notificações enviadas:**
  - Alarme de plantão (12h antes)
  - Confirmação de subscrição
  - Alertas de limite RAS
- **Cleanup:** subscriptions com HTTP 410/404 são deletadas automaticamente

### Python PDF Generation
- **Scripts:** `pdf_mensal.py` e `pdf_ir.py`
- **Protocolo:** `child_process.spawn` com JSON no stdin, PDF no stdout
- **Nota para Next.js:** Reimplementar com biblioteca Node pura (pdfkit, @react-pdf/renderer, ou API route com puppeteer)

### SMTP (Email)
- **Uso:** Reset de senha, alarmes de plantão
- **Opcional:** Sistema degrada graciosamente sem SMTP configurado

---

## 7. Considerações para Reimplementação em Next.js 14

### Estrutura de Rotas Recomendada (App Router)
```
src/app/
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/[token]/
├── (app)/
│   ├── layout.tsx          ← requireAuth server-side
│   ├── page.tsx            ← Dashboard
│   ├── lancamentos/
│   ├── contas/
│   ├── categorias/
│   ├── recorrencias/
│   ├── metas/
│   ├── escala/
│   ├── ras/
│   ├── investimentos/
│   ├── assistente/
│   └── relatorios/
├── api/
│   ├── auth/[...nextauth]/
│   ├── lancamentos/
│   ├── escala/
│   ├── ras/
│   ├── metas/
│   ├── investimentos/
│   ├── assistente/
│   ├── push/
│   └── webhooks/
│       └── mercadopago/
└── (public)/
    ├── page.tsx            ← Landing
    └── upgrade/
```

### Decisões Arquiteturais Críticas
1. **Auth:** NextAuth.js v5 com adapter Supabase + provider Credentials (email/senha) + TOTP manual
2. **DB:** Prisma + Supabase PostgreSQL (migrar SQLite INTEGER cents → BIGINT)
3. **Validação:** Zod em todas as Server Actions e API Routes
4. **Moeda:** Sempre `BigInt` ou `number` centavos — nunca `float`
5. **Timezone:** `date-fns-tz` com `America/Sao_Paulo` em todos os cálculos de RAS/Escala
6. **PDF:** Substituir Python por `@react-pdf/renderer` como Server Component
7. **Push:** `web-push` nativo em Next.js API Route
8. **Rate limiting:** `@upstash/ratelimit` com Redis Upstash
9. **Plano gates:** Middleware Next.js ou HOC de Server Component verificando `user.plan`
10. **AI Category:** Streaming response com `ai` SDK da Vercel para sugestão de categoria

### Migrações de Dados Urgentes
- `value (NUMERIC legacy)` → usar exclusivamente `amount_cents (INTEGER)`
- `meta_json TEXT` → colunas explícitas ou JSONB no Postgres
- `user_id TEXT` inconsistente → padronizar para UUID ou INTEGER
- Adicionar `deleted_at` (soft delete) em transactions, accounts, categories
