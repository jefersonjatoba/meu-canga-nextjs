# Business Rules — Meu Canga

> Regras de negócio extraídas do repositório original `jefersonjatoba/meu-canga`
> Documento crítico para reimplementação com garantia de paridade funcional

---

## 1. SISTEMA DE PLANOS

### Planos disponíveis
- `free` — Padrão ao criar conta
- `trial` — 7 dias com acesso Pro (concedido manualmente ou via promoção)
- `pro` — Assinatura mensal R$ 19,90 via Mercado Pago

### Feature Gates — Regra geral
```
canUseRecurso(user, recurso):
  IF user.plan === 'pro' OR user.plan === 'trial' AND NOT expired → return true
  ELSE → verificar limite do plano free
```

### Limites por feature
| Feature | Free | Pro/Trial |
|---------|------|-----------|
| `lancamentos_por_mes` | 10 | ∞ |
| `contas` | 3 | ∞ |
| `categorias` | 10 | ∞ |
| `metas_ativas` | 2 | ∞ |
| `recorrencias_ativas` | 3 | ∞ |
| `ras_por_mes` | 5 | ∞ |
| `investimentos` | bloqueado | habilitado |
| `assistente_ia` | bloqueado | habilitado |
| `relatorios_pdf` | bloqueado | habilitado |
| `backup_dados` | bloqueado | habilitado |
| `relatorio_ir` | bloqueado | habilitado |

### Paywall
Quando limite atingido: redirecionar para `/upgrade?recurso={feature_name}`

### Expiração automática
- Job `expireSubscriptions()` roda a cada hora
- Verifica `subscriptions WHERE status='active' AND ends_at < NOW()`
- Executa `cancelPro(user_id)` → `users.plan = 'free'`

---

## 2. AUTENTICAÇÃO & SEGURANÇA

### CPF
```
Algoritmo de validação (mod11):
1. Remove não-dígitos
2. Rejeita CPFs com todos os dígitos iguais (111.111.111-11 etc)
3. Calcula 1º dígito verificador
4. Calcula 2º dígito verificador
5. Compara com os dígitos informados
Validação IDÊNTICA no frontend (JS) e backend
```

### Senha
- Mínimo 6 caracteres
- Hash com bcrypt salt factor 12
- Dummy hash comparison no login para prevenir timing attacks

### Session
- Regenerar session ID antes de autenticar (`req.session.regenerate()`)
- Max age: 7 dias
- Secure + SameSite=lax em produção
- Inatividade: logout automático após 10 minutos (cliente)

### 2FA (TOTP)
```
Setup: gerar secret → exibir QR code
Enable: validar código de 6 dígitos contra secret
Login com 2FA:
  1. Validar email+senha → armazenar userId em session.pendingUserId
  2. Redirecionar para /2fa/verify
  3. Validar código TOTP → mover para session.userId (autenticado)
Disable: exige código TOTP atual
```

### Rate Limiting
| Endpoint | Limite |
|----------|--------|
| POST /login | 5 tentativas/minuto |
| POST /register | 3 tentativas/minuto |
| POST /forgot-password | 3 tentativas/10 minutos |

### LGPD
- Checkbox de consentimento obrigatório no cadastro
- `lgpd_consent = 1` deve estar presente para criar conta

### Tokens de reset
- TTL: 15 minutos
- Comparação com `crypto.timingSafeEqual()` (timing-safe)
- Deletar token após uso bem-sucedido

---

## 3. LANÇAMENTOS (TRANSACTIONS)

### Tipos válidos
| type | Descrição | Restrição |
|------|-----------|-----------|
| `income` | Receita | Free+Pro |
| `expense` | Despesa | Free+Pro |
| `ras` | Plantão RAS (gerado via módulo RAS) | Free+Pro |
| `aporte` | Aporte em investimento | Pro only |
| `resgate` | Resgate de investimento | Pro only |

### Conversão de moeda (CRÍTICO)
```javascript
toCents(value: string): number
  // Input: "1.234,56" (formato BR)
  // 1. Remover separadores de milhar (.)
  // 2. Trocar vírgula por ponto
  // 3. parseFloat → * 100 → Math.round
  // Output: 123456 (centavos)
  // NUNCA armazenar float, NUNCA fazer cálculos em reais
```

