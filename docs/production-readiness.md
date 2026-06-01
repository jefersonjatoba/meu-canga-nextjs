# Production Readiness Checklist

## Objetivo
Checklist operacional para publicar o `Meu Cangá` com os fluxos mais sensíveis já endurecidos: autenticação, pagamentos, jobs internos, painel HQ e regras financeiras.

## 1. Variáveis obrigatórias
Sem estas variáveis, partes críticas do sistema ficam indisponíveis por segurança:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY` (se o menu Agente IA estiver habilitado)
- `ANTHROPIC_MODEL` (opcional, com default seguro)
- `JOB_TOKEN`
- `ADMIN_SECRET`
- `ADMIN_USER`
- `ADMIN_PASS`

## 2. Pagamentos e assinatura PRO
- Confirmar que `MP_WEBHOOK_SECRET` em produção é o mesmo configurado no webhook do Mercado Pago.
- Garantir que a URL pública do webhook aponta para `/api/webhook/mercadopago`.
- Validar um pagamento real de sandbox com status `approved`.
- Validar retry do mesmo webhook e confirmar que não cria assinatura duplicada.
- Revisar `paymentRef` no banco antes do go-live.
  - Recomendação futura: migration com unicidade por `source + paymentRef`.

## 3. Jobs internos e automações
- Configurar `JOB_TOKEN` forte e exclusivo por ambiente.
- Validar chamada autenticada a `/api/internal/jobs/ras-checks`.
- Confirmar o agendador externo:
  - Vercel Cron, Railway cron ou EasyCron
  - Header `Authorization: Bearer <JOB_TOKEN>`
- Verificar timezone operacional do job.
  - Referência do produto: `America/Sao_Paulo`

## 4. Painel HQ / Admin
- Configurar `ADMIN_SECRET` forte e diferente do `AUTH_SECRET`.
- Configurar `ADMIN_USER` e `ADMIN_PASS` de produção.
- Confirmar que a rota reescrita do HQ está acessível apenas pelo caminho secreto.
- Testar login, expiração de cookie e logout do HQ.

## 5. Auth e cadastro
- Testar cadastro novo completo.
- Testar tentativa de cadastro com CPF duplicado.
- Confirmar que falha em Prisma não deixa usuário órfão no Supabase.
- Validar login, refresh de sessão e logout.

## 6. Banco e dados
- Executar migrations pendentes antes do deploy.
- Validar backup do PostgreSQL.
- Confirmar política de restore do ambiente.
- Rodar smoke check dos módulos críticos após migration:
  - Dashboard
  - Contas
  - Cartões / Faturas
  - Recorrências / Assinaturas
  - RAS
  - Metas
  - Escala

## 7. Emails e notificações
- Configurar `BREVO_API_KEY` e `BREVO_SENDER_EMAIL`.
- Validar envio real de lembrete/alerta de RAS.
- Monitorar bounce/rejeição no provedor.

## 8. Observabilidade mínima
- Capturar logs de:
  - webhook Mercado Pago rejeitado por assinatura
  - jobs internos desabilitados por env ausente
  - falha de rollback de cadastro Supabase
  - falhas de processamento de RAS
- Garantir retenção de logs por ambiente.
- Se possível, integrar monitoramento de erro centralizado.

## 9. Smoke test pós-deploy
- `Dashboard` abre sem erro.
- `Contas` e `Cartões` carregam valores coerentes.
- `Recorrências` e `Assinaturas` processam sem duplicidade.
- `RAS a receber` mostra apenas itens confirmados e não pagos integralmente.
- `Escala` carrega calendário, agenda e modais.
- `Metas` cria, aporta e filtra normalmente.

## 10. Comandos de validação local antes do release
```bash
npm run build
npm run lint
npm test
```

## 11. Pendências aceitáveis para depois do release
- Migration de unicidade para `paymentRef`.
- Monitoramento centralizado de erro, se ainda não houver.
- Endurecimento extra de warnings remanescentes do ecossistema React/Compiler, se surgirem novos.
