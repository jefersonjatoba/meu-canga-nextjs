# Meu Canga — Fase 6B: Categorias e Contas na UI

Você atuará como engenheiro full stack sênior, com padrão técnico de bancos digitais, fintechs e SaaS financeiros.

As Fases 0, 1, 2, 3, 4, 5, 6A e a correção de segurança já foram concluídas.

## Estado atual

O projeto já possui:

- base Next.js/React/TypeScript;
- Prisma com valores monetários em centavos;
- `finance.engine.ts` testada;
- domínio de lançamentos com repository, service, schemas e API;
- Dashboard com dados reais;
- Dashboard visual fintech premium;
- tela `/dashboard/lancamentos` com UI completa;
- criação, edição e exclusão de lançamentos;
- `MoneyInput` reutilizável;
- lista de lançamentos;
- filtros por mês e tipo;
- confirmação profissional de exclusão;
- feedback visual com toast;
- `.claude/` e `.env.local` fora do versionamento;
- `npm test` passando;
- `npx tsc --noEmit` sem erros.

## Objetivo desta fase

Criar a base visual e operacional para **Contas** e **Categorias** na UI, substituindo gradualmente dependências frágeis como categorias fixas no front e conta auto-criada sem gestão pelo usuário.

Esta fase deve permitir ao usuário:

- visualizar contas;
- criar conta;
- editar conta;
- desativar conta, se já houver suporte seguro;
- visualizar categorias;
- criar categoria;
- editar categoria;
- desativar categoria, se já houver suporte seguro;
- usar contas e categorias reais no formulário de lançamentos.

O objetivo é preparar o sistema para cartão de crédito, parcelamento, orçamento por categoria, relatórios e dashboard mais inteligente.

## Ponto de atenção obrigatório

Esta fase deve ficar estritamente limitada à **UI e API básica de Contas e Categorias**, além da integração dessas entidades no formulário de lançamentos.

Se durante a execução surgir necessidade de mexer em qualquer item abaixo, pare e informe no resumo antes de alterar:

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
- lógica financeira de cálculo;
- Lançamento service/repository, salvo ajuste mínimo estritamente necessário para consumir `categoryId`/`contaId` já suportados pelo schema/API.

Não faça alterações estruturais fora do escopo sem justificar claramente.

O foco desta fase é:

