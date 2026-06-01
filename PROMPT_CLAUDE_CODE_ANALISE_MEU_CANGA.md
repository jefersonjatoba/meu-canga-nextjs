# Prompt para Claude Code - Analise completa do Meu Canga Next.js

Use este prompt no Claude Code dentro da raiz do projeto:

```text
Voce esta analisando o repositorio `jefersonjatoba/meu-canga-nextjs`, no workspace local do projeto `meu-canga-nextjs`.

Objetivo:
Fazer uma auditoria completa do estado atual do projeto, explicar o que ja existe, o que parece em andamento, o que falta para beta privado/producao, quais riscos tecnicos existem e qual deve ser a ordem de proximos passos.

Contexto importante:
- Este projeto e um SaaS financeiro para profissionais de seguranca publica, com foco em RAS, escala, financas pessoais, cartoes, investimentos, metas, recorrencias, assinaturas, admin/HQ, indicacoes e assistente IA.
- Stack atual vista no `package.json`: Next.js 16.2.4, React 19.2.4, TypeScript, Prisma 5.9, PostgreSQL/Supabase, NextAuth v5 beta, Tailwind 4, Vitest, Recharts, Mercado Pago, Brevo e Anthropic.
- Existe um `AGENTS.md` dizendo que este Next.js tem mudancas importantes e que, antes de alterar codigo, voce deve consultar a documentacao relevante em `node_modules/next/dist/docs/`.
- Nao exponha secrets. Nunca imprima valores reais de `.env`, `.env.local`, `DATABASE_URL`, tokens, service role keys, chaves de email, Mercado Pago, Anthropic ou admin.
- Nao faca deploy, nao mexa em DNS, nao crie migrations nem altere regras financeiras sem justificar antes.
- A arvore local esta muito diferente do remoto: branch `main` esta 39 commits a frente de `origin/main` e ha muitas alteracoes nao commitadas, arquivos deletados e arquivos novos. Trate o estado local como a fonte principal.

Resumo da varredura feita antes deste prompt:
- Git:
  - `main...origin/main [ahead 39]`.
  - Muitos arquivos modificados, muitos docs antigos deletados e muitos modulos novos ainda untracked.
  - Foram removidos localmente varios arquivos antigos de auditoria/prompt/status na raiz.
  - Foram adicionados modulos novos como admin/HQ, agente IA, assinaturas/cartao, fatura, cotacoes, planos/subscription, referral, cron de emails, paginas SEO/landing e docs de production readiness.
- Estrutura:
  - `app/api` possui cerca de 78 route handlers.
  - `src/features` inclui: agente-ia, assinaturas, cartao, categorias, contas, dashboard, escala, investimentos, lancamentos, metas, ras e recorrencias.
  - `tests` possui 14 arquivos de teste.
  - Contagem aproximada em app/src/tests/docs/prisma: 191 arquivos `.ts`, 158 `.tsx`, 11 `.md`, 1 `.prisma`, 1 `.json`.
- Validacoes ja executadas:
  - `npx prisma validate`: passou, schema valido.
  - `npm test`: passou, 14 arquivos e 215 testes.
  - `npm run lint`: passou sem output de erro.
  - `npm run build`: passou com Next.js 16/Turbopack.
  - `npx tsc --noEmit`: falhou quando rodado isoladamente por `.next/types/validator.ts` nao encontrar `./routes.js`; o `next build` depois passou e regenerou/validou TypeScript no fluxo do Next.
  - `npx prisma migrate status`: falhou com `Schema engine error`, aparentemente por acesso/conexao ao banco/engine, sem indicar drift confirmado.
- Observacao critica do build:
  - O build passou, mas durante a geracao estatica algumas paginas fizeram chamadas Prisma e logaram falha de conexao com o banco. Investigue paginas admin/dashboard que consultam banco em build-time e verificam fallback silencioso.
- Docs principais lidos:
  - `docs/architecture.md`: descreve produto, ICP, planos Free/Pro, modulos RAS/Escala/Dashboard/Investimentos, regras criticas e integracoes.
  - `docs/business-rules.md`: regras de plano, auth, lancamentos, RAS, escala, metas, pagamentos e IA.
  - `docs/production-readiness.md`: checklist de variaveis, pagamentos, jobs, admin, auth, banco, email, observabilidade e smoke test.
  - `docs/PROD-0-Codex-Instructions.md`: roteiro detalhado de auditoria sem deploy.
  - `docs/migration-plan.md`: esta parcialmente desatualizado, ainda marca fases como pendentes embora muitas parecam implementadas.
  - `docs/endpoints.md`: parece desatualizado em partes, cita Next.js 14 e rotas antigas/diferentes das rotas reais atuais.
- Variaveis de ambiente observadas:
  - `.env` e `.env.local` estao ignorados por `.gitignore`.
  - `.env.example` contem placeholders para DATABASE_URL, Supabase, Auth, Mercado Pago, Anthropic, Brevo, CRON_SECRET, JOB_TOKEN, ADMIN_PATH, ADMIN_USER, ADMIN_PASS, ADMIN_SECRET e BRAPI_TOKEN.
  - Uso real de `process.env` aparece em webhook Mercado Pago, referral, crons, register/auth, mailer, assistente IA, jobs internos, HQ auth, Supabase/API auth, Prisma, fila RAS/Redis e proxy.
- Pontos de atencao ja encontrados:
  - Documentacao esta divergente do codigo atual em alguns pontos.
  - Build acessa Prisma durante geracao estatica e registra erros de conexao, embora finalize com sucesso.
  - Rate limiting atual no `proxy.ts` e em memoria; para multi-instancia/producao precisa estrategia persistente.
  - `serverErrorResponse` loga erro bruto em `src/lib/api-auth.ts`; auditar se isso pode imprimir dado sensivel em producao.
  - Ha `console.log` em webhooks, crons, fila RAS, mailer e scripts; revisar dados sensiveis e nivel de log.
  - Ha um modelo legado `Investimento` alem dos modelos novos `InvestimentoAtivo`/`InvestimentoOperacao`; avaliar se ainda e usado.
  - `README.md` parece estar corrompido/zerado ou com conteudo invalido ao ler pelo terminal; verificar encoding/conteudo.

Tarefas para voce executar:
1. Comece com uma leitura orientada:
   - `AGENTS.md`
   - `package.json`
   - `prisma/schema.prisma`
   - `docs/architecture.md`
   - `docs/business-rules.md`
   - `docs/production-readiness.md`
   - `docs/PROD-0-Codex-Instructions.md`
   - `docs/migration-plan.md`
   - `docs/endpoints.md`
   - `proxy.ts`
   - `src/lib/api-auth.ts`
   - `src/lib/hq-auth.ts`
2. Mapeie a aplicacao real, nao apenas os docs:
   - Liste paginas em `app/`.
   - Liste APIs em `app/api/`.
   - Liste features em `src/features/`.
   - Liste services, repositories e engines em `src/server/`.
   - Liste testes existentes em `tests/`.
3. Compare documentacao vs codigo:
   - Aponte docs atualizados.
   - Aponte docs desatualizados.
   - Aponte rotas documentadas que nao existem.
   - Aponte rotas existentes que nao estao documentadas.
4. Audite estado de produto por modulo:
   - Auth/cadastro/login
   - Dashboard
   - Contas
   - Lancamentos
   - Categorias
   - Cartao/faturas/assinaturas
   - Recorrencias
   - Metas
   - RAS
   - Escala
   - Investimentos/cotacoes
   - Planos/subscription/Mercado Pago
   - Admin/HQ
   - Referral/indicacoes
   - Emails/crons/jobs
   - Agente IA
   - Paginas publicas/SEO/landing
5. Audite riscos tecnicos:
   - Build-time DB access indevido.
   - Rotas publicas/protegidas.
   - Isolamento por usuario via `userId` server-side.
   - Endpoints que aceitam `userId` do client.
   - Logs com risco de dados sensiveis.
   - Rate limit e CSRF.
   - Consistencia de valores monetarios em centavos.
   - Consistencia de timezone America/Sao_Paulo.
   - Prisma migrations e possivel drift.
   - Variaveis obrigatorias e lacunas do `.env.example`.
   - LGPD minima: termos, privacidade, exportacao/exclusao de dados, suporte.
6. Rode validacoes, se o ambiente permitir:
   - `git status --short --branch`
   - `npx prisma validate`
   - `npx prisma migrate status`
   - `npm test`
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
   - Se algum comando falhar por ambiente/conexao, registre como bloqueado e explique exatamente o motivo sem inventar resultado.
7. Entregue um relatorio final em portugues com:
   - Resumo executivo.
   - Estado atual do repositorio.
   - Mapa dos modulos existentes.
   - O que parece concluido.
   - O que esta em andamento.
   - O que falta.
   - Riscos criticos, medios e baixos.
   - Pendencias documentais.
   - Pendencias de producao/beta privado.
   - Validacoes executadas e resultados.
   - Proximos passos priorizados em ordem objetiva.
   - Decisao: `apto para beta privado`, `apto com ressalvas` ou `nao apto`.

Formato desejado:
- Seja direto, mas completo.
- Use caminhos de arquivos com linhas quando citar achados.
- Nao exponha secrets.
- Separe fatos verificados de inferencias.
- Nao altere codigo automaticamente; se encontrar problema critico, proponha correcao antes.
```

