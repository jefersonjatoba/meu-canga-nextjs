# Meu Canga — Fase 6A: Edição e Exclusão Avançada de Lançamentos

Você atuará como engenheiro full stack sênior, com padrão técnico de bancos digitais, fintechs e SaaS financeiros.

As Fases 0, 1, 2, 3, 4, 5 e a correção de segurança já foram concluídas.

## Estado atual

O projeto já possui:

- base Next.js/React/TypeScript;
- Prisma com valores monetários em centavos;
- `finance.engine.ts` testada;
- domínio de lançamentos com repository, service, schemas e API;
- Dashboard com dados reais;
- Dashboard visual fintech premium;
- tela `/dashboard/lancamentos` com UI completa;
- criação de receita/despesa;
- `MoneyInput` reutilizável;
- lista de lançamentos;
- filtros por mês e tipo;
- exclusão simples com `window.confirm`;
- `.claude/` e `.env.local` fora do versionamento;
- `npm test` passando;
- `npx tsc --noEmit` sem erros.

## Objetivo desta fase

Fechar o CRUD básico de lançamentos com padrão profissional:

- editar lançamento existente;
- reaproveitar o formulário atual;
- abrir modal com dados preenchidos;
- enviar `PATCH /api/lancamentos/:id`;
- melhorar confirmação de exclusão;
- melhorar feedback visual de sucesso/erro;
- atualizar lista e resumo após edição/exclusão;
- manter Dashboard funcionando.

Esta fase deve transformar o módulo de lançamentos em um fluxo operacional confiável.

## Ponto de atenção obrigatório

Esta fase deve ficar estritamente limitada ao **CRUD visual e operacional de lançamentos**.

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
- Lançamento service/repository, salvo ajuste mínimo estritamente necessário para compatibilizar `PATCH` ou retorno de DTO.

Não faça alterações estruturais fora do escopo sem justificar claramente.

O foco desta fase é:

```txt
/dashboard/lancamentos
componentes de lançamentos
edição via modal
PATCH /api/lancamentos/:id
confirmação profissional de exclusão
feedback visual
refetch após update/delete

Diretriz principal

Não alterar regra financeira.

Não alterar finance.engine.ts.

Não alterar Prisma schema ou migrations.

Não criar lógica financeira complexa no React.

A UI deve consumir as APIs já existentes:

GET /api/lancamentos
POST /api/lancamentos
PATCH /api/lancamentos/:id
DELETE /api/lancamentos/:id
GET /api/lancamentos?summary=1
Antes de implementar

Execute:

git status
npm test
npx tsc --noEmit

Se houver erro, corrija antes de iniciar.

Não versionar arquivos sensíveis.

Tarefa 1 — Auditar implementação atual

Analise os arquivos atuais:

src/features/lancamentos/api.ts
src/features/lancamentos/components/LancamentoForm.tsx
src/features/lancamentos/components/LancamentoModal.tsx
src/features/lancamentos/components/LancamentoItem.tsx
src/features/lancamentos/components/LancamentosList.tsx
src/app/dashboard/lancamentos/page.tsx
src/app/api/lancamentos/[id]/route.ts
src/features/lancamentos/types.ts
src/features/lancamentos/schemas.ts

Confirme:

formato do DTO retornado na listagem;
campos aceitos em PATCH;
campos usados pelo LancamentoForm;
como o refetch atual funciona;
como a exclusão atual funciona.

Não inventar campos fora do schema atual.

Tarefa 2 — Evoluir src/features/lancamentos/api.ts

Adicionar, se ainda não existir:

updateLancamento(id, input)

A função deve chamar:

PATCH /api/lancamentos/:id

Regras:

nunca enviar userId;
enviar apenas campos aceitos pelo backend;
tratar erro com mensagem clara;
retornar o lançamento atualizado ou resposta padronizada.

Verificar se deleteLancamento(id) já está adequado.

Tarefa 3 — Reaproveitar LancamentoForm para criação e edição

Atualizar:

src/features/lancamentos/components/LancamentoForm.tsx

O formulário deve suportar dois modos:

mode?: 'create' | 'edit'
initialData?: LancamentoDTO

Ou nomes equivalentes, mantendo clareza.

No modo create:

comportamento atual preservado;
chama createLancamento;
botão pode dizer “Salvar lançamento”.

No modo edit:

campos devem vir preenchidos;
tipo deve vir preenchido;
descrição deve vir preenchida;
valor deve vir convertido de centavos para exibição em reais;
data deve vir no formato YYYY-MM-DD;
categoria deve vir preenchida;
conta deve vir preenchida, se existir;
status deve vir preenchido;
chama updateLancamento;
botão deve dizer “Atualizar lançamento”.

Regras importantes:

não duplicar dois formulários diferentes;
reaproveitar o mesmo MoneyInput;
não criar validação paralela conflitante;
manter react-hook-form + zodResolver;
continuar convertendo valor para centavos antes de enviar;
nunca enviar userId.
Tarefa 4 — Evoluir LancamentoModal

Atualizar:

src/features/lancamentos/components/LancamentoModal.tsx

O modal deve suportar:

criação;
edição.

Props sugeridas:

type LancamentoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: LancamentoDTO
  contas: ContaOption[]
  defaultTipo?: 'income' | 'expense'
  onSuccess: () => void
}

Ou estrutura equivalente.

O título do modal deve mudar:

“Novo lançamento” no modo criação;
“Editar lançamento” no modo edição.

Após sucesso:

fechar modal;
limpar estado;
chamar onSuccess;
atualizar lista/resumo.
Tarefa 5 — Adicionar ação de editar em LancamentoItem

Atualizar:

src/features/lancamentos/components/LancamentoItem.tsx

Cada lançamento deve ter ação de editar.

Pode ser:

botão com ícone;
menu simples;
botão discreto “Editar”.

Requisitos:

acessível;
não poluir visualmente;
bom comportamento mobile;
chamar callback onEdit(lancamento).

Não implementar edição inline.

Tarefa 6 — Melhorar exclusão

A exclusão atual usa window.confirm.

Substituir por uma confirmação mais profissional.

Criar, se fizer sentido:

src/features/lancamentos/components/DeleteLancamentoDialog.tsx

Ou usar Radix Dialog já disponível.

A confirmação deve mostrar contexto:

descrição do lançamento;
valor formatado;
data;
aviso de que a ação não pode ser desfeita.

Texto sugerido:

Excluir lançamento?
Você está prestes a excluir “{descricao}” no valor de {valor}.
Essa ação não pode ser desfeita.

Botões:

Cancelar;
Excluir lançamento.

A exclusão deve:

chamar DELETE /api/lancamentos/:id;
exibir feedback;
atualizar lista/resumo;
não afetar outros usuários.
Tarefa 7 — Feedback visual de sucesso/erro

Implementar feedback simples e profissional para:

lançamento criado;
lançamento atualizado;
lançamento excluído;
erro ao salvar;
erro ao excluir.

Se já houver componente de Toast no projeto, usar.

Se não houver, criar um feedback local simples na página de lançamentos, sem adicionar biblioteca nova.

Não instalar biblioteca nova.

Tarefa 8 — Atualizar página /dashboard/lancamentos

Atualizar:

src/app/dashboard/lancamentos/page.tsx

A página deve controlar:

modal de criação;
modal de edição;
lançamento selecionado para edição;
confirmação de exclusão, se centralizada;
refetch após create/update/delete;
feedback visual.

Manter filtros e listagem existentes.

Após editar ou excluir, atualizar:

lista;
resumo mensal;
estado vazio, se aplicável.
Tarefa 9 — Garantir integração com Dashboard

Após editar/excluir lançamento, ao voltar para /dashboard, os cards devem refletir os dados atualizados.

Se houver cache, usar revalidação simples.

Não criar solução complexa de cache nesta fase.

Tarefa 10 — Testes e validação

Obrigatório garantir:

npm test
npx tsc --noEmit

Se alterar types ou schemas, atualizar testes existentes.

Se for viável, adicionar teste simples para helper/API mockado, mas não é obrigatório se a fase for majoritariamente UI.

Não usar banco real em teste unitário.

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
refatoração global de layout;
nova tela de contas;
nova tela de categorias.

Não alterar secrets.

Não versionar prompts locais.

Não mexer em migrations.

Não mexer em Prisma schema.

Não mexer em Dashboard Service.

Não mexer em Finance Engine.

Critérios de aceite

A Fase 6A só estará concluída se:

usuário conseguir editar lançamento existente;
modal de edição abrir com dados preenchidos;
PATCH /api/lancamentos/:id for usado;
criação continuar funcionando;
exclusão tiver confirmação profissional;
lista atualizar após edição;
lista atualizar após exclusão;
resumo mensal atualizar após edição/exclusão;
Dashboard continuar funcionando;
nenhum userId for enviado pelo client;
valores monetários continuarem em centavos;
npm test passar;
npx tsc --noEmit passar;
git status não mostrar arquivos sensíveis rastreados;
nenhuma alteração fora de escopo tiver sido feita sem justificativa clara.
Resultado esperado ao final

Ao terminar, entregue:

arquivos criados;
arquivos alterados;
resumo da edição implementada;
resumo da exclusão melhorada;
decisões de UX;
confirmação do que não foi alterado;
resultado de npm test;
resultado de npx tsc --noEmit;
como testar localmente;
próximos passos sugeridos.
Próximo passo após esta fase

Se esta fase ficar estável, a próxima poderá ser:

Fase 6B — Categorias e contas na UI
Fase 6C — Parcelamento e cartão de crédito
Fase 6D — Integração RAS no Dashboard
Fase 6E — Integração Escala/Próximo Plantão no Dashboard

A escolha deve depender do estado do produto após testar o CRUD completo de lançamentos.