```txt
/dashboard/contas
/dashboard/categorias
GET/POST/PATCH de contas, se necessário
GET/POST/PATCH de categorias, se necessário
componentes de contas
componentes de categorias
integração do formulário de lançamentos com dados reais
loading/error/empty states

Diretriz principal

Não alterar regra financeira.

Não alterar finance.engine.ts.

Não alterar Prisma schema ou migrations, salvo se for absolutamente indispensável e justificado antes no resumo.

Não criar lógica financeira complexa no React.

Não criar cartão de crédito nesta fase.

Não criar orçamento/budget nesta fase.

Não adicionar bibliotecas novas sem necessidade.

Antes de implementar

Execute:

git status
npm test
npx tsc --noEmit

Se houver erro, corrija antes de iniciar.

Não versionar arquivos sensíveis.

Tarefa 1 — Auditar modelos, APIs e componentes existentes

Antes de criar UI, verifique:

prisma/schema.prisma
src/features/lancamentos/types.ts
src/features/lancamentos/schemas.ts
src/features/lancamentos/components/LancamentoForm.tsx
src/features/lancamentos/api.ts
src/app/api/contas/route.ts
src/app/api/lancamentos/route.ts
src/server/repositories/lancamento.repository.ts
src/server/services/lancamento.service.ts

Verifique se já existem modelos/rotas para:

Conta;
Categoria;
Category;
Account;
ContaOption;
CategoryOption.

Mapeie os nomes reais usados no projeto antes de implementar.

Não inventar nomes conflitantes.

Tarefa 2 — Contas: API básica

Se já existir GET /api/contas, preserve e evolua com cuidado.

Criar ou ajustar:

src/app/api/contas/route.ts
src/app/api/contas/[id]/route.ts

Endpoints desejados:

GET /api/contas
POST /api/contas
PATCH /api/contas/:id

DELETE só deve ser implementado se for seguro. Preferir desativação lógica usando ativa=false, se o schema já suportar.

Regras obrigatórias:

usuário vem da sessão/auth server;
nunca aceitar userId do client;
todas as queries filtram por userId;
não permitir editar conta de outro usuário;
não excluir/desativar conta se isso quebrar lançamentos existentes, salvo se houver regra segura;
retornar JSON padronizado;
tratar erros sem vazar stack trace.

Campos mínimos para conta:

nome
tipo
saldoAtualCentavos, se já existir
banco, se já existir
ativa, se já existir

Se o schema usar nomes diferentes, respeitar o schema atual.

Tarefa 3 — Categorias: API básica

Criar ou ajustar:

src/app/api/categorias/route.ts
src/app/api/categorias/[id]/route.ts

Endpoints desejados:

GET /api/categorias
POST /api/categorias
PATCH /api/categorias/:id

DELETE só deve ser implementado se for seguro. Preferir desativação lógica usando ativa=false, se o schema já suportar.

Regras obrigatórias:

usuário vem da sessão/auth server;
nunca aceitar userId do client;
todas as queries filtram por userId;
não permitir editar categoria de outro usuário;
categorias devem ter tipo: receita, despesa ou ambos, conforme schema atual;
retornar JSON padronizado;
tratar erros sem vazar stack trace.

Campos mínimos para categoria:

nome
tipo
icone, se já existir
cor, se já existir
ativa, se já existir
ordem, se já existir

Se o schema atual ainda usa categoria como string em lançamentos, não migrar banco nesta fase sem autorização. Nesse caso, criar uma camada de UI/API compatível e documentar a limitação.

Tarefa 4 — Criar types e schemas de Contas

Criar, se ainda não existir:

src/features/contas/types.ts
src/features/contas/schemas.ts
src/features/contas/api.ts

Schemas Zod mínimos:

createContaSchema
updateContaSchema

Validações:

nome obrigatório;
tipo obrigatório;
saldo inicial em centavos, se aplicável;
não aceitar userId no body;
limites de tamanho para strings.

Types mínimos:

ContaDTO
CreateContaInput
UpdateContaInput
ContaFilters
Tarefa 5 — Criar types e schemas de Categorias

Criar, se ainda não existir:

src/features/categorias/types.ts
src/features/categorias/schemas.ts
src/features/categorias/api.ts

Schemas Zod mínimos:

createCategoriaSchema
updateCategoriaSchema

Validações:

nome obrigatório;
tipo obrigatório;
não aceitar userId no body;
limites de tamanho para strings;
cor/ícone opcionais, se existirem.

Types mínimos:

CategoriaDTO
CreateCategoriaInput
UpdateCategoriaInput
CategoriaFilters
Tarefa 6 — Criar UI de Contas

Criar página:

src/app/dashboard/contas/page.tsx

Criar componentes:

src/features/contas/components/ContasHeader.tsx
src/features/contas/components/ContasList.tsx
src/features/contas/components/ContaItem.tsx
src/features/contas/components/ContaForm.tsx
src/features/contas/components/ContaModal.tsx
src/features/contas/components/ContasEmptyState.tsx

A página deve permitir:

listar contas;
criar conta;
editar conta;
desativar conta, se seguro;
exibir loading;
exibir erro;
exibir estado vazio;
evitar excluir dados financeiros de forma destrutiva.

Visual desejado:

limpo;
moderno;
coerente com dashboard e lançamentos;
responsivo;
sem aparência amadora;
sem excesso de animação.
Tarefa 7 — Criar UI de Categorias

Criar página:

src/app/dashboard/categorias/page.tsx

Criar componentes:

src/features/categorias/components/CategoriasHeader.tsx
src/features/categorias/components/CategoriasList.tsx
src/features/categorias/components/CategoriaItem.tsx
src/features/categorias/components/CategoriaForm.tsx
src/features/categorias/components/CategoriaModal.tsx
src/features/categorias/components/CategoriasEmptyState.tsx

A página deve permitir:

listar categorias;
criar categoria;
editar categoria;
desativar categoria, se seguro;
filtrar por tipo;
exibir loading;
exibir erro;
exibir estado vazio.

Visual desejado:

categorias com ícone/cor se suportado;
badge de tipo;
layout limpo e profissional;
responsivo.
Tarefa 8 — Integrar contas reais no formulário de lançamentos

Atualizar, se necessário:

src/features/lancamentos/components/LancamentoForm.tsx
src/features/lancamentos/api.ts
src/app/dashboard/lancamentos/page.tsx

Requisitos:

formulário deve carregar contas reais da API;
usuário deve poder selecionar conta;
se houver apenas uma conta, comportamento atual pode ser preservado;
se não houver conta, orientar criar conta ou auto-criar apenas se essa regra já estiver claramente implementada;
não enviar userId no body.

Não quebrar criação, edição ou exclusão de lançamentos.

Tarefa 9 — Integrar categorias reais no formulário de lançamentos

Substituir gradualmente categorias fixas hardcoded no front por categorias reais, se o schema/API permitir.

Requisitos:

carregar categorias da API;
filtrar categorias por tipo do lançamento;
se não houver categorias cadastradas, exibir fallback seguro ou orientar criar categoria;
não quebrar lançamentos existentes que usam categoria string;
manter compatibilidade com o backend atual.

Se a estrutura atual ainda não suporta categoryId, não forçar migration. Documentar a limitação e usar categoria como string selecionada a partir da categoria real.

Tarefa 10 — Sidebar/navegação

Se a sidebar já tiver Contas e Categorias, garantir que as rotas apontem para:

/dashboard/contas
/dashboard/categorias

Se não houver item de Categorias na sidebar, adicionar de forma discreta e consistente.

Não refatorar layout global profundamente.

Tarefa 11 — Feedback visual

Usar feedback visual para:

conta criada;
conta atualizada;
conta desativada;
categoria criada;
categoria atualizada;
categoria desativada;
erro de API.

Se já houver useToast ou padrão similar, reutilizar.

Não instalar biblioteca nova.

Tarefa 12 — Testes e validação

Obrigatório garantir:

npm test
npx tsc --noEmit

Se criar schemas Zod, adicionar testes unitários simples se for viável.

Não usar banco real em teste unitário.

Não fazer nesta fase

Não implementar:

cartão de crédito;
faturas;
parcelamento;
orçamento/budget;
RAS completo;
escala;
gráficos;
importação bancária;
assistente IA;
pagamento;
landing page;
refatoração global de layout;
exclusão destrutiva de contas/categorias com lançamentos associados.

Não alterar secrets.

Não versionar prompts locais.

Não mexer em migrations sem autorização clara.

Não mexer em Prisma schema sem necessidade real.

Não mexer em Dashboard Service.

Não mexer em Finance Engine.

Critérios de aceite

A Fase 6B só estará concluída se:

rota /dashboard/contas existir;
rota /dashboard/categorias existir;
usuário conseguir criar e editar conta;
usuário conseguir criar e editar categoria;
UI tiver loading/error/empty states;
formulário de lançamentos usar contas reais;
formulário de lançamentos usar categorias reais ou fallback documentado;
nenhum userId for enviado pelo client;
todas as APIs filtrarem por usuário;
não houver exclusão destrutiva insegura;
Dashboard continuar funcionando;
CRUD de lançamentos continuar funcionando;
npm test passar;
npx tsc --noEmit passar;
git status não mostrar arquivos sensíveis rastreados;
nenhuma alteração fora de escopo tiver sido feita sem justificativa clara.
Resultado esperado ao final

Ao terminar, entregue:

arquivos criados;
arquivos alterados;
resumo da UI de contas;
resumo da UI de categorias;
como as categorias foram integradas aos lançamentos;
como as contas foram integradas aos lançamentos;
decisões de UX;
confirmação do que não foi alterado;
resultado de npm test;
resultado de npx tsc --noEmit;
como testar localmente;
próximos passos sugeridos.
Próximo passo após esta fase

Se esta fase ficar estável, a próxima poderá ser:

Fase 6C — Parcelamento e cartão de crédito
Fase 6D — Integração RAS no Dashboard
Fase 6E — Integração Escala/Próximo Plantão no Dashboard
Fase 7 — Orçamentos por categoria e alertas inteligentes

A escolha deve depender do estado do produto após testar contas, categorias e lançamentos integrados.