# Meu Canga — Fase 5: Tela de Lançamentos com UI Completa

Você atuará como engenheiro full stack sênior, com padrão técnico de bancos digitais, fintechs e SaaS financeiros.

As Fases 0, 1, 2, 3, 4 e a correção de segurança já foram concluídas.

## Estado atual

O projeto já possui:

- base Next.js/React/TypeScript;
- Prisma com valores monetários em centavos;
- `finance.engine.ts` testada;
- domínio de lançamentos com repository, service, schemas e API;
- Dashboard com dados reais;
- Dashboard visualmente refinado em padrão fintech;
- `.claude/` e `.env.local` fora do versionamento;
- `npm test` passando;
- `npx tsc --noEmit` sem erros.

## Objetivo desta fase

Criar a tela de **Lançamentos** com UI completa e integrada à API real já existente.

A tela deve permitir ao usuário:

- visualizar lançamentos;
- filtrar por mês;
- criar receita;
- criar despesa;
- ver estado vazio;
- receber feedback visual de sucesso/erro;
- voltar ao Dashboard com dados atualizados.

Nesta fase, o foco é o fluxo financeiro básico. Não implementar parcelamento, cartão de crédito, recorrência completa, RAS completo ou edição avançada ainda.

## Ponto de atenção obrigatório

Esta fase deve ficar estritamente limitada à **UI de lançamentos integrada à API já existente**.

Se durante a execução surgir necessidade de mexer em qualquer um dos itens abaixo, pare e informe no resumo antes de alterar:

- Prisma schema;
- migrations;
- RAS;
- Escala;
- Cartão de crédito;
- Faturas;
- Pagamento;
- Auth;
- Dashboard service;
- Finance engine;
- Lançamento service/repository, salvo ajuste mínimo estritamente necessário para compatibilizar a UI.

Não faça alterações estruturais fora do escopo sem justificar claramente.

O foco desta fase é:

```txt
/dashboard/lancamentos
componentes de lançamentos
formulário de novo lançamento
MoneyInput
integração com GET/POST /api/lancamentos
loading/error/empty state

Diretriz principal

Não alterar regra financeira.

Não alterar finance.engine.ts.

Não alterar Prisma schema ou migrations.

Não criar lógica financeira no React.

A UI deve consumir as APIs/services existentes:

GET /api/lancamentos
POST /api/lancamentos
GET /api/lancamentos?summary=1
PATCH /api/lancamentos/:id
DELETE /api/lancamentos/:id
Antes de implementar

Execute:

git status
npm test
npx tsc --noEmit

Se houver erro, corrija antes de iniciar.

Não versionar arquivos sensíveis.

Tarefa 1 — Auditar rotas e serviços existentes

Antes de criar UI, verifique:

src/features/lancamentos/types.ts
src/features/lancamentos/schemas.ts
src/server/services/lancamento.service.ts
src/server/repositories/lancamento.repository.ts
src/app/api/lancamentos/route.ts
src/app/api/lancamentos/[id]/route.ts

Confirme quais campos são aceitos no POST /api/lancamentos.

Não inventar campos fora do schema atual.

Tarefa 2 — Criar página de Lançamentos

Criar ou ajustar:

src/app/dashboard/lancamentos/page.tsx

A página deve conter:

título “Lançamentos”;
subtítulo explicando o período;
botão “Novo lançamento”;
cards/resumo simples do mês, se já houver summary disponível;
filtros básicos;
lista de lançamentos;
empty state.

Se já existir rota diferente para lançamentos, respeitar a estrutura existente, mas manter compatibilidade com o botão atual do Dashboard que aponta para:

/dashboard/lancamentos
Tarefa 3 — Criar componentes da feature

Criar pasta:

src/features/lancamentos/components/

Componentes mínimos:

LancamentosHeader.tsx
LancamentosFilters.tsx
LancamentosList.tsx
LancamentoItem.tsx
LancamentoForm.tsx
LancamentoModal.tsx
LancamentosEmptyState.tsx
MoneyInput.tsx

Se já existirem componentes equivalentes, reutilizar/ajustar em vez de duplicar.

Tarefa 4 — Criar fluxo de novo lançamento

O usuário deve conseguir criar pelo menos:

receita;
despesa.

Campos mínimos do formulário:

tipo;
descrição;
valor;
data;
categoria, se o schema atual permitir;
conta, se o schema atual exigir ou permitir;
status, se necessário, com default seguro.

Validações:

descrição obrigatória;
valor obrigatório e maior que zero;
data obrigatória;
tipo deve ser permitido pelo schema;
nunca enviar userId no body.

Usar:

react-hook-form
zod
src/features/lancamentos/schemas.ts
src/lib/money.ts

Não criar nova validação paralela incompatível com o backend.

Tarefa 5 — MoneyInput

Criar MoneyInput.tsx reutilizável.

Requisitos:

entrada amigável em reais;
converter para centavos antes de enviar;
exibir máscara BRL ou formato simples consistente;
não usar Float para persistência;
não enviar valor negativo;
permitir uso futuro em RAS, metas e cartão.
Tarefa 6 — Consumo da API

Criar, se fizer sentido:

src/features/lancamentos/api.ts

Funções mínimas:

listLancamentos(params)
createLancamento(input)
deleteLancamento(id)

Pode usar fetch nativo.

Não adicionar biblioteca nova se não for necessário.

Tratar respostas:

loading;
sucesso;
erro;
vazio.
Tarefa 7 — Modal de lançamento

Criar modal para novo lançamento usando Radix Dialog, se já estiver disponível, ou componente modal existente.

O modal deve:

abrir pelo botão “Novo lançamento”;
fechar ao salvar com sucesso;
resetar formulário após sucesso;
atualizar a lista;
atualizar resumo se houver;
exibir erro sem quebrar tela.
Tarefa 8 — Lista de lançamentos

A lista deve exibir:

descrição;
tipo;
valor formatado;
data;
categoria se existir;
status se existir;
indicação visual para receita/despesa;
estado vazio profissional.

Não implementar edição inline nesta fase.

Exclusão pode ser implementada se já houver DELETE funcional, mas deve ter confirmação simples.

Tarefa 9 — Filtros

Filtros básicos:

mês atual por padrão;
seletor simples de mês;
tipo: todos, receitas, despesas.

Não implementar filtros avançados ainda.

Tarefa 10 — Integração com Dashboard

Após criar um lançamento, o Dashboard deve refletir os dados quando acessado novamente.

Se houver cache, garantir revalidação simples.

Não criar solução complexa de cache nesta fase.

Tarefa 11 — Testes e validação

Adicionar testes apenas se necessário para helpers/components simples.

Obrigatório garantir:

npm test
npx tsc --noEmit

Se alterar schemas/types, atualizar testes existentes.

Não fazer nesta fase

Não implementar:

parcelamento;
cartão de crédito;
faturas;
recorrência completa;
RAS completo;
escala;
gráficos;
importação bancária;
assistente IA;
pagamento;
landing page;
refatoração global de layout.

Não alterar secrets.

Não versionar prompts locais.

Não mexer em migrations.

Não mexer em Prisma schema.

Não mexer em Dashboard Service.

Não mexer em Finance Engine.

Critérios de aceite

A Fase 5 só estará concluída se:

rota /dashboard/lancamentos existir;
usuário conseguir criar receita;
usuário conseguir criar despesa;
lista usar API real;
formulário validar corretamente;
valores monetários forem tratados em centavos;
nenhum userId for enviado pelo client;
empty state existir;
loading/error state existir;
Dashboard continuar funcionando;
npm test passar;
npx tsc --noEmit passar;
git status não mostrar arquivos sensíveis rastreados;
nenhuma alteração fora de escopo tiver sido feita sem justificativa clara.
Resultado esperado ao final

Ao terminar, entregue:

arquivos criados;
arquivos alterados;
resumo da UI criada;
fluxo de criação de lançamento;
decisões de UX;
confirmação do que não foi alterado;
resultado de npm test;
resultado de npx tsc --noEmit;
como testar localmente;
próximos passos sugeridos.
Próximo passo após esta fase

Se esta fase ficar estável, a próxima poderá ser:

Fase 6A — Edição e exclusão avançada de lançamentos
Fase 6B — Categorias e contas na UI
Fase 6C — Parcelamento e cartão de crédito
Fase 6D — Integração RAS no Dashboard
Fase 6E — Integração Escala/Próximo Plantão no Dashboard