### Parcelamento
**Condições obrigatórias:**
1. `type === 'expense'`
2. `account.type === 'credito'`
3. `parcelas` entre 2 e 72

**Cálculo de parcelas:**
```
centsPerParcela = Math.floor(amount_cents / parcelas)
resto = amount_cents - (centsPerParcela * parcelas)
primeira_parcela = centsPerParcela + resto  // recebe o arredondamento
```

**Data de competência (fatura):**
```
SE dia_compra > account.dia_fechamento:
  competencia_at = próximo mês (YYYY-MM+1)
SENÃO:
  competencia_at = mês atual (YYYY-MM)

Parcelas subsequentes: competencia_at += 1 mês cada
```

**Armazenamento:**
- Registro pai: `source='parcelado'`, `parcelas=N`, `parcela_atual=1`
- Filhos: `parent_id=pai.id`, `parcela_atual=2..N`

### Recorrência
**Condições obrigatórias:**
1. `frequency` in `['semanal', 'quinzenal', 'mensal', 'bimestral', 'anual']`
2. `repeticoes` entre 2 e 24
3. `parcelas === 1` (mutuamente exclusivo com parcelamento)

**Processo:**
1. Inserir registro pai: `source='recorrente'`, `parcelas=N`, `parcela_atual=1`
2. Inserir N-1 filhos com datas calculadas
3. Todos os filhos referenciam o pai via `parent_id`

**Cálculo de datas:**
```
semanal:    date += 7 dias por iteração
quinzenal:  date += 15 dias por iteração
mensal:     date.setMonth(month + i)
bimestral:  date.setMonth(month + 2*i)
anual:      date.setFullYear(year + i)
```

### Sugestão de categoria por IA
```
Trigger: usuário para de digitar por 700ms (debounce)
Fluxo:
  1. Chamar POST /api/lancamentos/sugerir-categoria
  2. Tentar: Claude Haiku API
     System: "Dado a lista de categorias [id:nome,...] e o tipo income/expense,
              responda APENAS com o número do ID da categoria.
              Se nenhuma categoria se encaixar, responda 0."
  3. Fallback: keyword matching normalizado
     - normalizar: minúsculas, remover acentos
     - testar contra grupos de keywords predefinidos

Grupos de keywords (fallback):
  salario:      ['salario', 'vencimento', 'remuneracao', 'contracheque', 'holerite']
  alimentacao:  ['mercado', 'supermercado', 'restaurante', 'lanche', 'refeicao', 'ifood']
  transporte:   ['uber', 'gasolina', 'combustivel', '99', 'onibus', 'metro', 'estacionamento']
  saude:        ['farmacia', 'remedios', 'consulta', 'medico', 'hospital', 'plano de saude']
  lazer:        ['cinema', 'netflix', 'spotify', 'streaming', 'viagem', 'hotel']
  educacao:     ['curso', 'faculdade', 'escola', 'livro', 'mensalidade']
  utilidades:   ['energia', 'agua', 'internet', 'telefone', 'luz', 'gas']
  moradia:      ['aluguel', 'condominio', 'iptu', 'financiamento']
  vestuario:    ['roupa', 'sapato', 'calcado', 'camisa', 'vestido']
  investimento: ['tesouro', 'acoes', 'fii', 'cdb', 'lci', 'lca', 'debentures']
  bonus:        ['bonus', 'premio', '13', 'ferias', 'gratificacao', 'ras']
```

### Limite do plano free
```
checkLancamentos(userId, mes):
  count = SELECT COUNT(*) FROM transactions
          WHERE user_id = userId
          AND date LIKE 'YYYY-MM%'
          AND source != 'recorrente'  // não conta gerados automaticamente
  IF count >= 10 AND user.plan = 'free':
    return { blocked: true, count, limit: 10 }
```

---

## 4. MÓDULO ESCALA

### Padrões de ciclo suportados
```
24x72:         |24h plantão|72h folga| → ciclo 4 dias
24x48:         |24h plantão|48h folga| → ciclo 3 dias
12x36-folgao:  |12h|36h| + folgão semanal especial
12x24-12x72:   |12h|24h|12h|72h| → ciclo 5 dias
12x24-12x48:   |12h|24h|12h|48h| → ciclo 4 dias
```

