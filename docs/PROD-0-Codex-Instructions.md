# PROD-0 — Instruções para Codex

Você está atuando como engenheiro de software sênior full stack no projeto Meu Canga v2.

## Missão

Executar a auditoria geral de produto, segurança e readiness de produção do Meu Canga v2, sem fazer deploy nesta fase.

Base de referência:
- GitHub issue: `PROD-0 — Auditoria geral de produto e readiness sem deploy`
- Repositório: `jefersonjatoba/meu-canga-nextjs`

## Contexto atual

O produto já possui módulos principais funcionando e commitados:

- contas;
- lançamentos;
- categorias;
- cartão de crédito;
- faturas;
- parcelamento;
- pagamento de fatura;
- cancelamento seguro de compra;
- recorrências financeiras;
- metas financeiras;
- investimentos;
- dashboard;
- build, testes, TypeScript e Prisma verdes na última validação.

## Regras absolutas

Não fazer:

- não fazer deploy;
- não conectar domínio;
- não mexer em DNS;
- não criar nova feature;
- não alterar regra financeira;
- não alterar Prisma sem necessidade crítica;
- não criar migration;
- não versionar secrets;
- não alterar `.env` com valores reais;
- não expor `DATABASE_URL`, tokens, SMTP, Auth Secret ou qualquer segredo em logs/relatório;
- não criar integrações externas novas;
- não instalar biblioteca nova sem necessidade real.

Se encontrar problema crítico, documente e proponha correção antes de alterar código.

## Etapa 1 — Validação técnica obrigatória

Execute:

```powershell
git status
npx prisma migrate status
npx prisma generate
npm test
npx tsc --noEmit
npm run build
```

