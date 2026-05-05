# Setup: RAS 72h Auto-Transition e Notificações

## Visão Geral

Este documento descreve como configurar o sistema automático de transição de RAS após 72h e notificações de lembrança.

## Lógica

### Status Lifecycle
- `agendado` → `realizado` (policial realiza o RAS)
- `realizado` + `expiresAt` (72h a contar do INÍCIO do serviço)
- Após 72h expirar → `pendente` (automático, job hourly)
- `pendente` → `confirmado` (policial confirma recebimento)

### RAS a Receber
- **O que é**: RAS com status `confirmado` de ~30 dias atrás
- **Quando aparece**: Quando o RAS foi confirmado há mais de ~30 dias
- **Significado**: Será pago em breve (próximos dias)
- **Não é**: RAS com status pendente ou realizado

## API Endpoint

```
GET /api/internal/jobs/ras-checks
Authorization: Bearer {JOB_TOKEN}
```

**Response:**
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

## Configuração do JOB_TOKEN

1. Gere um token seguro (32+ caracteres):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Adicione ao `.env.local`:
   ```
   JOB_TOKEN=seu_token_aleatorio_aqui
   ```

3. Nunca commite o token no git — está no `.gitignore`

## Opções de Cron

### Opção 1: EasyCron (Recomendado)

1. Acesse https://www.easycron.com/
2. Faça login ou crie conta
3. Clique em "Add Cron Job"
4. Configure:
   - **URL**: `https://seu-dominio.com/api/internal/jobs/ras-checks`
   - **HTTP Method**: `GET`
   - **Cron Expression**: `0 * * * *` (a cada hora)
   - **Custom HTTP Headers**: 
     ```
     Authorization: Bearer {JOB_TOKEN}
     ```
   - **Timeout**: 120 segundos
5. Clique em "Create Cron Job"

### Opção 2: Cron Externo via curl/bash

Se você tem acesso a um servidor com cron:

```bash
# /etc/cron.d/meu-canga-ras-checks
# A cada hora
0 * * * * curl -H "Authorization: Bearer $JOB_TOKEN" https://seu-dominio.com/api/internal/jobs/ras-checks >> /var/log/meu-canga-ras.log 2>&1
```

### Opção 3: Vercel Crons (Futuro)

Quando Vercel Crons ficarem disponíveis em GA, adicione a `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/internal/jobs/ras-checks",
    "schedule": "0 * * * *"
  }]
}
```

## Monitoramento

### Logs do Job

O job escreve logs em stdout:
```
[ras-expiry] RAS {id} transicionado: realizado → pendente
[ras-expiry] 3 RAS expirado(s) processado(s)
[ras-notify] User notificado (xyz@email.com) tem 2 RAS aguardando confirmação
```

### Dashboard (Futuro)

Quando houver dashboard de admin:
- Ver histórico de execuções de jobs
- Monitorar falhas
- Ver estatísticas de transições

## Notificações (TODO)

Atual: Sistema apenas registra que notificações deveriam ser enviadas (logs).

Para implementar email/push notifications:

1. Adicione mailer service (ex: Resend, SendGrid, etc)
2. Implemente `sendRasConfirmationReminder()` em `src/server/jobs/ras-expiry.ts`
3. Configure credenciais em `.env.local`

Exemplo com Resend:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendRasConfirmationReminder(email: string, name: string, ras: RasItem[], hoursRemaining: number) {
  await resend.emails.send({
    from: 'noreply@meu-canga.com',
    to: email,
    subject: `⏰ RAS aguardando confirmação (${hoursRemaining}h)`,
    html: buildEmailTemplate(name, ras, hoursRemaining),
  });
}
```

## Testing

Para testar localmente:

```bash
# 1. Start dev server
npm run dev

# 2. Em outro terminal, teste o endpoint
curl -H "Authorization: Bearer dev-token-change-in-production" \
  http://localhost:3000/api/internal/jobs/ras-checks

# 3. Verifique os logs
# Você deve ver: "[ras-expiry] Nenhum RAS expirado para processar" (se não houver RAS expired)
```

## Troubleshooting

### Job não está rodando

1. Verifique se `JOB_TOKEN` está configurado em `.env.local`
2. Verifique o histórico de execução no EasyCron
3. Teste o endpoint manualmente com `curl`
4. Verifique os logs da aplicação em produção

### RAS não está transicionando

1. Verifique se `expiresAt` está sendo setado quando RAS → realizado
2. Confira se `expiresAt <= now` está sendo calculado corretamente
3. Verifique se o job está sendo chamado (cheque logs)

### Falsa notificação de RAS a Receber

Se você vê "RAS a Receber" mas o RAS não deveria estar lá:

1. Verifique se `status = 'confirmado'`
2. Verifique se `data <= now - 30 dias`
3. Verifique se `deletadoEm IS NULL`

Query para debug:
```sql
SELECT id, data, status, createdAt FROM ras_agenda
WHERE userId = 'xxx'
AND status = 'confirmado'
AND deletadoEm IS NULL
ORDER BY data DESC
LIMIT 10;
```