### Progresso de plantão
```
calcularProgressoEscala(plantao, agora_SP):
  inicio = parseISO(plantao.data + 'T' + plantao.hora_inicio + '-03:00')
  duracao_h = extrairHorasDoTipo(plantao.config.tipo)  // ex: "24x72" → 24
  fim = inicio + duracao_h * 3600000

  IF agora < inicio: return { status: 'futuro', pct: 0 }
  IF agora >= fim:   return { status: 'concluido', pct: 100 }

  elapsed = agora - inicio
  total = fim - inicio
  pct = Math.min(99, Math.round(elapsed / total * 100))
  return { status: 'em_progresso', pct }
```

### Alarme de plantão
```
Trigger (worker/cron): a cada 30min verificar
Query:
  WHERE (data + hora_inicio)::timestamp
    BETWEEN (NOW() + '11.5 hours') AND (NOW() + '12.5 hours')
  AND alarme_ativo = 1
  AND alarme_enviado = 0

Ação:
  1. Enviar email HTML com dados do plantão
  2. Enviar push notification se subscrito
  3. UPDATE escala SET alarme_enviado = 1 WHERE id = X
```

### Unicidade de plantão
- Constraint: `UNIQUE(user_id, data, hora_inicio)`
- Um profissional pode ter dois plantões no mesmo dia se em horários distintos (ex: 7h e 19h)

---

## 5. MÓDULO RAS

### Limite mensal (CRÍTICO)
```
REGRA: Máximo 120 horas de RAS por mês calendário
CÁLCULO:
  horas_acumuladas = SUM(duracao)
    FROM ras_agenda
    WHERE user_id = X
    AND DATE_TRUNC('month', data_ras) = mes_atual
    AND status NOT IN ('cancelado')

VALIDAÇÃO ao agendar:
  IF horas_acumuladas + nova_duracao > 120:
    REJEITAR com erro RAS_LIMITE_120H
    Retornar: acumuladas, novas, restantes
```

### Intervalo de descanso (CRÍTICO)
```
REGRA: Mínimo 8 horas entre plantões RAS consecutivos
VALIDAÇÃO ao agendar (novo RAS de duração D, iniciando em T):
  Verificar se existe qualquer RAS onde:
    [inicio_existente - 8h] < T+D  E  T < [inicio_existente + duracao_existente + 8h]
  Se conflito: REJEITAR com erro RAS_CONFLITO_DESCANSO
```

### Conflito com Escala ordinária
```
REGRA: Não agendar RAS em data com plantão ordinário
VALIDAÇÃO:
  IF EXISTS(SELECT 1 FROM escala WHERE user_id=X AND data=data_ras):
    REJEITAR com erro RAS_CONFLITO_ESCALA
```

### Máquina de estados RAS
```
ESTADOS: agendado | confirmado | realizado | pendente | cancelado

TRANSIÇÕES AUTOMÁTICAS (worker/cron):
  1. agendado → confirmado
     WHEN: data_ras < hoje AND status = 'agendado'
     Regra: passada a data sem o usuário interagir, confirma automaticamente

  2. realizado → pendente
     WHEN: expires_at < NOW() AND status = 'realizado'
     Regra: janela de 72h expirou, aguarda confirmação manual

TRANSIÇÕES MANUAIS:
  3. agendado → realizado (usuário)
     QUANDO: dentro da janela de 72h após hora_inicio
     VALIDAÇÃO: NOW() <= data_ras + hora_inicio + 72h

  4. pendente → confirmado (usuário)
     QUANDO: usuário confirma manualmente

  5. qualquer → cancelado (usuário)
     QUANDO: usuário cancela o RAS

LIMPEZA:
  DELETE FROM ras_agenda
  WHERE status IN ('agendado', 'pendente')
  AND data_ras < hoje - 3 dias
  Regra: dados inválidos (sem interação após o prazo)
```

### Cálculo de valor
```
valor_cents = RAS_PRICE_TABLE[graduacao][duracao_horas]

Tabela bidimensional: graduacao × duração (6h ou 12h)
Graduações: tecnico_enfermagem, enfermeiro, medico, farmaceutico, etc.
Valor 0 se combinação não encontrada na tabela.
```

