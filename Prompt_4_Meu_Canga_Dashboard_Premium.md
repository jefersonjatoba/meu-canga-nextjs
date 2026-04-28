# Meu Canga — Fase 4: Refinamento Visual Fintech Premium do Dashboard

Você atuará como engenheiro full stack sênior com forte domínio de UX/UI para bancos digitais, fintechs e SaaS financeiros.

A Fase 3 já criou o Dashboard financeiro com dados reais de lançamentos. Agora a missão é elevar a experiência visual e de usabilidade do Dashboard, sem alterar a regra financeira.

## Estado atual

A Fase 3 foi concluída com sucesso:

- Dashboard financeiro com dados reais;
- página `/dashboard`;
- `dashboard.service.ts`;
- `DashboardSummaryDTO`;
- API `/api/dashboard/summary`;
- componentes separados;
- Server Component;
- sem mock data;
- sem cálculo financeiro dentro do React;
- `npm test` passando;
- `npx tsc --noEmit` sem erros;
- branch sincronizada com `origin/main`;
- sem arquivos sensíveis rastreados.

## Objetivo desta fase

Refinar visualmente o Dashboard para um padrão mais profissional, moderno e premium, inspirado em fintechs e apps financeiros de alto nível.

Esta fase deve melhorar:

- hierarquia visual;
- responsividade;
- composição dos cards;
- aparência dos cards financeiros;
- uso de ícones;
- contraste;
- espaçamento;
- microcopy;
- estado vazio;
- leitura rápida dos indicadores;
- preparação para dark mode/light mode;
- aparência geral de produto SaaS premium.

## Diretriz principal

Não alterar regras financeiras.

Não alterar engine financeira.

Não alterar schema Prisma.

Não alterar migrations.

Não mexer em RAS, Escala, Cartão de Crédito, Pagamento, Auth ou Assistente IA.

O refinamento deve atuar principalmente em:

```txt
src/app/dashboard/page.tsx
src/features/dashboard/components/

Só altere dashboard.service.ts se for absolutamente necessário para adicionar algum campo visual simples e não-financeiro, como periodoLabel, e mantendo compatibilidade com testes.

Antes de implementar

Execute e confirme:

git status
npm test
npx tsc --noEmit

Se houver erro, corrija antes de iniciar o refinamento visual.

Tarefa 1 — Avaliar componentes atuais

Analise os componentes atuais:

src/features/dashboard/components/DashboardHeader.tsx
src/features/dashboard/components/MetricCard.tsx
src/features/dashboard/components/CashflowCards.tsx
src/features/dashboard/components/RecentTransactions.tsx
src/features/dashboard/components/DashboardEmptyState.tsx
src/app/dashboard/page.tsx

Identifique onde é possível melhorar sem mudar regra de negócio.

Tarefa 2 — Refinar layout geral do Dashboard

Melhorar a página /dashboard com uma estrutura visual mais premium:

container com largura máxima bem definida;
espaçamento vertical consistente;
grid responsivo;
boa leitura em desktop;
boa leitura em mobile;
cards com alinhamento consistente;
evitar poluição visual;
preservar simplicidade.

Sugestão de estrutura:

DashboardPage
├─ DashboardHeader
├─ FinancialHeroCard
├─ CashflowCards
├─ RecentTransactions
└─ DashboardEmptyState, se aplicável

Se fizer sentido, criar novo componente:

src/features/dashboard/components/FinancialHeroCard.tsx

O FinancialHeroCard deve destacar:

saldo operacional;
período;
mensagem curta contextual;
tom visual premium.
Tarefa 3 — Refinar MetricCard

Melhorar MetricCard.tsx.

Ele deve suportar tons visuais:

tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'info'

Melhorar:

borda;
background;
sombra sutil;
título;
valor;
descrição;
ícone opcional;
responsividade;
estados positivos/negativos.

Não criar dependência pesada. Pode usar lucide-react, pois já existe no projeto.

Tarefa 4 — Refinar CashflowCards

Melhorar CashflowCards.tsx para ficar com aparência de painel financeiro real.

Cards esperados:

Receitas;
Despesas;
Patrimônio investido;
Taxa de poupança;
RAS, se o DTO já tiver valor disponível da Fase 3;
Saldo operacional pode ficar em destaque no FinancialHeroCard.

Regras:

valores sempre formatados com formatBRL de src/lib/money.ts;
taxa de poupança deve ser exibida como percentual;
despesa deve ter tom visual negativo;
receita deve ter tom visual positivo;
patrimônio/investimento deve ter tom info/neutral.
Tarefa 5 — Refinar RecentTransactions

Melhorar RecentTransactions.tsx:

Cada lançamento recente deve exibir:

descrição;
categoria, se existir;
data;
tipo;
valor formatado;
indicador visual positivo/negativo;
espaçamento confortável;
visual limpo;
bom comportamento em mobile.

Se não houver lançamentos, exibir empty state elegante.

Não criar ações de editar/excluir nesta fase.

Tarefa 6 — Refinar DashboardHeader

Melhorar o cabeçalho:

saudação profissional;
subtítulo contextual;
período;
aparência limpa;
alinhamento responsivo.

Não criar seletor de período avançado ainda, a menos que seja simples e não quebre a arquitetura.

Tarefa 7 — Estado vazio premium

Melhorar DashboardEmptyState.tsx para ter aparência mais profissional.

Deve orientar o usuário:

registrar primeira receita;
registrar primeira despesa;
explicar que o dashboard será preenchido automaticamente.

Pode incluir CTA visual, mas sem implementar navegação complexa se a rota ainda não estiver pronta.

Tarefa 8 — Responsividade

Garantir boa experiência em:

mobile;
tablet;
desktop.

Usar Tailwind responsivo.

Não depender de largura fixa rígida.

Tarefa 9 — Dark mode / light mode

Preparar classes para funcionar bem em tema claro e escuro.

Não implementar sistema completo de troca de tema se ainda não existir.

Evitar cores hardcoded excessivas.

Preferir classes Tailwind com boa compatibilidade.

Tarefa 10 — Testes e validação

Como a Fase 4 é visual, não precisa criar muitos testes novos.

Mas deve garantir:

npm test
npx tsc --noEmit

Se alterar props/types, ajustar testes existentes.

Não fazer nesta fase

Não mexer em:

finance.engine.ts;
lancamento.service.ts;
Prisma schema;
migrations;
auth;
pagamento;
RAS completo;
escala;
cartão de crédito;
faturas;
assistente IA;
landing page.

Não adicionar gráfico complexo ainda.

Não criar layout app/sidebar global se isso exigir refatoração grande.

Não criar nova arquitetura paralela.

Não adicionar bibliotecas novas sem necessidade.

Não versionar prompts locais, .env.local, .claude/ ou secrets.

Critérios de aceite

A Fase 4 só estará concluída se:

Dashboard tiver aparência mais profissional e premium;
componentes continuarem separados;
regra financeira não tiver sido movida para React;
npm test passar;
npx tsc --noEmit passar;
não houver arquivos sensíveis rastreados;
não houver mudança desnecessária em Prisma/migrations;
visual estiver responsivo;
empty state estiver melhorado;
código continuar limpo e tipado.
Resultado esperado ao final

Ao terminar, entregue:

arquivos criados;
arquivos alterados;
resumo visual das melhorias;
decisões de UX/UI;
o que não foi alterado propositalmente;
resultado de npm test;
resultado de npx tsc --noEmit;
como testar localmente;
próximos passos sugeridos.
Próximo passo após esta fase

Se esta fase ficar estável, a próxima será uma destas opções:

Fase 5A — Dashboard com gráficos e tendência mensal
Fase 5B — Integração RAS pendente no Dashboard
Fase 5C — Integração próximo plantão/escala no Dashboard
Fase 5D — Tela de lançamentos com UI completa

A escolha deve depender do estado do produto após o refinamento visual.