# Meu Canga — Correção Crítica de Segurança: Remover Secrets do Repositório

Você atuará como engenheiro full stack sênior com foco em segurança de aplicações financeiras/SaaS.

## Contexto

Durante a migração do Meu Canga para Next.js, foi identificado um problema crítico de segurança: o arquivo `.claude/settings.json` foi versionado no GitHub e contém comandos com `DATABASE_URL` real do Supabase/PostgreSQL, incluindo senha do banco.

Esse tipo de credencial nunca deve estar em arquivos versionados, commits, logs, prompts, prints ou configurações locais rastreadas pelo Git.

## Objetivo

Corrigir imediatamente o vazamento de secrets no repositório local, impedindo que `.claude/`, `.env`, `.env.local` e outros arquivos sensíveis sejam versionados novamente.

## Importante

Não avance para Dashboard, Fase 3, UI ou novas features enquanto esta correção de segurança não estiver concluída.

Esta tarefa é prioritária.

## Tarefas obrigatórias

### 1. Verificar estado atual do Git

Execute:

```bash
git status
git log --oneline -5

Identifique se .claude/settings.json está versionado.

2. Atualizar .gitignore

Adicionar ao .gitignore, se ainda não existir:

# Local Claude Code settings
.claude/

# Environment files
.env
.env.local
.env.*.local

# Local logs and temporary files
*.log
*.tmp

Se já houver regras parecidas, apenas consolide sem duplicar desnecessariamente.

3. Remover .claude/settings.json do controle de versão

Se .claude/settings.json estiver rastreado pelo Git, execute:

git rm --cached .claude/settings.json

Não apagar necessariamente o arquivo local se ele for útil para o ambiente do Claude Code. Apenas remover do versionamento.

Se houver outros arquivos dentro de .claude/ rastreados, remover todos do índice:

git rm -r --cached .claude/
4. Verificar se ainda existem secrets no repositório rastreado

Procure no projeto por padrões sensíveis:

git grep -n "postgresql://"
git grep -n "DATABASE_URL"
git grep -n "supabase.co"
git grep -n "noRGHvbcovYCeI8s"

Também verificar histórico recente se possível:

git log -p -S"noRGHvbcovYCeI8s" --all
git log -p -S"postgresql://postgres" --all

Se encontrar secrets em arquivos rastreados atuais, remover imediatamente.

5. Criar exemplo seguro de env

Se ainda não existir, criar ou revisar:

.env.example

O arquivo deve conter apenas placeholders, nunca credenciais reais:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
NEXT_PUBLIC_APP_NAME="Meu Canga"
NEXT_PUBLIC_APP_VERSION="2.0.0"
CRON_SECRET="change-me"
NEXTAUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"

Não colocar senha real.

6. Commit de correção

Depois da limpeza:

git status
git add .gitignore .env.example
git commit -m "chore: stop tracking local secrets and claude settings"
git push

Se .claude/settings.json foi removido do índice, ele deve aparecer como removido no commit, mas continuar localmente se não tiver sido deletado do disco.

7. Relatório final

Ao concluir, entregue um resumo com:

arquivos alterados;
arquivos removidos do versionamento;
confirmação de que .claude/ está no .gitignore;
confirmação de que .env.local está no .gitignore;
resultado dos comandos git grep;
hash do commit criado;
confirmação de push para origin/main.
Observação crítica

Mesmo após remover o arquivo do versionamento atual, a senha já foi exposta no histórico do GitHub.

Portanto, informe claramente ao final:

A senha do banco Supabase/PostgreSQL precisa ser rotacionada manualmente no painel do Supabase, porque remover o arquivo do Git não invalida a credencial já exposta.

Fora do escopo

Não reescrever histórico Git nesta etapa, a menos que seja explicitamente solicitado.

Não alterar schema Prisma.

Não alterar migrations.

Não mexer no Dashboard.

Não alterar lógica de lançamentos.

Não mexer em RAS, Escala ou pagamentos.

O foco único desta tarefa é contenção de secrets e blindagem para evitar novo vazamento.


Depois rode no Claude Code:

```txt
Leia @Prompt_Correcao_Seguranca_Secrets.md e execute somente essa correção de segurança.