### Timezone (CRÍTICO para RAS)
```
TODAS as comparações de data/hora RAS usam America/Sao_Paulo (UTC-3)
Sem DST no Brasil a partir de 2019.

_eventoInicioSP(data_ras, hora_inicio):
  // Montar ISO string com offset explícito
  hora_str = hora_inicio.toString().padStart(2, '0') + ':00'
  return new Date(`${data_ras}T${hora_str}:00-03:00`)
  // NUNCA usar new Date(data + 'T' + hora) sem timezone
```

### Tipo vaga reserva
```
REGRA: tipo_vaga 'reserva' é OCULTADO quando tipo = 'compulsorio'
Compulsório = mandatório pela gestão → sempre titular
Voluntário = pode ser titular ou reserva (substituto)
```

### Pagamentos elegíveis
```
Ganho do mês = SUM(valor_cents)
  FROM ras_agenda
  WHERE user_id = X
  AND mes_ref = 'YYYY-MM'
  AND status IN ('realizado', 'pendente', 'confirmado')
  -- NÃO inclui 'agendado' (não realizado ainda)
  -- NÃO inclui 'cancelado'
```

### Limite do plano Free para RAS
```
checkRas(userId, mes):
  count = SELECT COUNT(*) FROM ras_agenda
          WHERE user_id = userId
          AND DATE_TRUNC('month', data_ras) = mes
          AND status != 'cancelado'
  IF count >= 5 AND user.plan = 'free':
    redirect /upgrade?recurso=limite_ras
```

---

## 6. MÓDULO METAS

### Aporte com cap
```
REGRA: valor_atual não pode ultrapassar valor_alvo
valor_para_adicionar = MIN(aporte_cents, valor_alvo - valor_atual)
UPDATE metas SET valor_atual = valor_atual + valor_para_adicionar
```

### Progresso e projeção
```
pct = (valor_atual / valor_alvo) * 100
falta_cents = valor_alvo - valor_atual
meses_restantes = (prazoano * 12 + prazomes) - (hoje.year * 12 + hoje.month)
sugestao_mensal_cents = meses_restantes > 0 ? Math.ceil(falta_cents / meses_restantes) : falta_cents
```

### Alertas de meta
```
meta_concluida: pct >= 100 → emitir uma vez (evitar spam)
meta_urgente:   meses_restantes <= 2 AND pct < 100
meta_expirada:  meses_restantes < 0 AND pct < 100
```

---

## 7. DASHBOARD — HEALTH SCORE

```
health_score (0-100) = soma ponderada de 4 componentes:

1. Saldo (20 pts):
   saldo_mes = income_mes - expense_mes
   score_saldo = saldo_mes > 0 ? 20 : 0

2. Taxa de poupança (40 pts):
   savings_rate = (income_mes - expense_mes) / income_mes
   score_poupanca = MIN(40, savings_rate * 40)

3. Horas RAS (30 pts):
   score_ras = MIN(30, (horas_ras_mes / meta_horas_ras) * 30)

4. Engajamento com categorias (10 pts):
   categorias_usadas = COUNT(DISTINCT category_id) FROM transactions WHERE mes
   score_categorias = MIN(10, (categorias_usadas / 5) * 10)

total = score_saldo + score_poupanca + score_ras + score_categorias
```

### Projeção de saldo
```
IF progresso_mes > 5%:
  cashflow_diario = cashflow_atual / dia_atual
  projecao = saldo_atual + cashflow_diario * (dias_no_mes - dia_atual)
ELSE:
  media_3_meses = AVG(cashflow de 3 meses anteriores)
  projecao = saldo_atual + media_3_meses
```

---

## 8. ALERTS ENGINE

### Prioridade e limite
```
REGRA: Exibir máximo 5 alertas, ordenados por severidade
Severidade: danger(1) > warning(2) > info(3) > success(4)
```

