# Meu Canga — Fase 3: Dashboard Next.js com Dados Reais de Lançamentos

Você atuará como engenheiro full stack sênior, com padrão técnico de bancos digitais, fintechs e SaaS financeiros.

A Fase 0, Fase 1, Fase 2 e a correção de segurança já foram concluídas.

## Estado atual do projeto

O projeto está limpo e estável:

- `git status` limpo;
- branch `main` sincronizada com `origin/main`;
- senha antiga do banco foi rotacionada;
- `.claude/` foi removido do versionamento;
- `.claude/` está no `.gitignore`;
- `.env.local` está no `.gitignore`;
- `.env.example` contém apenas placeholders;
- `npm test` passa com 52/52 testes;
- `npx tsc --noEmit` passa sem erros;
- banco conectado com a nova `DATABASE_URL`;
- migrations aplicadas e banco em sync.

## Contexto técnico já implementado

A Fase 2 consolidou o domínio de lançamentos com:

- `src/server/auth/get-current-user.ts`
- `src/features/lancamentos/types.ts`
- `src/features/lancamentos/schemas.ts`
- `src/server/repositories/lancamento.repository.ts`
- `src/server/services/lancamento.service.ts`
- `app/api/lancamentos/route.ts`
- `app/api/lancamentos/[id]/route.ts`
- `tests/unit/lancamento.service.test.ts`
- `src/server/engines/finance.engine.ts`
- `tests/unit/finance.engine.test.ts`

Também já existem helpers importantes:

- `src/lib/money.ts`
- `src/lib/dates.ts`
- `src/lib/env.ts`
- `src/lib/prisma.ts`

## Objetivo desta fase

Criar o primeiro Dashboard financeiro em Next.js/React usando dados reais do domínio de lançamentos.

O Dashboard deve ser um **centro de comando financeiro inicial**, ainda sem implementar RAS completo, Escala completa, Cartão de Crédito, Faturas ou gráficos complexos.

Nesta fase, o objetivo é criar uma base sólida, limpa e escalável para depois evoluir visualmente.

## Diretriz principal

Não copiar HTML, CSS ou JavaScript do legado Node/Express.

Não colocar regra financeira dentro de componente React.

A regra financeira deve continuar centralizada em:

```txt
src/server/engines/finance.engine.ts
src/server/services/lancamento.service.ts

O Dashboard deve consumir DTOs prontos vindos de service/API.

Componentes React devem apenas renderizar dados.

Antes de implementar

Execute e confirme:

git status
npm test
npx tsc --noEmit

Se houver erro em testes ou TypeScript, corrija antes de criar o Dashboard.

Não use prisma migrate dev neste ambiente se o terminal não for interativo.

Se precisar validar migrations, use:

npx prisma migrate status

ou, se for realmente necessário aplicar migrations já existentes:

npx prisma migrate deploy
Tarefa 1 — Criar estrutura de Dashboard

Criar, se ainda não existir:

src/features/dashboard/types.ts
src/features/dashboard/components/
src/server/services/dashboard.service.ts

O dashboard.service.ts deve chamar os services/repositories já existentes e montar um DTO próprio para o Dashboard.

Criar função:

getDashboardSummaryForUser(userId: string, params: { mes?: string })

O parâmetro mes deve aceitar formato:

YYYY-MM

Exemplo:

2026-04

Se mes não for enviado, usar mês atual no timezone de São Paulo, preferencialmente reaproveitando src/lib/dates.ts.

Tarefa 2 — DTO do Dashboard

Criar um tipo principal em:

src/features/dashboard/types.ts

Com o DTO mínimo:

export type DashboardSummaryDTO = {
  periodo: string
  saldoOperacionalCentavos: number
  totalReceitasCentavos: number
  totalDespesasCentavos: number
  totalRasCentavos: number
  totalAportesCentavos: number
  totalResgatesCentavos: number
  patrimonioInvestidoCentavos: number
  taxaPoupancaPercentual: number
  lancamentosRecentes: LancamentoDTO[]
}

Se necessário, incluir campos auxiliares como:

periodoLabel: string
hasLancamentos: boolean

Mas evitar exageros nesta fase.

Tarefa 3 — Criar service do Dashboard

Criar:

src/server/services/dashboard.service.ts

Responsabilidades:

receber userId e mes;
buscar lançamentos do usuário pelo mês;
buscar lançamentos recentes do usuário;
chamar getLancamentosSummaryForUser ou service equivalente já existente;
usar finance.engine.ts quando necessário;
montar DashboardSummaryDTO;
nunca aceitar userId vindo do client;
nunca acessar request/response diretamente;
nunca formatar BRL dentro do service;
retornar números em centavos.

Exemplo conceitual:

export async function getDashboardSummaryForUser(
  userId: string,
  params: { mes?: string }
): Promise<DashboardSummaryDTO> {
  // validar mês
  // buscar summary financeiro
  // buscar lançamentos recentes
  // retornar DTO
}
Tarefa 4 — Criar API route do Dashboard

Criar:

src/app/api/dashboard/summary/route.ts

Endpoint:

GET /api/dashboard/summary?mes=2026-04

Regras obrigatórias:

usuário vem de getCurrentUserId() ou abstração atual equivalente;
nunca aceitar userId do client;
retornar JSON padronizado;
tratar usuário não autenticado com 401;
tratar erro de validação com 400;
tratar erro interno com 500 sem vazar stack trace;
não duplicar lógica financeira dentro da route.

Resposta esperada:

{
  "ok": true,
  "data": {
    "periodo": "2026-04",
    "saldoOperacionalCentavos": 0,
    "totalReceitasCentavos": 0,
    "totalDespesasCentavos": 0,
    "totalRasCentavos": 0,
    "totalAportesCentavos": 0,
    "totalResgatesCentavos": 0,
    "patrimonioInvestidoCentavos": 0,
    "taxaPoupancaPercentual": 0,
    "lancamentosRecentes": []
  }
}
Tarefa 5 — Criar página Dashboard

Criar ou ajustar:

src/app/dashboard/page.tsx

ou, se o projeto usa route groups:

src/app/(app)/dashboard/page.tsx

A página deve renderizar:

cabeçalho com título;
subtítulo com período atual;
card de saldo operacional;
card de receitas;
card de despesas;
card de patrimônio investido;
card de taxa de poupança;
lista de lançamentos recentes;
estado vazio quando não houver lançamentos.

Nesta fase, pode ser Server Component chamando o service diretamente, desde que respeite isolamento de usuário.

Se optar por Client Component consumindo API, garantir loading, empty e error state.

Escolha a abordagem mais limpa para a arquitetura existente.

Tarefa 6 — Criar componentes reutilizáveis

Criar componentes em:

src/features/dashboard/components/

Componentes mínimos:

DashboardHeader.tsx
MetricCard.tsx
CashflowCards.tsx
RecentTransactions.tsx
DashboardEmptyState.tsx

Responsabilidades:

DashboardHeader.tsx

Renderizar:

título;
subtítulo;
período selecionado ou atual.
MetricCard.tsx

Card reutilizável para métricas financeiras.

Props sugeridas:

type MetricCardProps = {
  title: string
  value: string
  description?: string
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'info'
}
CashflowCards.tsx

Renderizar conjunto dos principais cards:

saldo operacional;
receitas;
despesas;
patrimônio;
taxa de poupança.
RecentTransactions.tsx

Renderizar lançamentos recentes.

Deve exibir, no mínimo:

descrição;
tipo;
valor;
data;
categoria, se existir.
DashboardEmptyState.tsx

Exibir quando não houver lançamentos no período.

Mensagem sugerida:

Ainda não há lançamentos neste período.
Comece registrando uma receita ou despesa para visualizar seu painel financeiro.
Tarefa 7 — Formatação monetária

Usar exclusivamente:

src/lib/money.ts

Não criar novo formatter BRL dentro dos componentes.

Não usar Intl.NumberFormat diretamente em vários componentes se já houver formatBRL.

Todo valor monetário deve vir em centavos e ser formatado na UI.

Tarefa 8 — Estilo visual

Usar Tailwind e componentes reutilizáveis.

Não usar CSS inline grande.

Não copiar HTML/CSS antigo do Express.

Visual desejado nesta fase:

limpo;
moderno;
responsivo;
estilo fintech;
preparado para dark mode;
cards bem hierarquizados;
sem aparência genérica/amadora;
sem excesso de animação;
sem dependência visual frágil.

Não fazer ainda refinamento visual premium avançado. Isso ficará para fase posterior.

Tarefa 9 — Testes

Criar teste mínimo para:

tests/unit/dashboard.service.test.ts

Cobrir:

resumo sem lançamentos;
resumo com receitas e despesas;
cálculo de taxa de poupança;
patrimônio investido;
uso correto do service/finance engine;
isolamento por usuário, se aplicável ao service.

Se precisar mockar repository/service de lançamentos, faça de forma limpa.

Não usar banco real em teste unitário.

Tarefa 10 — Não fazer nesta fase

Não implementar RAS completo no Dashboard.

Não implementar Escala no Dashboard.

Não implementar cartão de crédito.

Não implementar faturas.

Não implementar gráficos complexos.

Não implementar landing page.

Não mexer em pagamento.

Não refatorar autenticação inteira.

Não mexer em schema Prisma sem necessidade.

Não criar nova arquitetura paralela.

Não reabrir problema de secrets.

Não versionar .env.local, .claude/ ou qualquer arquivo sensível.

Critérios de aceite

A Fase 3 só estará concluída se:

existir dashboard.service.ts;
existir DashboardSummaryDTO;
existir API /api/dashboard/summary;
existir página /dashboard;
Dashboard consumir service/API real;
não houver cálculo financeiro dentro de componente React;
usuário autenticado for centralizado;
nenhum userId vier do client;
cards usarem centavos e formatBRL;
houver empty state;
houver teste do dashboard service;
npm test passar;
npx tsc --noEmit passar;
git status não mostrar arquivos sensíveis rastreados;
nenhuma nova credencial for adicionada ao repositório.
Resultado esperado ao final

Ao terminar, entregue um resumo com:

arquivos criados;
arquivos alterados;
decisões arquiteturais tomadas;
riscos encontrados;
resultado de npm test;
resultado de npx tsc --noEmit;
rota criada;
como testar /dashboard localmente;
próximos passos sugeridos.
Próximo passo após esta fase

Se esta fase ficar estável, a próxima será:

Fase 4 — Refinamento visual fintech premium do Dashboard

Nessa fase futura serão adicionados:

visual mais sofisticado;
cards avançados;
gráficos;
indicadores de tendência;
RAS pendente;
próximo plantão;
próximas obrigações;
alertas inteligentes;
melhor organização responsiva.