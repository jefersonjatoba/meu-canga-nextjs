# Endpoints por Módulo — Meu Canga Next.js 14

> Mapeamento completo do original Node/Express para API Routes Next.js 14 (App Router)
> Todos os endpoints protegidos exigem autenticação via NextAuth session

---

## Convenções

- Rotas em `src/app/api/` usam `Route Handlers` (Next.js 14 App Router)
- Server Actions para mutações de formulários simples
- Respostas em JSON com envelope `{ data, error, message }`
- Valores monetários sempre em centavos (cents) como `number` inteiro
- Datas no formato ISO 8601: `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss`

---

## AUTH

| Método | Rota Next.js | Descrição | Middleware |
|--------|-------------|-----------|-----------|
| GET | `/login` | Página de login | — |
| POST | `/api/auth/login` | Autenticar via Credentials | rate-limit(5/min) |
| GET | `/register` | Página de cadastro | — |
| POST | `/api/auth/register` | Criar conta (CPF+LGPD obrigatórios) | rate-limit(3/min) |
| POST | `/api/auth/forgot-password` | Solicitar token de reset | rate-limit(3/10min) |
| GET | `/reset-password/[token]` | Página nova senha | — |
| POST | `/api/auth/reset-password` | Atualizar senha via token | rate-limit |
| GET | `/api/auth/2fa/setup` | Gerar secret TOTP + QR | requireAuth |
| POST | `/api/auth/2fa/enable` | Ativar 2FA | requireAuth |
| POST | `/api/auth/2fa/verify` | Verificar código 2FA | session:pendingUserId |
| POST | `/api/auth/2fa/disable` | Desativar 2FA | requireAuth |
| POST | `/api/auth/logout` | Encerrar sessão | requireAuth |

**Payload de login:**
```json
{ "email": "string", "password": "string" }
```

**Payload de register:**
```json
{
  "nome_completo": "string",
  "email": "string",
  "cpf": "string (somente dígitos)",
  "password": "string (min 6)",
  "password_confirm": "string",
  "lgpd_consent": true
}
```

---

## DASHBOARD

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/dashboard/mensal` | KPIs do mês (cashflow, health score, alertas) | Free+Pro |
| GET | `/api/dashboard/anual` | Agregados anuais, melhor/pior mês | Free+Pro |
| GET | `/api/dashboard/alertas` | Lista de alertas ativos (max 5) | Free+Pro |

**Response mensal:**
```json
{
  "mes": "YYYY-MM",
  "income_cents": 0,
  "expense_cents": 0,
  "ras_pendente_cents": 0,
  "patrimonio_total_cents": 0,
  "operacional_cents": 0,
  "investido_cents": 0,
  "savings_rate": 0.0,
  "health_score": 0,
  "projecao_fim_mes_cents": 0,
  "alertas": []
}
```

---

## LANÇAMENTOS (Transactions)

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/lancamentos` | Listar com filtros (tipo, mes, conta, categoria) | Free(10/mês)+Pro |
| POST | `/api/lancamentos` | Criar lançamento | Free(limite)+Pro |
| GET | `/api/lancamentos/[id]` | Buscar lançamento por ID | Free+Pro |
| PATCH | `/api/lancamentos/[id]` | Atualizar lançamento | Free+Pro |
| DELETE | `/api/lancamentos/[id]` | Excluir (e filhos se parcelado) | Free+Pro |
| POST | `/api/lancamentos/sugerir-categoria` | IA: sugerir categoria | Pro only |

**Query params GET:**
```
?mes=YYYY-MM&tipo=income|expense|ras|all&conta_id=N&categoria_id=N&page=1&limit=50
```

**Payload POST:**
```json
{
  "type": "income|expense|ras|aporte|resgate",
  "amount_cents": 150000,
  "description": "string",
  "date": "YYYY-MM-DD",
  "account_id": 1,
  "category_id": 1,
  "parcelas": 1,
  "recorrencia": {
    "frequency": "mensal",
    "repeticoes": 12
  },
  "meta_json": null
}
```

**Payload sugerir-categoria:**
```json
{ "description": "string", "type": "income|expense" }
```

**Response sugerir-categoria:**
```json
{ "category_id": 5 }
```

---

## CONTAS (Accounts)

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/contas` | Listar contas agrupadas por tipo | Free+Pro |
| POST | `/api/contas` | Criar conta | Free(3)+Pro(∞) |
| GET | `/api/contas/[id]` | Detalhes + extrato | Free+Pro |
| PATCH | `/api/contas/[id]` | Atualizar conta | Free+Pro |
| DELETE | `/api/contas/[id]` | Excluir conta | Free+Pro |
| GET | `/api/contas/[id]/extrato` | Extrato com filtro de ciclo fatura | Free+Pro |

**Payload POST:**
```json
{
  "name": "string",
  "type": "banco|credito|investimento|outro",
  "credit_limit": 500000,
  "dia_fechamento": 5,
  "dia_vencimento": 10,
  "card_color": "#ff6b6b,#feca57",
  "custom_type": "string (se type=outro)"
}
```

---

## CATEGORIAS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/categorias` | Listar categorias do usuário | Free+Pro |
| POST | `/api/categorias` | Criar categoria | Free(10)+Pro(∞) |
| PATCH | `/api/categorias/[id]` | Atualizar categoria | Free+Pro |
| DELETE | `/api/categorias/[id]` | Excluir + disassociar lançamentos | Free+Pro |
| POST | `/api/categorias/[id]/orcamento` | Definir orçamento mensal | Free+Pro |
| DELETE | `/api/categorias/[id]/orcamento` | Remover orçamento | Free+Pro |