### Condições de ativação
```
orcamento_estourado: gasto_categoria > budget_categoria (danger)
saldo_negativo:      income_mes < expense_mes (danger)
ras_limite:          horas_ras >= 120 (danger)

orcamento_critico:   gasto_categoria > budget_categoria * 0.8 (warning)
gasto_elevado:       expense_mes > income_mes * 0.9 (warning)
ras_alerta:          horas_ras > 120 * 0.8 = 96h (warning)
meta_expirada:       prazo passou, meta incompleta (warning)
meta_urgente:        <= 2 meses pro prazo, meta incompleta (warning)

inatividade:         último lançamento há > 7 dias (info)

meta_concluida:      100% atingido (success) — apenas 1 por vez
```

---

## 9. PAGAMENTOS (MERCADO PAGO)

### Fluxo de pagamento
```
1. Usuário acessa /upgrade
2. Cria preferência de pagamento no MP
3. MP redireciona para checkout
4. MP envia webhook POST /api/webhooks/mercadopago

Webhook payment.updated (status=approved):
  1. Buscar pagamento por ID na API MP
  2. Extrair payer.email
  3. Localizar user pelo email
  4. grantPro(userId, 30 dias)
  5. Registrar em subscriptions

Webhook subscription_preapproval (status=authorized):
  1. Buscar assinatura recorrente
  2. grantPro(userId, 35 dias)  // margem de 5 dias

Cancelamento/pausa:
  1. cancelPro(userId)
  2. users.plan = 'free'
  3. Marcar subscription como 'cancelled'
```

### grantPro
```
grantPro(userId, dias):
  1. UPDATE subscriptions SET status='superseded' WHERE user_id=userId AND status='active'
  2. INSERT INTO subscriptions (plan='pro', status='active', starts_at=NOW(), ends_at=NOW()+dias)
  3. UPDATE users SET plan='pro', plan_expires_at=NOW()+dias
```

---

## 10. ASSISTENTE IA

### Contexto injetado no prompt
```
Dados incluídos por sessão de chat:
  - Nome e profissão do usuário
  - Mês atual
  - Total income, expense, savings_rate
  - Horas RAS do mês
  - Lista de contas com saldos (até 10)
  - Últimas 5 metas ativas com progresso
  - Últimas 10 recorrências ativas

System prompt:
  - Especialista em finanças pessoais para servidores/militares de saúde
  - Conhece legislação RAS, estatutos, benefícios
  - Responder em português brasileiro
  - Máximo 3-4 parágrafos
  - Personalizar com dados financeiros do usuário
  - Disclaimer para assuntos legais sérios (recomendar advogado)
```

### Modelo
```
Modelo: claude-sonnet-4-20250514
Max tokens: 1024
Temperatura: padrão (não especificado)
```

---

## 11. PROCESSAMENTO DE RECORRÊNCIAS

### Trigger
```
processarRecorrencias(userId) é chamado:
  - No carregamento do dashboard
  - Potencialmente via cron diário
```

### Lógica
```
Para cada recorrência ativa:
  IF hoje.getDate() >= recorrencia.dia_do_mes:
    verificar se já existe lançamento deste mês com recorrencia_id
    IF NOT EXISTS:
      INSERT INTO transactions (
        source = 'recorrente',
        meta_json = JSON.stringify({ recorrencia_id: id })
        ...dados da recorrência
      )
```

---

## 12. REGRAS DE DADOS CRÍTICAS

### Valores monetários
- **Nunca** usar `float` para valores monetários
- Sempre armazenar em centavos como `INTEGER`
- Arredondamento: `Math.round(value * 100)` para converter
- Exibição: `(cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`

### Soft delete
- O sistema original usa **hard delete** (DELETE direto)
- Para reimplementação: recomendar soft delete com `deleted_at`

### Competência vs. Data
```
date:           Data real da transação (quando ocorreu)
competencia_at: Mês de competência YYYY-MM (para qual fatura/mês pertence)
                Relevante principalmente para cartão de crédito parcelado
                Lançamentos normais: competencia_at = SUBSTR(date, 1, 7)
```

### Timezone
```
REGRA GLOBAL: America/Sao_Paulo (UTC-3, sem DST desde 2019)
Aplicar em:
  - Todos os cálculos de RAS (CRÍTICO)
  - Alarmes de Escala (CRÍTICO)
  - Fechamento de ciclo mensal
  - "Hoje" para limites do plano Free
```