Se `npx prisma generate` falhar no Windows com `EPERM` em `query_engine-windows.dll.node`, fazer:

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .\node_modules\.prisma\client
npx prisma generate
```

Depois repetir:

```powershell
npm test
npx tsc --noEmit
npm run build
```

Registrar no relatório:

- resultado de cada comando;
- quantidade de tests;
- se build passou;
- se migrations estão sincronizadas;
- se houve EPERM e como foi resolvido.

## Etapa 2 — Auditoria de Git e secrets

Verificar:

```powershell
git status --short
git check-ignore -v .env
git check-ignore -v .env.local
```

Auditar arquivos versionados/alterados em busca de:

- `DATABASE_URL`;
- `AUTH_SECRET`;
- `NEXTAUTH_SECRET`;
- `JWT_SECRET`;
- `SMTP_PASS`;
- `BREVO`;
- `RESEND`;
- `API_KEY`;
- `SUPABASE_SERVICE_ROLE`;
- tokens;
- URLs Postgres com usuário/senha;
- qualquer credencial real.

Não exibir segredo no relatório. Apenas informar se encontrou ou não.

## Etapa 3 — Auditoria de variáveis de ambiente

Auditar:

- `.env.example`, se existir;
- documentação de ambiente, se existir;
- uso de `process.env` no projeto;
- configuração de Auth;
- configuração de Prisma;
- configuração de e-mail, se existir.

Entregar tabela com:

- variável;
- obrigatória para produção? sim/não;
- finalidade;
- existe em `.env.example`? sim/não;
- risco se ausente.

Não colocar valores reais.

## Etapa 4 — Auditoria de rotas públicas/protegidas

Listar e classificar rotas:

### Páginas principais

- `/`
- `/login` ou rota real equivalente;
- `/register` ou rota real equivalente;
- `/dashboard`
- `/dashboard/contas`
- `/dashboard/lancamentos`
- `/dashboard/cartoes`
- `/dashboard/recorrencias`
- `/dashboard/metas`
- `/dashboard/investimentos`

### APIs principais

- `/api/contas`
- `/api/lancamentos`
- `/api/categorias`
- `/api/cartao/faturas`
- `/api/cartao/compras`
- `/api/recorrencias`
- `/api/metas`
- `/api/investimentos/ativos`

Para cada uma, indicar:

- pública ou protegida;
- método principal;
- usa autenticação server-side?;
- usa `userId` da sessão?;
- aceita `userId` do client? deve ser não;
- risco identificado.

Testar APIs protegidas sem sessão quando possível. Resultado esperado: `401`.

## Etapa 5 — Auditoria de isolamento por usuário

Auditar services/repositories principais:

- contas;
- lançamentos;
- categorias;
- cartão/faturas;
- recorrências;
- metas;
- investimentos;
- dashboard.

Verificar:

- todas as queries filtram por `userId`;
- criação usa `userId` server-side;
- edição valida dono do recurso;
- cancelamentos/desativações validam dono do recurso;
- não há endpoint aceitando `userId` do client.

Classificar risco:

- crítico: vazamento/escrita entre usuários;
- médio: validação incompleta;
- baixo: melhoria de padronização.

## Etapa 6 — Auditoria de segurança e resiliência

Verificar:

- tratamento de erros sem stack trace no JSON;
- logs sem dados sensíveis;
- ausência/presença de rate limit;
- ausência/presença de CSRF relevante;
- proteção de rotas do dashboard;
- headers/security config, se existir;
- validação Zod nos endpoints sensíveis;
- sanitização básica de inputs textuais;
- limites de tamanho para strings;
- consistência de status (`confirmada`, `cancelada`, etc.).

Não implementar correções grandes agora. Documentar achados.

## Etapa 7 — Auditoria de banco, backup e migrations

Verificar:

- `prisma/schema.prisma`;
- `prisma/migrations`;
- `npx prisma migrate status`;
- se há modelos legados relevantes, como `Investimento` legado;
- se há migrations manuais;
- risco de drift;
- estratégia recomendada de backup antes do deploy.

Entregar recomendações:

- backup antes de produção;
- backup automático diário;
- teste de restore;
- ambiente staging separado do banco local/dev.

## Etapa 8 — Auditoria LGPD mínima

Verificar se existem ou faltam:

- página de Termos de Uso;
- Política de Privacidade;
- canal de suporte;
- exclusão de conta;
- exportação de dados;
- aviso sobre dados financeiros;
- retenção de dados;
- e-mail de contato/suporte.

Classificar como:

- bloqueador para beta público;
- aceitável para beta privado controlado;
- melhoria futura.

## Etapa 9 — E-mail transacional

Auditar se o projeto possui ou precisa de:

- e-mail de boas-vindas;
- recuperação de senha;
- verificação de e-mail;
- e-mail de suporte;
- remetentes profissionais;
- domínio autenticado para envio.

Não configurar provedor agora. Apenas documentar readiness.

## Etapa 10 — Teste manual autenticado

Não fingir que executou se não tiver sessão autenticada.

Se houver navegador logado disponível, testar:

1. criar conta normal;
2. criar conta `credit`;
3. criar lançamento receita;
4. criar lançamento despesa;
5. editar/excluir lançamento;
6. criar compra parcelada no cartão;
7. validar fatura;
8. pagar fatura;
9. cancelar compra elegível;
10. criar recorrência;
11. processar recorrência;
12. processar novamente e confirmar que não duplica;
13. criar meta;
14. registrar aporte;
15. cancelar aporte;
16. criar ativo de investimento;
17. registrar compra;
18. registrar venda;
19. cancelar operação;
20. validar dashboard.

Se não houver sessão autenticada disponível, registrar claramente:

- rotas carregaram?;
- APIs protegidas retornaram 401 sem sessão?;
- fluxo autenticado ficou pendente.

## Etapa 11 — Relatório final obrigatório

Entregar relatório estruturado com:

1. resumo executivo;
2. status dos comandos;
3. status de Git/secrets;
4. status de Prisma/migrations;
5. status de build;
6. status de rotas públicas/protegidas;
7. status de isolamento por `userId`;
8. riscos críticos;
9. riscos médios;
10. riscos baixos;
11. pendências de LGPD;
12. pendências de e-mail transacional;
13. pendências de backup/restore;
14. checklist de go-live;
15. decisão objetiva:
   - `apto para beta privado`,
   - `apto com ressalvas`,
   - ou `não apto`;
16. próximos passos priorizados.

## Critérios de severidade

### Crítico
Bloqueia deploy/beta:

- vazamento de segredo;
- API sem autenticação indevida;
- falha de isolamento por usuário;
- build quebrado;
- migration com drift;
- fluxo financeiro principal quebrado;
- dados sensíveis em log.

### Médio
Não bloqueia beta privado controlado, mas precisa corrigir antes de público:

- ausência de rate limit;
- LGPD incompleta;
- e-mail transacional incompleto;
- falta de backup automatizado;
- teste manual autenticado incompleto;
- mensagens de erro pouco amigáveis.

### Baixo
Refinamento:

- microcopy;
- UX;
- empty states;
- organização visual;
- logs de diagnóstico;
- documentação.

## Conclusão esperada

Não fazer deploy nesta fase.

A entrega final deve responder claramente:

> O Meu Canga v2 está pronto para beta privado? Se não, o que precisa ser corrigido primeiro?