**Payload POST categoria:**
```json
{
  "nome": "string (max 50)",
  "tipo": "expense|income|ambos",
  "icone": "emoji (max 4 chars)",
  "cor": "#hexcolor"
}
```

---

## RECORRÊNCIAS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/recorrencias` | Listar recorrências | Free+Pro |
| POST | `/api/recorrencias` | Criar recorrência | Free(3)+Pro(∞) |
| PATCH | `/api/recorrencias/[id]/toggle` | Ativar/pausar | Free+Pro |
| DELETE | `/api/recorrencias/[id]` | Excluir | Free+Pro |

**Payload POST:**
```json
{
  "type": "income|expense",
  "amount_cents": 100000,
  "description": "string",
  "category_id": 1,
  "account_id": 1,
  "dia_do_mes": 5,
  "frequency": "semanal|quinzenal|mensal|bimestral|anual"
}
```

---

## METAS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/metas` | Listar metas (com progresso) | Free+Pro |
| POST | `/api/metas` | Criar meta | Free(2)+Pro(∞) |
| PATCH | `/api/metas/[id]/aportar` | Adicionar valor | Free+Pro |
| PATCH | `/api/metas/[id]/toggle` | Ativar/pausar | Free+Pro |
| DELETE | `/api/metas/[id]` | Excluir | Free+Pro |

**Payload POST:**
```json
{
  "nome": "string (max 100)",
  "icone": "emoji",
  "valor_alvo": 1000000,
  "prazomes": 12,
  "prazoano": 2026
}
```

**Payload aportar:**
```json
{ "valor_cents": 50000 }
```

---

## ESCALA

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/escala/mes` | Plantões de um mês | Free+Pro |
| GET | `/api/escala/dia` | Plantão de uma data específica | Free+Pro |
| POST | `/api/escala/marcar` | Criar/atualizar plantão | Free+Pro |
| DELETE | `/api/escala/desmarcar` | Remover plantão (data+hora_inicio) | Free+Pro |
| GET | `/api/escala/config` | Obter config de escala | Free+Pro |
| POST | `/api/escala/config` | Salvar config de escala | Free+Pro |
| DELETE | `/api/escala/config` | Remover config + todos plantões | Free+Pro |

**Query params mes:**
```
?mes=YYYY-MM
```

**Payload marcar:**
```json
{
  "data": "YYYY-MM-DD",
  "hora_inicio": "HH:MM",
  "hora_fim": "HH:MM",
  "tipo": "plantao|sobreaviso|extra|ferias|folga",
  "local": "string",
  "observacao": "string",
  "alarme_ativo": true
}
```

**Payload config:**
```json
{
  "tipo": "24x72|24x48|12x36-folgao|12x24-12x72|12x24-12x48",
  "hora_inicio": "HH:MM",
  "hora_fim": "HH:MM",
  "inicio_ciclo": "YYYY-MM-DD",
  "local": "string",
  "alarme_ativo": true
}
```

---

## RAS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/ras` | Listar RAS do mês + estatísticas | Free+Pro |
| POST | `/api/ras` | Agendar novo RAS | Free(5/mês)+Pro(∞) |
| GET | `/api/ras/[id]` | Detalhe do RAS | Free+Pro |
| PATCH | `/api/ras/[id]/realizar` | Marcar como realizado (72h window) | Free+Pro |
| POST | `/api/ras/[id]/confirmar` | Confirmar com observação | Free+Pro |
| PATCH | `/api/ras/[id]` | Editar dados do RAS | Free+Pro |
| DELETE | `/api/ras/[id]` | Cancelar/remover RAS | Free+Pro |
| GET | `/api/ras/conflitos` | Verificar conflitos de horário | Free+Pro |
| GET | `/api/ras/pagamentos` | Histórico de pagamentos | Free+Pro |
| POST | `/api/ras/pagamentos` | Registrar pagamento do mês | Pro only |

**Query params GET /api/ras:**
```
?mes=YYYY-MM
```

**Payload POST agendar:**
```json
{
  "data_ras": "YYYY-MM-DD",
  "hora_inicio": 7,
  "duracao": 6,
  "graduacao": "enfermeiro|tecnico_enfermagem|medico|farmaceutico",
  "tipo": "voluntario|compulsorio",
  "tipo_vaga": "titular|reserva",
  "local": "string",
  "observacao": "string"
}
```

