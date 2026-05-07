# Setup: RAS 72h Auto-Transition e Notificações via Brevo

## Visão Geral

Sistema automático que:
1. **Auto-transição**: RAS `realizado → pendente` após 72h sem confirmação
2. **Notificações**: Envia email via Brevo lembrando o policial de confirmar antes do prazo
3. **RAS a Receber**: Mostra RAS confirmados de ~30 dias atrás (prestes a serem pagos)

**Arquitetura:**
- API endpoint: `/api/internal/jobs/ras-checks` (chamado por cron externo)
- Email: Brevo (transactional)
- Database: PostgreSQL (status transitions + audit logs)

---

## Status Lifecycle

```
agendado (futuro/hoje)
    ↓ policial realiza
realizado + expiresAt = now + 72h
    ↓ [se não confirmar em 72h]
pendente (automático)
    ↓ policial confirma
confirmado
```

**RAS a Receber**: RAS confirmado de ~30 dias atrás (será pago em breve)

---

## 1️⃣ Configuração Inicial

### 1.1 Variáveis de Ambiente

Adicione ao `.env.local` (nunca commite!):

```bash
# Database (já deve estar configurado)
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"

# Email (Brevo)
BREVO_API_KEY="sua-chave-de-api"
BREVO_SENDER_EMAIL="noreply@seu-dominio.com.br"

# Segurança
JOB_TOKEN="seu-token-aleatorio-de-32-caracteres"
```

### 1.2 Gerar JOB_TOKEN

```bash
# Gere um token criptograficamente seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copie o resultado e adicione a .env.local
JOB_TOKEN=seu-token-aqui
```

### 1.3 Chave Brevo

1. Acesse https://app.brevo.com/
2. Vá para **Settings → API Keys**
3. Copie sua chave (começa com `xsmtpsib-`)
4. Adicione a `.env.local`: `BREVO_API_KEY=xsmtpsib-...`

---

## 2️⃣ API Endpoint

### Endpoint

```
GET /api/internal/jobs/ras-checks
Authorization: Bearer {JOB_TOKEN}
```

### Response

```json
{
  "success": true,
  "timestamp": "2026-05-05T15:30:00.000Z",
  "results": {
    "expiredRasTransitioned": 5,
    "usersNotified": 3
  },
  "duration": "234ms"
}
```

---

## 3️⃣ Configurar Cron Job

Com Railway, use **Railway Crons** (nativo, sem serviços externos).

### Opção 1: Railway Crons ⭐ (Recomendado)

1. Painel Railway → seu projeto
2. **Variables** → Verifique `JOB_TOKEN`
3. **Crons** → Novo cron:
   - **Path**: `/api/internal/jobs/ras-checks`
   - **Schedule**: `0 * * * *` (a cada hora)

### Opção 2: EasyCron (Backup)

1. https://www.easycron.com/ → Add Cron Job
2. **URL**: `https://seu-dominio.com.br/api/internal/jobs/ras-checks`
3. **Cron**: `0 * * * *`
4. **Header**: `Authorization: Bearer {JOB_TOKEN}`

---

## 4️⃣ Teste Local

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Teste endpoint
curl -H "Authorization: Bearer dev-token-change-in-production" \
  http://localhost:3000/api/internal/jobs/ras-checks
```

---

## 5️⃣ Monitoramento

Logs aparecem em:
- **Desenvolvimento**: Terminal do `npm run dev`
- **Produção Railway**: Dashboard → Logs

Procure por:
```
[ras-expiry] RAS {id} transicionado: realizado → pendente
[ras-notify] Email enviado: {email} - {count} RAS
```

---

## 6️⃣ Troubleshooting

### Email não está sendo enviado
- ✅ Verifique `BREVO_API_KEY` em `.env.local`
- ✅ Teste chave: `curl -X POST https://api.brevo.com/v3/smtp/email ...`
- ✅ Verifique logs: `[mailer]`

### RAS não está transicionando
```sql
-- Verificar se expiresAt existe e expirou
SELECT id, status, expiresAt, (expiresAt <= NOW()) as expirou
FROM ras_agenda
WHERE status = 'realizado'
ORDER BY expiresAt
LIMIT 10;
```

### RAS a Receber mostra dados errados
```sql
-- Deve mostrar status = 'confirmado' de 30+ dias atrás
SELECT id, data, status, createdAt FROM ras_agenda
WHERE status = 'confirmado'
AND data <= CURRENT_DATE - INTERVAL '30 days'
AND deletadoEm IS NULL
LIMIT 10;
```

---

## 📋 Production Checklist

- [ ] `BREVO_API_KEY` configurado no Railway
- [ ] `BREVO_SENDER_EMAIL` configurado
- [ ] `JOB_TOKEN` seguro (32+ caracteres)
- [ ] Cron job criada (Railway Crons ou EasyCron)
- [ ] Testado: `curl` com Bearer token funciona
- [ ] Logs verificados (procure por `[ras-expiry]`)
- [ ] Email de teste enviado com sucesso
- [ ] Dados de teste no banco (RAS realizado com expiresAt expirada)
