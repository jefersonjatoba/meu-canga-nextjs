Meu Canga - Prompt 2 para Claude Code
Fase 2: Consolidar lançamentos financeiros antes do Dashboard
Prompt para colar no Claude Code
# Meu Canga - Fase 2: Consolidar lançamentos financeiros antes do Dashboard
Você já executou a Fase 0/Fase 1 da migração do Meu Canga, criando documentação, helpers, finance engine, testes e migration de valores monetários de Float para Int em centavos.
Agora execute a Fase 2 com padrão de engenheiro full stack sênior de fintech.
Objetivo desta fase
Criar a base profissional do domínio de lançamentos financeiros no Next.js, sem implementar dashboard ainda.
O Dashboard só deverá ser iniciado depois que lançamentos, repository, service, validações e API estiverem funcionando com segurança.
Contexto técnico atual
•	docs/migration-plan.md
•	docs/legacy-map.md
•	docs/financial-rules.md
•	docs/ras-rules.md
•	docs/escala-rules.md
•	src/lib/money.ts
•	src/lib/dates.ts
•	src/lib/env.ts
•	src/server/engines/finance.engine.ts
•	tests/unit/finance.engine.test.ts
•	vitest.config.ts
•	migration SQL para Float -> Int em centavos
•	prisma/schema.prisma ajustado parcialmente
Diretriz principal
Não criar tela visual ainda, exceto se for necessário apenas para teste mínimo.
Nesta fase, foque em:
•	Prisma schema consistente
•	repository
•	service
•	schemas Zod
•	API routes
•	testes
•	isolamento por usuário
•	consistência financeira
Tarefas obrigatórias
1. Revisar o Prisma schema
Verifique se os modelos necessários para lançamentos estão consistentes. O domínio de lançamentos deve suportar no mínimo:
•	receita
•	despesa
•	RAS
•	aporte
•	resgate
•	transferência futura
•	parcelamento futuro
•	recorrência futura
•	categoria
•	conta
•	competência mensal
•	metadata JSON
•	status
•	source
Garanta que campos monetários estejam em centavos Int. Não usar Float para dinheiro.
valor Float
saldoAtual Float
valorAlvo Float
valorAtual Float
precoMedio Float
precoAtual Float
Substitua por nomes consistentes já adotados no projeto, por exemplo:
valorCentavos Int
saldoAtualCentavos Int
valorAlvoCentavos Int
valorAtualCentavos Int
precoMedioCentavos Int
precoAtualCentavos Int?
2. Criar schemas Zod de lançamentos
src/features/lancamentos/schemas.ts
Com schemas para criação, atualização e filtros/listagem de lançamentos.
Campos mínimos:
•	descricao
•	tipo
•	valorCentavos
•	data
•	contaId
•	categoria
•	competencia
•	status
•	source
•	metaJson
Validações obrigatórias: descrição obrigatória; valor maior que zero; tipo permitido; data válida; usuário nunca deve vir do client body; userId deve vir da sessão/autenticação no server.
3. Criar types de lançamentos
src/features/lancamentos/types.ts
Definir tipos/DTOs usados pela API e pelo frontend:
•	LancamentoDTO
•	CreateLancamentoInput
•	UpdateLancamentoInput
•	LancamentoFilters
•	LancamentoSummaryDTO
4. Criar repository Prisma
src/server/repositories/lancamento.repository.ts
O repository deve conter apenas acesso ao Prisma. Funções mínimas:
•	createLancamento
•	updateLancamento
•	deleteLancamento
•	findLancamentoById
•	listLancamentosByUser
•	listLancamentosByMonth
•	getLancamentosForFinancialSnapshot
Regras obrigatórias: toda query deve filtrar por userId; nunca retornar lançamento de outro usuário; update/delete devem validar userId; nada de regra financeira complexa aqui; repository não deve importar componente React; repository não deve formatar BRL; repository não deve acessar request/response.
5. Criar service de lançamentos
src/server/services/lancamento.service.ts
O service deve orquestrar validação, repository e finance engine. Funções mínimas:
•	createLancamentoForUser
•	updateLancamentoForUser
•	deleteLancamentoForUser
•	listLancamentosForUser
•	getLancamentosSummaryForUser
Regras: validar input com Zod; garantir que dinheiro está em centavos; garantir isolamento por usuário; chamar finance.engine.ts para resumo; preparar DTO limpo para API.
6. Criar API routes
src/app/api/lancamentos/route.ts
src/app/api/lancamentos/[id]/route.ts
Endpoints:
GET /api/lancamentos
POST /api/lancamentos
PATCH /api/lancamentos/:id
DELETE /api/lancamentos/:id
GET deve aceitar filtros:
?mes=2026-04
?tipo=income
?contaId=
?categoria=
POST/PATCH devem validar com Zod. DELETE deve apagar apenas se o lançamento pertencer ao usuário autenticado.
Importante sobre autenticação
Se a autenticação ainda não estiver consolidada, crie uma função provisória central:
src/server/auth/get-current-user.ts
Ela deve concentrar a leitura do usuário atual. Não espalhe lógica de sessão por várias APIs.
Se ainda houver dúvida entre Supabase e NextAuth, documente o risco e use uma abstração única:
getCurrentUserId()
Assim, no futuro podemos trocar a implementação sem mudar todos os services.
7. Testes
tests/unit/lancamento.service.test.ts
Cobrir:
•	cria receita válida
•	cria despesa válida
•	rejeita valor zero
•	rejeita tipo inválido
•	update não altera lançamento de outro usuário
•	delete não apaga lançamento de outro usuário
•	resumo chama corretamente finance engine
•	filtros por mês funcionam na camada service/repository, se viável
Se testes com Prisma real forem pesados, mockar repository no service.
8. Não fazer nesta fase
•	Não implementar dashboard
•	Não implementar UI completa
•	Não implementar cartão de crédito ainda
•	Não implementar parcelamento completo ainda
•	Não implementar RAS completo ainda
•	Não mexer em landing page
•	Não criar nova arquitetura paralela se já houver estrutura criada
9. Resultado esperado
Ao final, entregue:
1.	resumo do que foi feito
2.	arquivos criados
3.	arquivos alterados
4.	decisões arquiteturais
5.	riscos encontrados
6.	comandos para rodar lint, testes, prisma migrate e dev server
7.	próximos passos sugeridos
10. Critérios de aceite
A fase só estará concluída se:
•	não houver dinheiro em Float nos modelos financeiros principais
•	finance.engine.ts continuar passando nos testes
•	existir repository de lançamentos
•	existir service de lançamentos
•	existirem schemas Zod
•	existirem API routes GET/POST/PATCH/DELETE
•	o usuário autenticado for centralizado
•	update/delete forem protegidos por userId
•	nenhum dashboard for implementado antes da base financeira
Observação estratégica
Esta fase é propositalmente conservadora. O Dashboard deve ser construído somente depois que o domínio de lançamentos estiver sólido, porque qualquer card financeiro, gráfico ou projeção depende de dados confiáveis e regras centralizadas.