**Response agendar (validações que podem falhar):**
```json
{
  "error": "LIMITE_120H | CONFLITO_DESCANSO | CONFLITO_ESCALA | LIMITE_PLANO",
  "details": {
    "horas_acumuladas": 108,
    "horas_novas": 12,
    "horas_restantes": 12
  }
}
```

**Payload confirmar:**
```json
{ "observacao_confirmacao": "string" }
```

**Query params conflitos:**
```
?data=YYYY-MM-DD&hora_inicio=7&duracao=12
```

---

## INVESTIMENTOS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/investimentos` | Portfolio + cotações | Pro only |
| GET | `/api/investimentos/cotacoes` | Cotações ao vivo BRAPI | Pro only |

**Response portfolio:**
```json
{
  "patrimonio_total_cents": 0,
  "total_aportado_cents": 0,
  "total_resgatado_cents": 0,
  "ativos": [
    {
      "account_id": 1,
      "nome": "Renda Fixa › Tesouro Direto",
      "saldo_cents": 0,
      "pct_portfolio": 0.0,
      "ticker": null
    }
  ]
}
```

---

## ASSISTENTE IA

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| POST | `/api/assistente/chat` | Enviar mensagem (streaming) | Pro only |

**Payload:**
```json
{ "message": "string", "history": [] }
```

**Response:** Server-Sent Events (streaming) com tokens do Claude

---

## RELATÓRIOS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/relatorios/mensal` | Dados do relatório mensal | Free+Pro |
| GET | `/api/relatorios/pdf` | Download PDF mensal | Pro only |
| GET | `/api/relatorios/csv` | Export CSV | Pro only |
| GET | `/api/relatorios/ir` | PDF Declaração IR anual | Pro only |

**Query params:**
```
?mes=YYYY-MM&tipo=income|expense|all
```

---

## PUSH NOTIFICATIONS

| Método | Rota Next.js | Descrição | Auth |
|--------|-------------|-----------|------|
| GET | `/api/push/vapid-public-key` | Obter chave pública VAPID | Público |
| POST | `/api/push/subscribe` | Registrar dispositivo | requireAuth |
| DELETE | `/api/push/subscribe` | Remover subscrição | requireAuth |
| GET | `/api/push/status` | Status da subscrição | requireAuth |

**Payload subscribe:**
```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

---

## WEBHOOKS

| Método | Rota Next.js | Descrição | Auth |
|--------|-------------|-----------|------|
| POST | `/api/webhooks/mercadopago` | Receber eventos de pagamento | MP-Signature |

**Eventos tratados:**
```json
{ "type": "payment.updated", "data": { "id": "payment_id" } }
{ "type": "subscription_preapproval", "data": { "id": "sub_id" } }
```

---

## CONFIGURAÇÕES & DADOS

| Método | Rota Next.js | Descrição | Plano |
|--------|-------------|-----------|-------|
| GET | `/api/profile` | Dados do perfil | Free+Pro |
| PATCH | `/api/profile` | Atualizar perfil | Free+Pro |
| GET | `/api/backup` | Export JSON completo | Pro only |
| GET | `/api/backup/csv` | Export CSV transações | Pro only |

---

## ADMIN (HQ)

| Método | Rota Next.js | Descrição | Auth |
|--------|-------------|-----------|------|
| GET | `/api/admin/users` | Listar usuários | is_admin |
| POST | `/api/admin/users/[id]/grant-pro` | Conceder PRO | is_admin |
| POST | `/api/admin/users/[id]/grant-trial` | Conceder Trial (7 dias) | is_admin |
| POST | `/api/admin/users/[id]/cancel-pro` | Cancelar PRO | is_admin |
| POST | `/api/admin/users/[id]/block` | Bloquear usuário | is_admin |
| GET | `/api/admin/metrics` | MRR, ARR, churn, histórico | is_admin |
| POST | `/api/admin/notes` | Adicionar nota sobre usuário | is_admin |

---

## Códigos de Erro Padrão

| Código | Significado |
|--------|-------------|
| `UNAUTHENTICATED` | Sessão inválida ou expirada |
| `FORBIDDEN` | Plano não permite o recurso |
| `PLAN_LIMIT_REACHED` | Limite do plano atingido |
| `VALIDATION_ERROR` | Dados inválidos (detalhes em `errors[]`) |
| `NOT_FOUND` | Recurso não encontrado |
| `CONFLICT` | Conflito de dados (ex: UNIQUE violation) |
| `RAS_LIMITE_120H` | Limite mensal RAS atingido |
| `RAS_CONFLITO_DESCANSO` | Menos de 8h de descanso |
| `RAS_CONFLITO_ESCALA` | Conflito com plantão ordinário |
| `RAS_JANELA_EXPIRADA` | 72h para confirmar realizado expirou |
